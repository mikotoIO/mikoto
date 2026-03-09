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
