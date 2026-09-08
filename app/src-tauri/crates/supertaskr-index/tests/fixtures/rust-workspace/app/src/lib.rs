//! The lib crate root: every symbol kind the criteria name, plus the
//! module tree the resolver walks.
pub mod engine;
pub mod util;

#[path = "relocated/elsewhere.rs"]
mod moved;

// pub use -> import edges with reexport: true.
pub use engine::runner::RunEvent;
pub use util::Helper;

use demo_core::types::Shape;
use serde::Serialize;
use std::collections::BTreeMap;

pub const VERSION: u32 = 1;
static COUNTER: u32 = 0;
pub type Alias = u32;

pub struct Root {
    shape: Shape,
    seen: BTreeMap<String, u32>,
}

pub enum Mode {
    Fast,
    Slow,
}

pub trait Describe {
    fn describe(&self) -> String;
}

impl Describe for Root {
    fn describe(&self) -> String {
        String::new()
    }
}

impl Root {
    pub fn new() -> Self {
        unimplemented!()
    }
}

macro_rules! shout {
    () => {};
}

pub fn boot() {}

pub(self) fn private_by_restriction() {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::util::Helper;
}
