//! Test harness: boots one superego server per test binary against a
//! throwaway Postgres database and Redis, and offers a small HTTP client.
//!
//! Defaults match `docker compose up -d postgres redis`. Override with
//! `TEST_DATABASE_URL` (its database name must end in `_test`; it is dropped
//! and recreated on every run) and `TEST_REDIS_URL`.
//!
//! When the services aren't reachable the tests are skipped with a warning,
//! unless `CI` or `MIKOTO_REQUIRE_INTEGRATION` is set, in which case they fail.

use std::{
    future::Future,
    net::SocketAddr,
    sync::{
        atomic::{AtomicU32, Ordering},
        OnceLock,
    },
    time::Duration,
};

use axum::{extract::Request, ServiceExt};
use reqwest::{Method, StatusCode};
use serde_json::Value;
use sqlx::{migrate::MigrateDatabase, Postgres};
use tokio::{net::TcpStream, runtime::Runtime};
use tower_http::normalize_path::NormalizePathLayer;
use tower_layer::Layer;

use crate::fixtures::TestUser;

const DEFAULT_DATABASE_URL: &str = "postgres://postgres:postgres@localhost:35101/mikoto_test";
const DEFAULT_REDIS_URL: &str = "redis://localhost:35102";

/// superego keeps its DB pool and Redis client in process-wide statics, so
/// every test shares one runtime (a pool can't outlive the runtime that
/// created it).
fn runtime() -> &'static Runtime {
    static RUNTIME: OnceLock<Runtime> = OnceLock::new();
    RUNTIME.get_or_init(|| {
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("failed to build test runtime")
    })
}

#[derive(Clone)]
pub struct TestApp {
    pub addr: SocketAddr,
    http: reqwest::Client,
}

/// Run an integration test. Skips (returns) if the services are unavailable.
pub fn run<F, Fut>(test: F)
where
    F: FnOnce(TestApp) -> Fut,
    Fut: Future<Output = ()>,
{
    static APP: OnceLock<Option<TestApp>> = OnceLock::new();
    let app = APP.get_or_init(|| runtime().block_on(start())).clone();
    if let Some(app) = app {
        runtime().block_on(test(app));
    }
}

async fn reachable(url: &str) -> bool {
    let Ok(url) = url::Url::parse(url) else {
        return false;
    };
    let (Some(host), Some(port)) = (url.host_str(), url.port_or_known_default()) else {
        return false;
    };
    matches!(
        tokio::time::timeout(Duration::from_secs(2), TcpStream::connect((host, port))).await,
        Ok(Ok(_))
    )
}

async fn start() -> Option<TestApp> {
    let database_url =
        std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| DEFAULT_DATABASE_URL.into());
    let redis_url = std::env::var("TEST_REDIS_URL").unwrap_or_else(|_| DEFAULT_REDIS_URL.into());

    if !reachable(&database_url).await || !reachable(&redis_url).await {
        let required = std::env::var_os("CI").is_some()
            || std::env::var_os("MIKOTO_REQUIRE_INTEGRATION").is_some();
        let msg = format!(
            "Postgres ({database_url}) or Redis ({redis_url}) is not reachable. \
             Start them with `docker compose up -d postgres redis`, or set \
             TEST_DATABASE_URL / TEST_REDIS_URL."
        );
        if required {
            panic!("{msg}");
        }
        // Not eprintln!: the test harness would capture it.
        use std::io::Write;
        let _ = writeln!(
            std::io::stderr(),
            "\n⚠️  Skipping superego integration tests: {msg}\n"
        );
        return None;
    }

    let db_name = url::Url::parse(&database_url)
        .ok()
        .map(|u| u.path().trim_start_matches('/').to_string())
        .unwrap_or_default();
    assert!(
        db_name.ends_with("_test"),
        "refusing to use database {db_name:?}: the integration tests drop it, \
         so its name must end in `_test`"
    );
    if Postgres::database_exists(&database_url).await.unwrap() {
        Postgres::force_drop_database(&database_url).await.unwrap();
    }

    // superego reads configuration from the environment exactly once. Values
    // set here win over any `.env` file (dotenvy does not override).
    for (key, value) in [
        ("MIKOTO_ENV", "TEST"),
        ("DATABASE_URL", database_url.as_str()),
        ("REDIS_URL", redis_url.as_str()),
        ("AUTOMIGRATE", "true"),
        ("ISSUER", "mikoto-test"),
        ("SERVER_PORT", "0"),
        ("SECRET", "integration-test-secret"),
        ("WEB_URL", "http://localhost:3510"),
        ("S3_ENDPOINT", "http://localhost:35103"),
        ("S3_BUCKET", "mikoto-test"),
        ("S3_USE_SSL", "false"),
        ("HANDLE_DOMAIN", "mikoto.test"),
    ] {
        std::env::set_var(key, value);
    }

    superego::db::init().await.expect("database init failed");
    superego::db::init_redis().await.expect("redis init failed");

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    // Same stack as main.rs.
    let app = NormalizePathLayer::trim_trailing_slash().layer(superego::routes::router());
    tokio::spawn(async move {
        axum::serve(listener, ServiceExt::<Request>::into_make_service(app))
            .await
            .unwrap();
    });

    Some(TestApp {
        addr,
        http: reqwest::Client::new(),
    })
}

