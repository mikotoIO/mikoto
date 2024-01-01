#[macro_use]
extern crate rocket;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate serde;
#[macro_use]
extern crate serde_json;

pub mod config;
pub mod env;
pub mod error;
pub mod functions;
pub mod routes;

use config::CONFIG;
use dotenv::dotenv;

#[launch]
fn rocket() -> _ {
    dotenv().ok();

    let _ = CONFIG.len();

    rocket::build()
        .configure(rocket::Config::figment().merge(("port", 9502)))
        .mount(
            "/",
            routes![routes::hello, routes::serve::serve, routes::upload::upload],
        )
}
