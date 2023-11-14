#[macro_use]
extern crate rocket;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate serde;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate maplit;

pub mod config;
pub mod error;
pub mod functions;
pub mod routes;

use dotenv::dotenv;

#[launch]
fn rocket() -> _ {
    dotenv().ok();

    // dbg!(functions::storage::MINIO.to_string());

    rocket::build()
        .configure(rocket::Config::figment().merge(("port", 9502)))
        .mount("/", routes![routes::hello, routes::serve::serve])
}
