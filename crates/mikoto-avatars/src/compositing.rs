use image::{Rgba, RgbaImage};
use include_dir::Dir;
use rand::Rng;

pub fn load_png(data: &[u8]) -> RgbaImage {
    image::load_from_memory(data)
        .expect("failed to decode embedded png")
        .to_rgba8()
}

pub fn scale_alpha(image: &mut RgbaImage, factor: f32) {
    for pixel in image.pixels_mut() {
        pixel.0[3] = (pixel.0[3] as f32 * factor).round().min(255.0) as u8;
    }
}

pub fn composite(base: &mut RgbaImage, layer: &RgbaImage) {
    for (x, y, pixel) in layer.enumerate_pixels() {
        if x >= base.width() || y >= base.height() {
            continue;
        }
        let [sr, sg, sb, sa] = pixel.0;
        if sa == 0 {
            continue;
        }

        let dst = base.get_pixel(x, y);
        let [dr, dg, db, da] = dst.0;

        let sa_f = sa as f32 / 255.0;
        let da_f = da as f32 / 255.0;
        let out_a = sa_f + da_f * (1.0 - sa_f);

        if out_a == 0.0 {
            base.put_pixel(x, y, Rgba([0, 0, 0, 0]));
            continue;
        }

        let blend = |s: u8, d: u8| -> u8 {
            ((s as f32 * sa_f + d as f32 * da_f * (1.0 - sa_f)) / out_a).round() as u8
        };

        base.put_pixel(
            x,
            y,
            Rgba([
                blend(sr, dr),
                blend(sg, dg),
                blend(sb, db),
                (out_a * 255.0).round() as u8,
            ]),
        );
    }
}

pub fn add_outline(image: &mut RgbaImage) {
    let (w, h) = (image.width(), image.height());
    let mut outline_pixels = Vec::new();

    for y in 0..h {
        for x in 0..w {
            if image.get_pixel(x, y).0[3] > 0 {
                continue;
            }
            let has_opaque_neighbor = [
                x.checked_sub(1).map(|nx| (nx, y)),
                if x + 1 < w { Some((x + 1, y)) } else { None },
                y.checked_sub(1).map(|ny| (x, ny)),
                if y + 1 < h { Some((x, y + 1)) } else { None },
            ]
            .iter()
            .flatten()
            .any(|&(nx, ny)| image.get_pixel(nx, ny).0[3] > 0);

            if has_opaque_neighbor {
                outline_pixels.push((x, y));
            }
        }
    }

    for (x, y) in outline_pixels {
        image.put_pixel(x, y, Rgba([0, 0, 0, 255]));
    }
}

pub fn pick_random_png<'a>(dir: &Dir<'a>) -> (&'a str, &'a [u8]) {
    let mut rng = rand::thread_rng();
    let pngs: Vec<_> = dir
        .files()
        .filter(|f| f.path().extension().is_some_and(|ext| ext == "png"))
        .collect();

    assert!(!pngs.is_empty(), "no png assets found in {:?}", dir.path());
    let file = pngs[rng.gen_range(0..pngs.len())];
    let name = file.path().file_stem().unwrap().to_str().unwrap();
    (name, file.contents())
}
