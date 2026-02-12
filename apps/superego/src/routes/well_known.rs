use aide::axum::{routing::get_with, ApiRouter};
use axum::Json;

use crate::{env::env, error::Error, model};

model!(
    pub struct InstanceInfo {
        pub domain: String,
        pub handle_domain: String,
        pub public_key: Option<String>,
        pub api_endpoint: String,
    }
);

async fn instance_info() -> Result<Json<InstanceInfo>, Error> {
    let env = env();

    Ok(Json(InstanceInfo {
        domain: env.handle.domain.clone(),
        handle_domain: env.handle.domain.clone(),
        public_key: env.handle.public_key.clone(),
        api_endpoint: env.web_url.clone(),
    }))
}

static TAG: &str = "Instance";

pub fn router() -> ApiRouter {
    ApiRouter::new().api_route(
        "/mikoto/instance.json",
        get_with(instance_info, |o| {
            o.tag(TAG)
                .id("instance.info")
                .summary("Get Instance Information")
                .description(
                    "Returns instance information for federation, including the public key for verifying handle attestations.",
                )
        }),
    )
}
