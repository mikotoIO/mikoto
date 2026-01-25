use axum::{extract::Request, ServiceExt};
use futures_util::try_join;
use log::info;
use tower_http::normalize_path::NormalizePathLayer;
use tower_layer::Layer;

use superego::{db, dump::dump, env, error::Error, routes};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let env = env::env();
    pretty_env_logger::init();

    println!("{}", include_str!("./ascii2.txt"));
    env.print_env_info();

    let (_db, _redis) = try_join!(db::init(), db::init_redis())?;

    dump().await?;

    let app = routes::router();
    let app = NormalizePathLayer::trim_trailing_slash().layer(app);

    let addr = format!("0.0.0.0:{}", env.server_port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    info!(
        "👉⚡🪙  Mikoto API server is running on on http://{}",
        &addr
    );
    info!(
        "You can see the API documentation on http://{}/scalar",
        &addr
    );
    Ok(axum::serve(listener, ServiceExt::<Request>::into_make_service(app)).await?)
}
