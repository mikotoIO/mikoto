#[macro_use]
extern crate rocket;

pub mod routes;

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![routes::index])
}
