use sha3::{Digest, Sha3_256};

pub fn sha3(s: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(s);
    hex::encode(hasher.finalize())
}
