use log::info;

#[macro_use]
extern crate serde;

pub mod db;
pub mod entities;
pub mod env;
pub mod error;
pub mod functions;
pub mod routes;

#[tokio::main]
async fn main() {
    let env = env::env();
    pretty_env_logger::init();

    db::init().await.unwrap();
    let app = routes::router();

    let addr = format!("0.0.0.0:{}", env.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    info!("Auth server started on http://{}", &addr);
    axum::serve(listener, app).await.unwrap();
}
