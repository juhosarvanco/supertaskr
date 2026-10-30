//! Filter non-mutating access before the mini debouncer erases event kinds.
//! Linux reports OPEN for the watcher's own reads. Debouncing those as a
//! content change would cause another collection and another OPEN indefinitely.
use notify_debouncer_mini::notify::{
    self,
    event::{AccessKind, AccessMode},
    Config, Event, EventHandler, EventKind, RecommendedWatcher, RecursiveMode, Watcher,
    WatcherKind,
};
use std::path::Path;

fn forward(handler: &mut impl EventHandler, event: notify::Result<Event>) {
    if event.as_ref().is_ok_and(|event| {
        !event.need_rescan()
            && matches!(
                event.kind,
                EventKind::Access(
                    AccessKind::Open(_) | AccessKind::Read | AccessKind::Close(AccessMode::Read)
                )
            )
    }) {
        return;
    }
    // Keep close-after-write, all data/metadata/name changes, unknown events,
    // rescan flags and errors. They still reach the original reconciliation.
    handler.handle_event(event);
}

pub(super) struct ContentWatcher(RecommendedWatcher);
impl Watcher for ContentWatcher {
    fn new<F: EventHandler>(mut handler: F, config: Config) -> notify::Result<Self> {
        RecommendedWatcher::new(move |event| forward(&mut handler, event), config).map(Self)
    }
    fn watch(&mut self, path: &Path, mode: RecursiveMode) -> notify::Result<()> {
        self.0.watch(path, mode)
    }
    fn unwatch(&mut self, path: &Path) -> notify::Result<()> {
        self.0.unwatch(path)
    }
    fn configure(&mut self, config: Config) -> notify::Result<bool> {
        self.0.configure(config)
    }
    fn kind() -> WatcherKind {
        RecommendedWatcher::kind()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use notify::event::{
        CreateKind, DataChange, Flag, MetadataKind, ModifyKind, RemoveKind, RenameMode,
    };
    use std::sync::mpsc;

    #[test]
    fn collection_reads_do_not_reenter_the_content_debouncer() {
        let (tx, rx) = mpsc::channel();
        let mut handler = move |event| {
            tx.send(event).unwrap();
        };
        for access in [
            AccessKind::Read,
            AccessKind::Open(AccessMode::Any),
            AccessKind::Open(AccessMode::Read),
            AccessKind::Open(AccessMode::Write),
            AccessKind::Close(AccessMode::Read),
        ] {
            forward(
                &mut handler,
                Ok(Event::new(EventKind::Access(access)).add_path("records/docs/STATE.md".into())),
            );
        }
        assert!(rx.try_recv().is_err());
    }

    #[test]
    fn writes_replacements_metadata_unknown_rescan_and_errors_still_reconcile() {
        let (tx, rx) = mpsc::channel();
        let mut handler = move |event| {
            tx.send(event).unwrap();
        };
        let events = [
            Event::new(EventKind::Create(CreateKind::File)),
            Event::new(EventKind::Modify(ModifyKind::Data(DataChange::Any))),
            Event::new(EventKind::Modify(ModifyKind::Metadata(
                MetadataKind::Permissions,
            ))),
            Event::new(EventKind::Modify(ModifyKind::Name(RenameMode::Both))),
            Event::new(EventKind::Remove(RemoveKind::Folder)),
            Event::new(EventKind::Access(AccessKind::Close(AccessMode::Write))),
            Event::new(EventKind::Access(AccessKind::Any)),
            Event::new(EventKind::Any),
            Event::new(EventKind::Other).set_flag(Flag::Rescan),
            Event::new(EventKind::Access(AccessKind::Open(AccessMode::Read)))
                .set_flag(Flag::Rescan),
        ]
        .map(|event| event.add_path("records/docs/STATE.md".into()));
        for event in &events {
            forward(&mut handler, Ok(event.clone()));
        }
        forward(
            &mut handler,
            Err(notify::Error::generic("original watcher failure")),
        );
        for expected in events {
            assert_eq!(rx.try_recv().unwrap().unwrap(), expected);
        }
        assert!(rx.try_recv().unwrap().is_err());
        assert!(rx.try_recv().is_err());
    }
}
