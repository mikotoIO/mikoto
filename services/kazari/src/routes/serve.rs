#[get("/content")]
fn content() -> String {
    format!("Hello, world!")
}