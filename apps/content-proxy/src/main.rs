#[macro_use]
extern crate serde;
#[macro_use]
extern crate serde_json;

pub mod config;
pub mod env;
pub mod error;
pub mod functions;
pub mod routes;

#[tokio::main]
async fn main() {
    let env = env::env();

    let app = routes::router();

    let addr = format!("0.0.0.0:{}", env.mediaserver_port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("Server started on {}", &addr);
    axum::serve(listener, app).await.unwrap();
}