impl TestApp {
    pub fn ws_url(&self) -> String {
        format!("ws://{}/ws", self.addr)
    }

    pub fn request(&self, method: Method, path: &str) -> Req {
        Req {
            inner: self
                .http
                .request(method, format!("http://{}{}", self.addr, path)),
            ip: None,
        }
    }

    pub fn get(&self, path: &str) -> Req {
        self.request(Method::GET, path)
    }
    pub fn post(&self, path: &str) -> Req {
        self.request(Method::POST, path)
    }
    pub fn patch(&self, path: &str) -> Req {
        self.request(Method::PATCH, path)
    }
    pub fn put(&self, path: &str) -> Req {
        self.request(Method::PUT, path)
    }
    pub fn delete(&self, path: &str) -> Req {
        self.request(Method::DELETE, path)
    }
}

pub struct Req {
    inner: reqwest::RequestBuilder,
    ip: Option<String>,
}

impl Req {
    pub fn auth(self, user: &TestUser) -> Self {
        self.token(&user.token)
    }

    pub fn token(mut self, token: &str) -> Self {
        self.inner = self.inner.bearer_auth(token);
        self
    }

    pub fn json(mut self, body: Value) -> Self {
        self.inner = self.inner.json(&body);
        self
    }

    /// Pin the client IP the server sees. By default every request gets a
    /// fresh one, so the per-IP auth rate limit doesn't leak between tests.
    pub fn client_ip(mut self, ip: &str) -> Self {
        self.ip = Some(ip.to_string());
        self
    }

    pub async fn send(self) -> Res {
        let ip = self.ip.unwrap_or_else(unique_ip);
        let res = self
            .inner
            .header("x-forwarded-for", ip)
            .send()
            .await
            .expect("request failed");
        let status = res.status();
        let headers = res.headers().clone();
        let text = res.text().await.unwrap();
        let body = if text.is_empty() {
            Value::Null
        } else {
            serde_json::from_str(&text).unwrap_or(Value::String(text))
        };
        Res {
            status,
            headers,
            body,
        }
    }
}

fn unique_ip() -> String {
    static NEXT: AtomicU32 = AtomicU32::new(1);
    let n = NEXT.fetch_add(1, Ordering::Relaxed);
    format!("10.{}.{}.{}", (n >> 16) & 255, (n >> 8) & 255, n & 255)
}

#[derive(Debug)]
pub struct Res {
    pub status: StatusCode,
    pub headers: reqwest::header::HeaderMap,
    pub body: Value,
}

impl Res {
    /// Assert a 2xx response and return its body.
    #[track_caller]
    pub fn ok(self) -> Value {
        assert!(
            self.status.is_success(),
            "expected success, got {}: {}",
            self.status,
            self.body
        );
        self.body
    }

    /// Assert the given status and return the body.
    #[track_caller]
    pub fn expect(self, status: StatusCode) -> Value {
        assert_eq!(
            self.status, status,
            "unexpected status; body: {}",
            self.body
        );
        self.body
    }
}
