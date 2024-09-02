use aide::axum::{routing::post_with, ApiRouter};

mod change_password;
mod login;
mod refresh;
mod register;
mod reset_password;

pub fn router() -> ApiRouter {
    let router = ApiRouter::<()>::new()
        .api_route(
            "/register",
            post_with(register::route, |o| {
                o.tag("account").summary("User Registration")
            }),
        )
        .api_route(
            "/login",
            post_with(login::route, |o| o.tag("account").summary("User Login")),
        )
        .api_route(
            "/refresh",
            post_with(refresh::route, |o| {
                o.tag("account").summary("Refresh Access Token")
            }),
        )
        .api_route(
            "/change_password",
            post_with(change_password::route, |o| {
                o.tag("account").summary("Change Password")
            }),
        )
        .api_route(
            "/reset_password",
            post_with(reset_password::route, |o| {
                o.tag("account").summary("Reset Password")
            }),
        )
        .api_route(
            "/reset_password/submit",
            post_with(reset_password::confirm, |o| {
                o.tag("account").summary("Confirm Password Reset")
            }),
        );

    router
}
