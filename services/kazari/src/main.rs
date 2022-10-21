#[macro_use]
extern crate rocket;
#[macro_use]
extern crate lazy_static;

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
