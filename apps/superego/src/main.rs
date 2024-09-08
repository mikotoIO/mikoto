use futures_util::join;
use log::info;

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

#[tokio::main]
async fn main() {
    let env = env::env();
    pretty_env_logger::init();

    let (db, redis) = join!(db::init(), db::init_redis());
    db.unwrap();
    redis.unwrap();
    let app = routes::router();

    let addr = format!("0.0.0.0:{}", env.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    info!("Auth server started on http://{}", &addr);
    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}
