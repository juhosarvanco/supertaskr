//! Reached only through `#[path = "relocated/elsewhere.rs"]`, whose base
//! is the DECLARING file's directory (app/src/), not app/src/moved/.
use crate::util::Helper;

pub struct Moved;
