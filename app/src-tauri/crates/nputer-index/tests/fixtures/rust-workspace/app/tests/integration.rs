//! An auto-discovered tests/*.rs target. `tests/common/mod.rs` is a
//! MODULE of it, never a target of its own.
mod common;

use common::Fixture;
use demo_lib::engine::Engine;
use demo_lib::Describe;

fn nothing() {}
