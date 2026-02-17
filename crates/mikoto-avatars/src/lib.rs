mod background;
mod color_utils;
mod compositing;
mod layers;

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use image::{DynamicImage, imageops::FilterType};
use include_dir::{Dir, include_dir};
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};

static ASSETS: Dir = include_dir!("$CARGO_MANIFEST_DIR/assets");

pub fn generate(seed: &str) -> DynamicImage {
    let mut hasher = DefaultHasher::new();
    seed.hash(&mut hasher);
    let mut rng = StdRng::seed_from_u64(hasher.finish());

    let bg_hue = rng.gen_range(0.0..360.0f32);
    let mut canvas = background::generate(bg_hue, &mut rng);

    let mut result = layers::generate(&ASSETS, &mut rng);

    compositing::add_outline(&mut result.image);
    compositing::composite(&mut canvas, &result.image);

    let (w, h) = (canvas.width(), canvas.height());
    image::DynamicImage::ImageRgba8(canvas).resize_exact(w * 20, h * 20, FilterType::Nearest)
}
