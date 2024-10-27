use chrono::{DateTime, NaiveDateTime, Utc};
use serde::{de::Error, Deserialize, Deserializer, Serialize, Serializer};

pub mod rfc3339 {
    use super::*;

    pub fn serialize<S: Serializer>(datetime: &NaiveDateTime, s: S) -> Result<S::Ok, S::Error> {
        let utc_time = DateTime::<Utc>::from_naive_utc_and_offset(*datetime, Utc);
        utc_time.to_rfc3339().serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<NaiveDateTime, D::Error> {
        let s = String::deserialize(d)?;

        let datetime = DateTime::parse_from_rfc3339(&s)
            .map_err(D::Error::custom)?
            .naive_utc();
        Ok(datetime)
    }
}

pub mod rfc3339_opt {
    use super::*;

    pub fn serialize<S: Serializer>(
        datetime: &Option<NaiveDateTime>,
        s: S,
    ) -> Result<S::Ok, S::Error> {
        match datetime {
            Some(dt) => super::rfc3339::serialize(dt, s),
            None => s.serialize_none(),
        }
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<NaiveDateTime>, D::Error> {
        let s: Option<String> = Option::deserialize(d)?;
        match s {
            Some(datetime_str) => {
                let datetime = DateTime::parse_from_rfc3339(&datetime_str)
                    .map_err(D::Error::custom)?
                    .naive_utc();
                Ok(Some(datetime))
            }
            None => Ok(None),
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::NaiveDate;

    use super::*;

    #[derive(Debug, PartialEq, Serialize, Deserialize)]
    struct Wrapper {
        #[serde(with = "rfc3339")]
        datetime: NaiveDateTime,
    }

    #[test]
    pub fn test_serialize_deserialize_consistency() {
        // Define a sample NaiveDateTime
        let original_datetime = NaiveDate::from_ymd_opt(2023, 10, 26)
            .unwrap()
            .and_hms_opt(12, 34, 56)
            .unwrap();

        // Wrap it in our Wrapper struct
        let original = Wrapper {
            datetime: original_datetime,
        };

        // Serialize the Wrapper struct to a JSON string
        let serialized = serde_json::to_string(&original).expect("Serialization failed");

        // Deserialize the JSON string back to a Wrapper struct
        let deserialized: Wrapper =
            serde_json::from_str(&serialized).expect("Deserialization failed");

        // Check that the original and deserialized instances are equal
        assert_eq!(
            original, deserialized,
            "Original and deserialized instances should be equal"
        );
    }
}
