use std::sync::OnceLock;

use chrono::Duration;
use libdelve::verifier::Verifier;

use crate::env::env;

static VERIFIER: OnceLock<Verifier> = OnceLock::new();

pub fn verifier() -> &'static Verifier {
    VERIFIER.get_or_init(|| {
        let env = env();
        Verifier::new(&env.issuer, Duration::minutes(30))
    })
}
