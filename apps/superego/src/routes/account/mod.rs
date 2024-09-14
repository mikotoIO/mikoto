use aide::axum::{routing::post_with, ApiRouter};

mod change_password;
mod login;
mod refresh;
mod register;
mod reset_password;

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
        .api_route(
            "/register",
            post_with(register::route, |o| {
                o.tag("Account")
                    .id("account.register")
                    .summary("User Registration")
            }),
        )
        .api_route(
            "/login",
            post_with(login::route, |o| {
                o.tag("Account").id("account.login").summary("User Login")
            }),
        )
        .api_route(
            "/refresh",
            post_with(refresh::route, |o| {
                o.tag("Account")
                    .id("account.refresh")
                    .summary("Refresh Access Token")
            }),
        )
        .api_route(
            "/change_password",
            post_with(change_password::route, |o| {
                o.tag("Account")
                    .id("account.change_password")
                    .summary("Change Password")
            }),
        )
        .api_route(
            "/reset_password",
            post_with(reset_password::route, |o| {
                o.tag("Account")
                    .id("account.reset_password")
                    .summary("Reset Password")
            }),
        )
        .api_route(
            "/reset_password/submit",
            post_with(reset_password::confirm, |o| {
                o.tag("Account")
                    .id("account.reset_password.confirm")
                    .summary("Confirm Password Reset")
            }),
        )
}
