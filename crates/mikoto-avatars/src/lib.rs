mod background;
mod color_utils;
mod compositing;
mod layers;

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use image::{DynamicImage, ImageFormat, imageops::FilterType};
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

    let mut image = layers::generate(&ASSETS, &mut rng);

    compositing::add_outline(&mut image);
    compositing::composite(&mut canvas, &image);

    let (w, h) = (canvas.width(), canvas.height());
    image::DynamicImage::ImageRgba8(canvas).resize_exact(w * 20, h * 20, FilterType::Nearest)
}

pub fn generate_png(seed: &str) -> Vec<u8> {
    let image = generate(seed);
    let mut buf = Vec::new();
    image
        .write_to(&mut std::io::Cursor::new(&mut buf), ImageFormat::Png)
        .expect("PNG encoding should not fail");
    buf
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_seed_same_avatar() {
        assert_eq!(generate("alice").as_bytes(), generate("alice").as_bytes());
    }

    #[test]
    fn different_seeds_differ() {
        assert_ne!(generate("alice").as_bytes(), generate("bob").as_bytes());
    }

    #[test]
    fn output_is_an_upscaled_opaque_png() {
        let png = generate_png("carol");
        assert_eq!(&png[..8], b"\x89PNG\r\n\x1a\n");
        let decoded = image::load_from_memory(&png).unwrap().to_rgba8();
        assert_eq!(decoded.width() % 20, 0);
        assert_eq!(decoded.height() % 20, 0);
        assert!(decoded.pixels().all(|p| p.0[3] == 255));
    }
}
