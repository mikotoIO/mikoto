use std::collections::HashMap;
use std::hash::Hash;
use std::iter::IntoIterator;

pub mod jwt;

pub fn group_by<T, K, I, F>(iter: I, key_fn: F) -> HashMap<K, Vec<T>>
where
    K: Eq + Hash,
    I: IntoIterator<Item = T>,
    F: Fn(&T) -> K,
{
    let mut map = HashMap::new();
    for item in iter {
        let key = key_fn(&item);
        map.entry(key).or_insert_with(Vec::new).push(item);
    }
    map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Debug, PartialEq)]
    struct User {
        id: u64,
        name: String,
    }

    #[test]
    fn test_group_by() {
        let users = vec![
            User {
                id: 1,
                name: "Alice".to_string(),
            },
            User {
                id: 2,
                name: "Bob".to_string(),
            },
            User {
                id: 1,
                name: "Charlie".to_string(),
            },
        ];
        let grouped = group_by(users.into_iter(), |user| user.id);
        let mut expected: HashMap<u64, _> = HashMap::new();
        expected.insert(
            1,
            vec![
                User {
                    id: 1,
                    name: "Alice".to_string(),
                },
                User {
                    id: 1,
                    name: "Charlie".to_string(),
                },
            ],
        );
        expected.insert(
            2,
            vec![User {
                id: 2,
                name: "Bob".to_string(),
            }],
        );
        assert_eq!(grouped, expected);
    }
}
