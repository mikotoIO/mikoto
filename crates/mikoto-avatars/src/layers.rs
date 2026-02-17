use crate::color_utils::{adjust_hsv, rotate_hue};
use crate::compositing::{composite, load_png, pick_random_png, scale_alpha};
use image::RgbaImage;
use include_dir::Dir;
use rand::Rng;
use std::collections::HashMap;

pub enum Source {
    File(&'static str),
    RandomFrom(&'static str),
}

pub enum ColorTransform {
    AdjustHsv,
    RotateHue,
    ShareHue(&'static str),
    None,
}

pub struct LayerDef {
    pub name: &'static str,
    pub source: Source,
    pub color: ColorTransform,
    pub alpha: f32,
}

pub const LAYERS: &[LayerDef] = &[
    LayerDef {
        name: "body",
        source: Source::File("body.png"),
        color: ColorTransform::AdjustHsv,
        alpha: 1.0,
    },
    LayerDef {
        name: "eyes",
        source: Source::RandomFrom("eyes"),
        color: ColorTransform::RotateHue,
        alpha: 1.0,
    },
    LayerDef {
        name: "hair",
        source: Source::RandomFrom("hair"),
        color: ColorTransform::RotateHue,
        alpha: 1.0,
    },
    LayerDef {
        name: "eyebrows",
        source: Source::RandomFrom("eyebrows"),
        color: ColorTransform::ShareHue("hair"),
        alpha: 1.0,
    },
    LayerDef {
        name: "mouth",
        source: Source::RandomFrom("mouth"),
        color: ColorTransform::None,
        alpha: 0.2,
    },
    LayerDef {
        name: "clothes",
        source: Source::RandomFrom("clothes"),
        color: ColorTransform::RotateHue,
        alpha: 1.0,
    },
];

pub enum AppliedColor {
    AdjustHsv {
        hue_shift: f32,
        sat_mult: f32,
        val_mult: f32,
    },
    RotateHue(f32),
    None,
}

pub struct LayerDetail {
    pub def: &'static LayerDef,
    pub chosen: String,
    pub applied_color: AppliedColor,
}

pub struct GenerateResult {
    pub image: RgbaImage,
    pub layers: Vec<LayerDetail>,
}

pub fn generate(assets: &Dir<'static>, rng: &mut impl Rng) -> GenerateResult {
    let mut canvas: Option<RgbaImage> = None;
    let mut hue_rotations: HashMap<&str, f32> = HashMap::new();
    let mut layers = Vec::new();

    for def in LAYERS {
        let (pick_name, mut img) = match def.source {
            Source::File(path) => {
                let file = assets
                    .get_file(path)
                    .unwrap_or_else(|| panic!("missing embedded {path}"));
                (def.name, load_png(file.contents()))
            }
            Source::RandomFrom(dir_name) => {
                let dir = assets
                    .get_dir(dir_name)
                    .unwrap_or_else(|| panic!("missing embedded {dir_name} dir"));
                let (name, data) = pick_random_png(dir, rng);
                (name, load_png(data))
            }
        };

        if def.alpha != 1.0 {
            scale_alpha(&mut img, def.alpha);
        }

        let (img, applied_color) = match def.color {
            ColorTransform::AdjustHsv => {
                let hue_shift = rng.gen_range(-30.0..20.0f32);
                let sat_mult = rng.gen_range(0.8..1.2f32);
                let val_mult = rng.gen_range(0.7..1.15f32);
                (
                    adjust_hsv(&img, hue_shift, sat_mult, val_mult),
                    AppliedColor::AdjustHsv {
                        hue_shift,
                        sat_mult,
                        val_mult,
                    },
                )
            }
            ColorTransform::RotateHue => {
                let degrees = rng.gen_range(0.0..360.0f32);
                hue_rotations.insert(def.name, degrees);
                (rotate_hue(&img, degrees), AppliedColor::RotateHue(degrees))
            }
            ColorTransform::ShareHue(source) => {
                let &degrees = hue_rotations
                    .get(source)
                    .unwrap_or_else(|| panic!("{source} must be processed before {}", def.name));
                (rotate_hue(&img, degrees), AppliedColor::RotateHue(degrees))
            }
            ColorTransform::None => (img, AppliedColor::None),
        };

        layers.push(LayerDetail {
            def,
            chosen: pick_name.to_string(),
            applied_color,
        });

        match canvas.as_mut() {
            None => canvas = Some(img),
            Some(c) => composite(c, &img),
        }
    }

    GenerateResult {
        image: canvas.expect("no layers defined"),
        layers,
    }
}
