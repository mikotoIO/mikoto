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

#[cfg(test)]
mod tests {
    use super::*;

    fn close(a: (f32, f32, f32), b: (f32, f32, f32)) -> bool {
        (a.0 - b.0).abs() < 1e-3 && (a.1 - b.1).abs() < 1e-3 && (a.2 - b.2).abs() < 1e-3
    }

    #[test]
    fn primaries_to_hsv() {
        assert!(close(rgb_to_hsv(1.0, 0.0, 0.0), (0.0, 1.0, 1.0)));
        assert!(close(rgb_to_hsv(0.0, 1.0, 0.0), (120.0, 1.0, 1.0)));
        assert!(close(rgb_to_hsv(0.0, 0.0, 1.0), (240.0, 1.0, 1.0)));
        assert!(close(rgb_to_hsv(0.0, 0.0, 0.0), (0.0, 0.0, 0.0)));
        assert!(close(rgb_to_hsv(0.5, 0.5, 0.5), (0.0, 0.0, 0.5)));
        // magenta: red is max with g < b, hue must wrap to positive
        assert!(close(rgb_to_hsv(1.0, 0.0, 1.0), (300.0, 1.0, 1.0)));
    }

    #[test]
    fn hsv_round_trips() {
        for &(r, g, b) in &[
            (0.2, 0.4, 0.6),
            (0.9, 0.1, 0.3),
            (0.0, 0.7, 0.2),
            (1.0, 1.0, 1.0),
            (0.33, 0.33, 0.1),
        ] {
            let (h, s, v) = rgb_to_hsv(r, g, b);
            assert!(close(hsv_to_rgb(h, s, v), (r, g, b)), "({r}, {g}, {b})");
        }
    }

    fn one_pixel(p: [u8; 4]) -> RgbaImage {
        ImageBuffer::from_pixel(1, 1, Rgba(p))
    }

    #[test]
    fn rotate_hue_shifts_colors() {
        let red = one_pixel([255, 0, 0, 255]);
        assert_eq!(rotate_hue(&red, 120.0).get_pixel(0, 0).0, [0, 255, 0, 255]);
        assert_eq!(rotate_hue(&red, -120.0).get_pixel(0, 0).0, [0, 0, 255, 255]);
        assert_eq!(rotate_hue(&red, 360.0).get_pixel(0, 0).0, [255, 0, 0, 255]);
    }

    #[test]
    fn transparent_pixels_are_untouched() {
        let img = one_pixel([12, 34, 56, 0]);
        assert_eq!(rotate_hue(&img, 90.0).get_pixel(0, 0).0, [12, 34, 56, 0]);
        assert_eq!(
            adjust_hsv(&img, 90.0, 2.0, 2.0).get_pixel(0, 0).0,
            [12, 34, 56, 0]
        );
    }

    #[test]
    fn adjust_hsv_scales_and_clamps() {
        let img = one_pixel([200, 100, 100, 128]);
        // desaturate fully: grey at the same value, alpha preserved
        assert_eq!(
            adjust_hsv(&img, 0.0, 0.0, 1.0).get_pixel(0, 0).0,
            [200, 200, 200, 128]
        );
        // value is clamped to 1.0
        let bright = adjust_hsv(&img, 0.0, 1.0, 10.0).get_pixel(0, 0).0;
        assert_eq!(bright[0], 255);
        // identity
        assert_eq!(
            adjust_hsv(&img, 0.0, 1.0, 1.0).get_pixel(0, 0).0,
            [200, 100, 100, 128]
        );
    }
}
