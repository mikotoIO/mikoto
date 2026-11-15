use std::{
    collections::HashMap,
    sync::{Mutex, OnceLock},
    time::{Duration, Instant},
};

use axum::http::{request::Parts, HeaderMap};

use crate::error::Error;

struct RateLimitEntry {
    count: u32,
    window_start: Instant,
}

pub struct RateLimiter {
    state: Mutex<HashMap<String, RateLimitEntry>>,
    max_requests: u32,
    window: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: u32, window: Duration) -> Self {
        Self {
            state: Mutex::new(HashMap::new()),
            max_requests,
            window,
        }
    }

    pub fn check(&self, key: &str) -> Result<(), Error> {
        let mut state = self
            .state
            .lock()
            .map_err(|_| Error::internal("Rate limiter lock poisoned"))?;
        let now = Instant::now();

        // Periodic cleanup: remove expired entries when map grows large
        if state.len() > 10000 {
            state.retain(|_, entry| now.duration_since(entry.window_start) <= self.window);
        }

        let entry = state.entry(key.to_string()).or_insert(RateLimitEntry {
            count: 0,
            window_start: now,
        });

        if now.duration_since(entry.window_start) > self.window {
            entry.count = 1;
            entry.window_start = now;
            return Ok(());
        }

        entry.count += 1;
        if entry.count > self.max_requests {
            return Err(Error::new(
                "RateLimited",
                axum::http::StatusCode::TOO_MANY_REQUESTS,
                "Too many requests. Please try again later.",
            ));
        }

        Ok(())
    }
}

/// Extract client IP from request Parts, preferring X-Forwarded-For
pub fn client_ip(parts: &Parts) -> String {
    client_ip_from_headers(&parts.headers)
}

/// Extract client IP from HeaderMap, preferring X-Forwarded-For
pub fn client_ip_from_headers(headers: &HeaderMap) -> String {
    if let Some(forwarded) = headers.get("x-forwarded-for") {
        if let Ok(val) = forwarded.to_str() {
            if let Some(ip) = val.split(',').next() {
                return ip.trim().to_string();
            }
        }
    }
    if let Some(real_ip) = headers.get("x-real-ip") {
        if let Ok(val) = real_ip.to_str() {
            return val.trim().to_string();
        }
    }
    "unknown".to_string()
}

/// Rate limiter for auth endpoints: 10 requests per 60 seconds per IP
pub fn auth_rate_limiter() -> &'static RateLimiter {
    static LIMITER: OnceLock<RateLimiter> = OnceLock::new();
    LIMITER.get_or_init(|| RateLimiter::new(10, Duration::from_secs(60)))
}

#[cfg(test)]
mod tests {
    use axum::http::HeaderValue;

    use super::*;

    #[test]
    fn allows_up_to_the_limit_then_rejects() {
        let limiter = RateLimiter::new(3, Duration::from_secs(60));
        for _ in 0..3 {
            assert!(limiter.check("ip").is_ok());
        }
        match limiter.check("ip") {
            Err(Error::Miscallaneous { code, status, .. }) => {
                assert_eq!(code, "RateLimited");
                assert_eq!(status, axum::http::StatusCode::TOO_MANY_REQUESTS);
            }
            other => panic!("expected rate limit error, got {other:?}"),
        }
        // stays limited for the rest of the window
        assert!(limiter.check("ip").is_err());
    }

    #[test]
    fn keys_are_independent() {
        let limiter = RateLimiter::new(1, Duration::from_secs(60));
        assert!(limiter.check("a").is_ok());
        assert!(limiter.check("a").is_err());
        assert!(limiter.check("b").is_ok());
    }

    #[test]
    fn window_resets() {
        let limiter = RateLimiter::new(1, Duration::from_millis(20));
        assert!(limiter.check("ip").is_ok());
        assert!(limiter.check("ip").is_err());
        std::thread::sleep(Duration::from_millis(40));
        assert!(limiter.check("ip").is_ok());
        assert!(limiter.check("ip").is_err());
    }

    #[test]
    fn evicts_expired_entries_when_large() {
        let limiter = RateLimiter::new(1, Duration::from_millis(1));
        for i in 0..=10_000 {
            limiter.check(&i.to_string()).unwrap();
        }
        std::thread::sleep(Duration::from_millis(5));
        limiter.check("trigger").unwrap();
        assert_eq!(limiter.state.lock().unwrap().len(), 1);
    }

    fn headers(pairs: &[(&'static str, &str)]) -> HeaderMap {
        let mut map = HeaderMap::new();
        for (k, v) in pairs {
            map.insert(*k, HeaderValue::from_str(v).unwrap());
        }
        map
    }

    #[test]
    fn client_ip_prefers_first_forwarded_for_entry() {
        let h = headers(&[
            ("x-forwarded-for", " 203.0.113.7 , 10.0.0.1"),
            ("x-real-ip", "10.0.0.2"),
        ]);
        assert_eq!(client_ip_from_headers(&h), "203.0.113.7");
    }

    #[test]
    fn client_ip_falls_back_to_real_ip_then_unknown() {
        assert_eq!(
            client_ip_from_headers(&headers(&[("x-real-ip", " 10.0.0.2 ")])),
            "10.0.0.2"
        );
        assert_eq!(client_ip_from_headers(&HeaderMap::new()), "unknown");
    }

    #[test]
    fn client_ip_reads_request_parts() {
        let (parts, _) = axum::http::Request::builder()
            .header("x-forwarded-for", "198.51.100.1")
            .body(())
            .unwrap()
            .into_parts();
        assert_eq!(client_ip(&parts), "198.51.100.1");
    }
}
