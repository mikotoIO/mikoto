use std::ops::{Add, Sub};

use chrono::{DateTime, NaiveDateTime, TimeDelta, Utc};
use schemars::{schema, JsonSchema};
use serde::{de::Error, Deserialize, Deserializer, Serialize, Serializer};

/// A simple UTC time that is stored as a timezoneless type, but serialized as a UTC time.
#[derive(sqlx::Type, Clone, Copy, Debug)]
#[sqlx(transparent)]
pub struct Timestamp(pub NaiveDateTime);

impl Timestamp {
    pub fn now() -> Self {
        Self(Utc::now().naive_utc())
    }
}

impl Add<TimeDelta> for Timestamp {
    type Output = Self;

    fn add(self, rhs: TimeDelta) -> Self::Output {
        Self(self.0 + rhs)
    }
}

impl Sub for Timestamp {
    type Output = TimeDelta;

    fn sub(self, rhs: Timestamp) -> Self::Output {
        self.0 - rhs.0
    }
}

impl From<NaiveDateTime> for Timestamp {
    fn from(value: NaiveDateTime) -> Self {
        Self(value)
    }
}

impl From<Timestamp> for NaiveDateTime {
    fn from(value: Timestamp) -> Self {
        value.0
    }
}

impl JsonSchema for Timestamp {
    fn schema_name() -> String {
        "Timestamp".to_string()
    }

    fn json_schema(_: &mut schemars::gen::SchemaGenerator) -> schemars::schema::Schema {
        schema::Schema::Object(schema::SchemaObject {
            instance_type: Some(schema::InstanceType::String.into()),
            format: Some("date-time".into()),
            ..schema::SchemaObject::default()
        })
    }
}

impl Serialize for Timestamp {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let utc_time = DateTime::<Utc>::from_naive_utc_and_offset(self.0, Utc);
        utc_time.to_rfc3339().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Timestamp {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;

        let datetime = DateTime::parse_from_rfc3339(&s)
            .map_err(D::Error::custom)?
            .naive_utc();
        Ok(Self(datetime))
    }
}

#[cfg(test)]
mod tests {
    use chrono::NaiveDate;

    use super::*;

    fn ts(h: u32, m: u32, s: u32) -> Timestamp {
        NaiveDate::from_ymd_opt(2024, 3, 1)
            .unwrap()
            .and_hms_opt(h, m, s)
            .unwrap()
            .into()
    }

    #[test]
    fn serializes_as_utc_rfc3339() {
        let json = serde_json::to_string(&ts(12, 30, 0)).unwrap();
        assert_eq!(json, r#""2024-03-01T12:30:00+00:00""#);
    }

    #[test]
    fn deserialization_normalizes_offsets_to_utc() {
        let t: Timestamp = serde_json::from_str(r#""2024-03-01T21:30:00+09:00""#).unwrap();
        assert_eq!(t.0, ts(12, 30, 0).0);
        let t: Timestamp = serde_json::from_str(r#""2024-03-01T12:30:00Z""#).unwrap();
        assert_eq!(t.0, ts(12, 30, 0).0);
    }

    #[test]
    fn round_trips() {
        let original = ts(1, 2, 3);
        let back: Timestamp =
            serde_json::from_str(&serde_json::to_string(&original).unwrap()).unwrap();
        assert_eq!(back.0, original.0);
    }

    #[test]
    fn rejects_non_rfc3339_strings() {
        assert!(serde_json::from_str::<Timestamp>(r#""2024-03-01 12:30:00""#).is_err());
        assert!(serde_json::from_str::<Timestamp>(r#""yesterday""#).is_err());
        assert!(serde_json::from_str::<Timestamp>("1709296200").is_err());
    }

    #[test]
    fn arithmetic() {
        let a = ts(12, 0, 0);
        let b = a + TimeDelta::minutes(90);
        assert_eq!(b.0, ts(13, 30, 0).0);
        assert_eq!(b - a, TimeDelta::minutes(90));
        assert_eq!(a - b, TimeDelta::minutes(-90));
    }

    #[test]
    fn schema_is_a_date_time_string() {
        let schema = schemars::schema_for!(Timestamp);
        let value = serde_json::to_value(&schema).unwrap();
        assert_eq!(value["type"], "string");
        assert_eq!(value["format"], "date-time");
    }
}
