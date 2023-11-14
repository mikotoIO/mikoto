use crate::config::BASE_CONFIG;

#[post("/<store_name>")]
pub fn upload(store_name: String) {
    let store = BASE_CONFIG.stores.get(&store_name).unwrap();
    todo!()
}
