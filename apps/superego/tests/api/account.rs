use reqwest::StatusCode;
use serde_json::json;

use crate::{
    fixtures::{self, PASSWORD},
    harness::run,
};

fn email() -> String {
    format!("{}@example.test", fixtures::short_id())
}

#[test]
fn register_issues_working_tokens() {
    run(|app| async move {
        let email = email();
        let tokens = app
            .post("/account/register")
            .json(json!({ "email": email, "name": "Misaka", "password": PASSWORD }))
            .send()
            .await
            .ok();
        let access = tokens["accessToken"].as_str().unwrap();
        assert!(tokens["refreshToken"].is_string());

        let me = app.get("/users/me").token(access).send().await.ok();
        assert_eq!(me["name"], "Misaka");
        // a default handle is assigned on registration
        assert!(me["handle"].as_str().unwrap().ends_with(".mikoto.test"));
    });
}

#[test]
fn register_validates_password_length() {
    run(|app| async move {
        let body = app
            .post("/account/register")
            .json(json!({ "email": email(), "name": "x", "password": "short" }))
            .send()
            .await
            .expect(StatusCode::BAD_REQUEST);
        assert!(body["message"].as_str().unwrap().contains("at least"));
    });
}

#[test]
fn register_rejects_duplicate_email() {
    run(|app| async move {
        let email = email();
        let register = || {
            app.post("/account/register")
                .json(json!({ "email": email, "name": "x", "password": PASSWORD }))
        };
        register().send().await.ok();
        let res = register().send().await;
        assert!(!res.status.is_success(), "{res:?}");
    });
}

#[test]
fn login_checks_password() {
    run(|app| async move {
        let user = fixtures::user().await;
        let login = |email: &str, password: &str| {
            app.post("/account/login")
                .json(json!({ "email": email, "password": password }))
        };

        let tokens = login(&user.email, PASSWORD).send().await.ok();
        let me = app
            .get("/users/me")
            .token(tokens["accessToken"].as_str().unwrap())
            .send()
            .await
            .ok();
        assert_eq!(me["id"], user.id.to_string());

        login(&user.email, "wrong password")
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
    });
}

#[test]
fn login_does_not_reveal_whether_an_account_exists() {
    run(|app| async move {
        let user = fixtures::user().await;
        let wrong_password = app
            .post("/account/login")
            .json(json!({ "email": user.email, "password": "nope nope nope" }))
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        let no_account = app
            .post("/account/login")
            .json(json!({ "email": email(), "password": "nope nope nope" }))
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        assert_eq!(wrong_password, no_account);
    });
}

#[test]
fn email_is_case_insensitive() {
    run(|app| async move {
        let local = fixtures::short_id();
        app.post("/account/register")
            .json(json!({
                "email": format!("  {local}@Example.TEST "),
                "name": "x",
                "password": PASSWORD,
            }))
            .send()
            .await
            .ok();
        app.post("/account/login")
            .json(json!({ "email": format!("{local}@example.test"), "password": PASSWORD }))
            .send()
            .await
            .ok();
    });
}

#[test]
fn refresh_rotates_the_refresh_token() {
    run(|app| async move {
        let user = fixtures::user().await;
        let tokens = app
            .post("/account/login")
            .json(json!({ "email": user.email, "password": PASSWORD }))
            .send()
            .await
            .ok();
        let refresh = tokens["refreshToken"].as_str().unwrap();

        let renewed = app
            .post("/account/refresh")
            .json(json!({ "refreshToken": refresh }))
            .send()
            .await
            .ok();
        assert_ne!(renewed["refreshToken"], refresh);
        app.get("/users/me")
            .token(renewed["accessToken"].as_str().unwrap())
            .send()
            .await
            .ok();

        // the old refresh token is single-use
        app.post("/account/refresh")
            .json(json!({ "refreshToken": refresh }))
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
    });
}

#[test]
fn auth_endpoints_are_rate_limited_per_ip() {
    run(|app| async move {
        let ip = format!("192.0.2.{}", rand_octet());
        let attempt = || {
            app.post("/account/login")
                .client_ip(&ip)
                .json(json!({ "email": email(), "password": "whatever!" }))
        };
        for _ in 0..10 {
            attempt().send().await.expect(StatusCode::UNAUTHORIZED);
        }
        attempt().send().await.expect(StatusCode::TOO_MANY_REQUESTS);
        // other clients are unaffected
        app.post("/account/login")
            .json(json!({ "email": email(), "password": "whatever!" }))
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
    });
}

fn rand_octet() -> u8 {
    uuid::Uuid::new_v4().as_bytes()[0]
}

#[test]
fn protected_routes_require_a_valid_token() {
    run(|app| async move {
        app.get("/users/me")
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        app.get("/users/me")
            .token("not-a-jwt")
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);

        // correctly shaped, but signed with a different secret
        let forged = jsonwebtoken::encode(
            &jsonwebtoken::Header::default(),
            &json!({
                "sub": uuid::Uuid::new_v4().to_string(),
                "exp": 4_000_000_000u64,
                "iss": "mikoto-test",
                "aud": "mikoto",
            }),
            &jsonwebtoken::EncodingKey::from_secret(b"some other secret"),
        )
        .unwrap();
        app.get("/users/me")
            .token(&forged)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
    });
}

#[test]
fn responses_carry_security_headers() {
    run(|app| async move {
        let res = app.get("/").send().await;
        assert_eq!(res.status, StatusCode::OK);
        assert_eq!(res.headers["x-content-type-options"], "nosniff");
        assert_eq!(res.headers["x-frame-options"], "DENY");
        assert!(res.headers.contains_key("content-security-policy"));
    });
}
