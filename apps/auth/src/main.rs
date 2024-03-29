#[macro_use]
extern crate rocket;

pub mod context;
pub mod models;
#[allow(warnings, unused)]
pub mod prisma;
pub mod routes;

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![routes::index])
}
