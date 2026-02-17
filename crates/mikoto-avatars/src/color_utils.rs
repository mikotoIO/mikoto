use image::{ImageBuffer, Rgba, RgbaImage};

fn rgb_to_hsv(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    let h = if delta == 0.0 {
        0.0
    } else if max == r {
        60.0 * (((g - b) / delta) % 6.0)
    } else if max == g {
        60.0 * (((b - r) / delta) + 2.0)
    } else {
        60.0 * (((r - g) / delta) + 4.0)
    };
    let h = if h < 0.0 { h + 360.0 } else { h };

    let s = if max == 0.0 { 0.0 } else { delta / max };
    let v = max;

    (h, s, v)
}

fn hsv_to_rgb(h: f32, s: f32, v: f32) -> (f32, f32, f32) {
    let c = v * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = v - c;

    let (r, g, b) = if h < 60.0 {
        (c, x, 0.0)
    } else if h < 120.0 {
        (x, c, 0.0)
    } else if h < 180.0 {
        (0.0, c, x)
    } else if h < 240.0 {
        (0.0, x, c)
    } else if h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };

    (r + m, g + m, b + m)
}

pub fn adjust_hsv(img: &RgbaImage, hue_shift: f32, sat_mult: f32, val_mult: f32) -> RgbaImage {
    let (w, h) = img.dimensions();
    let mut out = ImageBuffer::new(w, h);

    for (x, y, pixel) in img.enumerate_pixels() {
        let [r, g, b, a] = pixel.0;
        if a == 0 {
            out.put_pixel(x, y, *pixel);
            continue;
        }

        let (rf, gf, bf) = (r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0);
        let (mut hue, s, v) = rgb_to_hsv(rf, gf, bf);
        hue = (hue + hue_shift) % 360.0;
        if hue < 0.0 {
            hue += 360.0;
        }
        let s = (s * sat_mult).clamp(0.0, 1.0);
        let v = (v * val_mult).clamp(0.0, 1.0);
        let (rf, gf, bf) = hsv_to_rgb(hue, s, v);

        out.put_pixel(
            x,
            y,
            Rgba([
                (rf * 255.0).round() as u8,
                (gf * 255.0).round() as u8,
                (bf * 255.0).round() as u8,
                a,
            ]),
        );
    }

    out
}

pub fn rotate_hue(img: &RgbaImage, degrees: f32) -> RgbaImage {
    let (w, h) = img.dimensions();
    let mut out = ImageBuffer::new(w, h);

    for (x, y, pixel) in img.enumerate_pixels() {
        let [r, g, b, a] = pixel.0;
        if a == 0 {
            out.put_pixel(x, y, *pixel);
            continue;
        }

        let (rf, gf, bf) = (r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0);
        let (mut hue, s, v) = rgb_to_hsv(rf, gf, bf);
        hue = (hue + degrees) % 360.0;
        if hue < 0.0 {
            hue += 360.0;
        }
        let (rf, gf, bf) = hsv_to_rgb(hue, s, v);

        out.put_pixel(
            x,
            y,
            Rgba([
                (rf * 255.0).round() as u8,
                (gf * 255.0).round() as u8,
                (bf * 255.0).round() as u8,
                a,
            ]),
        );
    }

    out
}
