use super::Engine;
use crate::VERSION;
use demo_core::Shared;
use std::collections::BTreeMap;

pub enum RunEvent {
    Started,
    Done,
}

pub(crate) fn run() {}

mod inner {
    pub fn hidden() {}
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::Engine;
    use crate::util::Helper;
}
