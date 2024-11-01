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
