#[macro_use]
extern crate serde;
#[macro_use]
extern crate serde_json;

pub mod config;
pub mod error;
pub mod functions;
pub mod routes;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    let app = routes::router();

    let listener = tokio::net::TcpListener::bind("0.0.0.0:9502").await.unwrap();
    println!("Server started!");
    axum::serve(listener, app).await.unwrap();
}
