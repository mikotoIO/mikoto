use image::{ImageBuffer, Rgba, RgbaImage};
use rand::Rng;

const W: u32 = 24;
const H: u32 = 24;

/// Grid cell size in pixels. 24 / 4 = 6 cells across.
const CELL: u32 = 4;
const COLS: u32 = W / CELL;
const ROWS: u32 = H / CELL;

/// Dark background base color (near-black with slight blue tint).
const BG: Rgba<u8> = Rgba([18, 16, 24, 255]);

/// Generate a procedural circuit/pipe background.
pub fn generate(hue_degrees: f32) -> RgbaImage {
    let mut rng = rand::thread_rng();
    let mut img: RgbaImage = ImageBuffer::from_pixel(W, H, BG);

    // Derive trace colors from hue
    let trace = hue_to_rgb(hue_degrees, 0.7, 0.45);
    let bright = hue_to_rgb(hue_degrees, 0.8, 0.65);
    let node_color = hue_to_rgb(hue_degrees, 0.6, 0.55);
    let dim = hue_to_rgb(hue_degrees, 0.5, 0.25);

    // Decide which edges exist: horizontal[row][col] and vertical[row][col]
    let mut h_edges = vec![vec![false; COLS as usize]; (ROWS + 1) as usize];
    let mut v_edges = vec![vec![false; (COLS + 1) as usize]; ROWS as usize];

    // Randomly activate edges with ~40% probability
    for r in 0..=ROWS as usize {
        for c in 0..COLS as usize {
            if rng.gen_bool(0.40) {
                h_edges[r][c] = true;
            }
        }
    }
    for r in 0..ROWS as usize {
        for c in 0..=COLS as usize {
            if rng.gen_bool(0.40) {
                v_edges[r][c] = true;
            }
        }
    }

    // Draw horizontal traces
    for r in 0..=ROWS as usize {
        let y = (r as u32 * CELL).min(H - 1);
        for c in 0..COLS as usize {
            if !h_edges[r][c] {
                continue;
            }
            let x_start = c as u32 * CELL;
            let x_end = ((c as u32 + 1) * CELL).min(W - 1);
            for x in x_start..=x_end {
                if x < W && y < H {
                    img.put_pixel(x, y, trace);
                }
            }
        }
    }

    // Draw vertical traces
    for r in 0..ROWS as usize {
        for c in 0..=COLS as usize {
            if !v_edges[r][c] {
                continue;
            }
            let x = (c as u32 * CELL).min(W - 1);
            let y_start = r as u32 * CELL;
            let y_end = ((r as u32 + 1) * CELL).min(H - 1);
            for y in y_start..=y_end {
                if x < W && y < H {
                    img.put_pixel(x, y, trace);
                }
            }
        }
    }

    // Draw junction nodes where 2+ edges meet
    for r in 0..=ROWS as usize {
        for c in 0..=COLS as usize {
            let count = count_edges(&h_edges, &v_edges, r, c);
            if count >= 2 {
                let x = (c as u32 * CELL).min(W - 1);
                let y = (r as u32 * CELL).min(H - 1);
                img.put_pixel(x, y, bright);
            }
        }
    }

    // Scatter small circuit components along traces
    for _ in 0..rng.gen_range(3..7) {
        place_component(&mut img, &h_edges, &v_edges, &mut rng, node_color, dim);
    }

    // Add a few random single-pixel glow dots for atmosphere
    for _ in 0..rng.gen_range(2..5) {
        let x = rng.gen_range(0..W);
        let y = rng.gen_range(0..H);
        if img.get_pixel(x, y) == &BG {
            img.put_pixel(x, y, dim);
        }
    }

    img
}

/// Place a small component (1-2px detail) on an active trace segment.
fn place_component(
    img: &mut RgbaImage,
    h_edges: &[Vec<bool>],
    v_edges: &[Vec<bool>],
    rng: &mut impl Rng,
    color: Rgba<u8>,
    dim: Rgba<u8>,
) {
    // Collect active horizontal midpoints
    let mut spots: Vec<(u32, u32, bool)> = Vec::new();
    for (r, row) in h_edges.iter().enumerate() {
        for (c, &active) in row.iter().enumerate() {
            if active {
                let x = c as u32 * CELL + CELL / 2;
                let y = (r as u32 * CELL).min(H - 1);
                if x < W && y < H {
                    spots.push((x, y, true)); // true = horizontal
                }
            }
        }
    }
    for (r, row) in v_edges.iter().enumerate() {
        for (c, &active) in row.iter().enumerate() {
            if active {
                let x = (c as u32 * CELL).min(W - 1);
                let y = r as u32 * CELL + CELL / 2;
                if x < W && y < H {
                    spots.push((x, y, false)); // false = vertical
                }
            }
        }
    }

    if spots.is_empty() {
        return;
    }

    let &(x, y, horizontal) = &spots[rng.gen_range(0..spots.len())];

    // Draw a small 2-3px component perpendicular to the trace
    if horizontal {
        // Component perpendicular (vertical) to horizontal trace
        if y > 0 {
            img.put_pixel(x, y - 1, dim);
        }
        img.put_pixel(x, y, color);
        if y + 1 < H {
            img.put_pixel(x, y + 1, dim);
        }
    } else {
        // Component perpendicular (horizontal) to vertical trace
        if x > 0 {
            img.put_pixel(x - 1, y, dim);
        }
        img.put_pixel(x, y, color);
        if x + 1 < W {
            img.put_pixel(x + 1, y, dim);
        }
    }
}

/// Count how many edges connect to a grid node at (row, col).
fn count_edges(h_edges: &[Vec<bool>], v_edges: &[Vec<bool>], row: usize, col: usize) -> u32 {
    let mut count = 0;
    let rows = v_edges.len();
    let cols = h_edges[0].len();

    // Left horizontal edge
    if col > 0 && col - 1 < cols && h_edges[row][col - 1] {
        count += 1;
    }
    // Right horizontal edge
    if col < cols && h_edges[row][col] {
        count += 1;
    }
    // Up vertical edge
    if row > 0 && row - 1 < rows && col < v_edges[0].len() && v_edges[row - 1][col] {
        count += 1;
    }
    // Down vertical edge
    if row < rows && col < v_edges[0].len() && v_edges[row][col] {
        count += 1;
    }

    count
}

/// Convert HSV to an Rgba pixel. h in [0,360), s and v in [0,1].
fn hue_to_rgb(h: f32, s: f32, v: f32) -> Rgba<u8> {
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

    Rgba([
        ((r + m) * 255.0).round() as u8,
        ((g + m) * 255.0).round() as u8,
        ((b + m) * 255.0).round() as u8,
        255,
    ])
}
