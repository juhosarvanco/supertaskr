//! An auto-discovered `src/bin/*.rs` target. Its own modules live BESIDE
//! it, so `mod helper;` is src/bin/helper.rs.
mod helper;

use helper::assist;
use demo_lib::Root;

fn main() {}
