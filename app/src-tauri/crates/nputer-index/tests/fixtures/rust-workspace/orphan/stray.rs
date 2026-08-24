//! Under NO cargo target: the workspace manifest above it declares no
//! package, so `crate::` has no module tree to anchor against and lands
//! in unresolved[]. `std::fmt` on the next line is the positive control —
//! the file is otherwise processed exactly like any other.
use crate::missing::Thing;
use std::fmt;

pub fn stray() {}
