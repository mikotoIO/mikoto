use axum::{extract::Request, ServiceExt};
use futures_util::join;
use tower_http::normalize_path::NormalizePathLayer;
use tower_layer::Layer;

#[macro_use]
extern crate log;

#[macro_use]
extern crate serde;

#[macro_use]
extern crate async_trait;

pub mod db;
pub mod entities;
pub mod env;
pub mod error;
pub mod functions;
pub mod middlewares;
pub mod routes;
pub mod services;

#[tokio::main]
async fn main() {
    let env = env::env();
    pretty_env_logger::init();

    println!("{}", include_str!("./ascii2.txt"));
    env.print_env_info();

    let (db, redis) = join!(db::init(), db::init_redis());
    db.unwrap();
    redis.unwrap();
    let app = routes::router();
    let app = NormalizePathLayer::trim_trailing_slash().layer(app);

    let addr = format!("0.0.0.0:{}", env.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    info!(
        "👉⚡🪙  Mikoto API server is running on on http://{}",
        &addr
    );
    info!(
        "You can see the API documentation on http://{}/scalar",
        &addr
    );
    axum::serve(listener, ServiceExt::<Request>::into_make_service(app))
        .await
        .unwrap();
}
