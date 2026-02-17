mod background;
mod color_utils;
mod compositing;
mod layers;

use image::{DynamicImage, imageops::FilterType};
use include_dir::{Dir, include_dir};
use rand::Rng;

static ASSETS: Dir = include_dir!("$CARGO_MANIFEST_DIR/assets");

pub fn generate() -> DynamicImage {
    let mut rng = rand::thread_rng();
    let bg_hue = rng.gen_range(0.0..360.0f32);
    let mut canvas = background::generate(bg_hue);

    let mut result = layers::generate(&ASSETS);

    compositing::add_outline(&mut result.image);
    compositing::composite(&mut canvas, &result.image);

    let (w, h) = (canvas.width(), canvas.height());
    image::DynamicImage::ImageRgba8(canvas).resize_exact(w * 20, h * 20, FilterType::Nearest)
}
