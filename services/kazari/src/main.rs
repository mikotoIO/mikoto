#[macro_use]
extern crate rocket;

pub mod routes;
pub mod util;

use crate::routes::proxy::proxy;

#[get("/")]
fn hello() -> String {
    format!("Hello, world!")
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![hello, proxy])
}
