//! T-110: **THE DISAGREEMENT, AS A FACT WITH A PIN UNDER IT.**
//!
//! [`lanes::read_lanes`](super::lanes::read_lanes) says what git wrote
//! down. The board says what the cards claim. This module joins the two
//! and names where they differ:
//!
//! | the card says | git says | state |
//! |---|---|---|
//! | in flight | a lane | [`DispatchState::Live`] |
//! | in flight | nothing | [`DispatchState::Died`] — a lane that died |
//! | anything else | a lane | [`DispatchState::StampSkipped`] |
//! | anything else | nothing | [`DispatchState::NotDispatched`] |
//!
//! A board that shows only one of the two sources can report neither
//! failure. That is the whole product of the card.
//!
//! **WHY THIS IS RUST AND NOT TYPESCRIPT — READ THIS BEFORE MOVING IT.**
//! T-110's first pass put the join in `app/src/lib/dispatch-store.ts`.
//! It was correct code and **nothing tested it**: no file in the
//! repository imports that module, `app/vitest.config.ts` collects
//! `test/**` only, and both `app/test/**` and `app/vitest.config.ts` are
//! C-05's `app-shell` — outside T-110's `[app-dispatch]` fence. Four
//! one-side-only producer mutants (swap the `died`/`stampSkipped` arms;
//! empty the in-flight set; short-circuit the no-card half of the join;
//! give two refusals one sentence) ALL SURVIVED `npm run build` and
//! `npm test` at exit 0, re-measured at `6fea6a1` before this file was
//! written. Exhaustiveness checking is not a substitute and the fourth
//! mutant is the proof: `assertNever` catches a MISSING arm, never a
//! WRONG one.
//!
//! `app/src-tauri/src/dispatch/**` is C-15's OWN path, so a join here is
//! inside the fence and its `#[cfg(test)]` bodies run under `cargo test`
//! — the verification the card itself prescribes. The TypeScript half
//! keeps the types and the `Map` hydration ADR-009 requires and holds no
//! second copy of this decision, because two copies of one rule with a
//! pin under only one of them is the divergence T-110 exists to remove.
//!
//! **EVERY BODY BELOW DRIVES THE REAL READER OVER A REAL FIXTURE
//! DIRECTORY** ([`super::fixtures`]), never a hand-built [`LaneScan`]
//! value. A join proved against a fiction is proved against the fiction.

use std::collections::BTreeMap;

use serde::Serialize;

use super::lanes::{LaneScan, WorktreeEntry};

/// The statuses that SAY A LANE EXISTS.
///
/// `building` is the dispatch stamp itself — `method/tasks/TASK-FORMAT.md`
/// owns the field and T-089 ruled the practice back in: the architect
/// stamps it on the integration branch BEFORE the cut, so the lane
/// inherits it and never writes that line.
///
/// **`verifying` AND `merging` ARE INCLUDED, AND THAT IS A JUDGEMENT THE
/// CARD DID NOT MAKE.** T-110's four rows are written against `building`
/// alone, but `method/lane-protocol.md` keeps the worktree alive past the
/// handoff: the executor stamps `verifying` and STOPS, and the integrator
/// removes the worktree only after the merge. A live worktree under a
/// `verifying` card is therefore the ORDINARY state of this repository
/// between handoff and merge — scoring it [`DispatchState::StampSkipped`]
/// would make the board cry wolf on its healthiest lane. The membership
/// is a constant so it can be argued with rather than reverse-engineered,
/// and `in_flight_is_exactly_three_statuses_named_as_literals` spells all
/// three out as literals so that argument has to be had in the open.
pub const IN_FLIGHT_STATUSES: [&str; 3] = ["building", "verifying", "merging"];

/// Does this card claim a lane exists?
pub fn is_in_flight(status: &str) -> bool {
    IN_FLIGHT_STATUSES.contains(&status)
}

/// One card, as much of it as this join reads. Deliberately three
/// fields: the join needs an id and a status, and taking a whole
/// `TaskRecord` would declare a dependency on the parser for two
/// strings.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BoardStamp {
    pub id: String,
    /// The card's `status:` frontmatter field, verbatim.
    pub status: String,
}

impl BoardStamp {
    /// A stamp, for callers and fixtures that have two `&str`s.
    pub fn new(id: &str, status: &str) -> Self {
        Self {
            id: id.to_string(),
            status: status.to_string(),
        }
    }
}

/// The disagreement, by name. Each is a different failure or a different
/// kind of health, and a board that renders one string for two of them
/// can report neither.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DispatchState {
    /// Stamped in flight, and git has the lane.
    Live,
    /// Stamped in flight, and there is no lane: a lane that died.
    Died,
    /// A lane, and no card claiming it: a dispatch that skipped the stamp.
    StampSkipped,
    /// Neither. The ordinary state of every card on the board.
    NotDispatched,
}

/// Every state, so a renderer can enumerate them without a match.
pub const DISPATCH_STATES: [DispatchState; 4] = [
    DispatchState::Live,
    DispatchState::Died,
    DispatchState::StampSkipped,
    DispatchState::NotDispatched,
];

/// **THE WHOLE DISAGREEMENT, AS ONE TOTAL FUNCTION OF TWO BOOLEANS.**
/// Four inputs, four outputs, no default arm — so a swapped pair is a
/// changed answer rather than a changed shape, and only a test can catch
/// it.
pub fn classify(in_flight: bool, has_lane: bool) -> DispatchState {
    match (in_flight, has_lane) {
        (true, true) => DispatchState::Live,
        (true, false) => DispatchState::Died,
        (false, true) => DispatchState::StampSkipped,
        (false, false) => DispatchState::NotDispatched,
    }
}

/// A lane registration as a row carries it: the five fields of
/// [`WorktreeEntry::Lane`] in a struct, so a row's `lanes` list CANNOT
/// hold a detached checkout or an unreadable entry.
///
/// The five fields are spelled twice — here and on the reader's enum —
/// and `a_row_carries_the_readers_five_lane_fields_and_the_same_json`
/// holds the two spellings equal BY SERIALIZING BOTH, so the wire form
/// the TypeScript mirror reads cannot drift from the reader's.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename = "lane", rename_all = "camelCase")]
pub struct LaneRegistration {
    pub name: String,
    pub task_id: String,
    pub branch: String,
    pub worktree_path: String,
    pub exists_on_disk: bool,
}

impl LaneRegistration {
    /// The one conversion. `None` for every entry that is not a lane —
    /// those are carried whole in [`DispatchJoin::Joined::not_lanes`]
    /// rather than dropped.
    fn of(entry: &WorktreeEntry) -> Option<Self> {
        match entry {
            WorktreeEntry::Lane {
                name,
                task_id,
                branch,
                worktree_path,
                exists_on_disk,
            } => Some(Self {
                name: name.clone(),
                task_id: task_id.clone(),
                branch: branch.clone(),
                worktree_path: worktree_path.clone(),
                exists_on_disk: *exists_on_disk,
            }),
            _ => None,
        }
    }
}

/// One task id, and what the card and the disk together say about it.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DispatchRow {
    pub task_id: String,
    pub state: DispatchState,
    /// The card, when the board has one. `None` is a lane for no card.
    pub card: Option<BoardStamp>,
    /// Every lane registration carrying this task id — a LIST, not one
    /// lane, for two reasons. Two branches can carry one id
    /// (`task/T-110-a`, `task/T-110-b`), and dropping the second to fit a
    /// single field would be exactly the silent loss the card forbids.
    /// And `exists_on_disk` stays HERE rather than folding into
    /// [`DispatchState`]: a pruned-but-not-removed lane is a registration
    /// whose directory is gone, which is not the same fact as a card
    /// whose lane was never registered.
    pub lanes: Vec<LaneRegistration>,
}

/// A scan that produced no list, as its own type — the four arms of
/// [`LaneScan`] that are not `Scanned`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum LaneScanRefusal {
    NotAGitRepository,
    GitIsAFile,
    NoWorktreesDirectory,
    WorktreesUnreadable,
}

/// Every refusal, so a body can enumerate them without a match.
pub const LANE_SCAN_REFUSALS: [LaneScanRefusal; 4] = [
    LaneScanRefusal::NotAGitRepository,
    LaneScanRefusal::GitIsAFile,
    LaneScanRefusal::NoWorktreesDirectory,
    LaneScanRefusal::WorktreesUnreadable,
];

impl LaneScanRefusal {
    /// `None` for `Scanned` — the one arm of [`LaneScan`] that is an
    /// answer rather than a refusal. Total over the other four.
    pub fn of(scan: &LaneScan) -> Option<Self> {
        match scan {
            LaneScan::Scanned { .. } => None,
            LaneScan::NotAGitRepository => Some(Self::NotAGitRepository),
            LaneScan::GitIsAFile => Some(Self::GitIsAFile),
            LaneScan::NoWorktreesDirectory => Some(Self::NoWorktreesDirectory),
            LaneScan::WorktreesUnreadable => Some(Self::WorktreesUnreadable),
        }
    }

    /// One sentence naming why the lane list is unavailable.
    ///
    /// **THIS IS THE ONLY SPELLING OF THESE FOUR SENTENCES, AND IT TRAVELS
    /// ON THE WIRE.** The board must be able to say WHICH case it hit;
    /// the first pass kept the same `switch` in TypeScript where nothing
    /// could test it, and a mutant that gave two refusals one sentence
    /// survived both `tsc` programs. Putting the string where the
    /// classification is makes that mutant red — see
    /// `every_refusal_has_its_own_sentence_and_no_two_are_equal`.
    pub fn sentence(&self) -> &'static str {
        match self {
            Self::NotAGitRepository => {
                "this folder is not a git repository, so it has no lanes to read"
            }
            Self::GitIsAFile => {
                "this folder is itself a git worktree (its .git is a file), so its lanes live in the repository it was cut from"
            }
            Self::NoWorktreesDirectory => "this repository has never registered a worktree",
            Self::WorktreesUnreadable => "this repository's .git/worktrees could not be read",
        }
    }
}

/// The join's result.
///
/// **`Unavailable` IS THE POINT OF THIS BEING AN ENUM.** When the scan
/// refused, the app knows NOTHING about lanes. Rendering every card as
/// `notDispatched` would be the same lie one layer up that "an empty list
/// meaning two different things" is one layer down, so the join refuses
/// to classify and names the case it hit.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum DispatchJoin {
    Joined {
        /// One row per task id, sorted by task id so the answer does not
        /// depend on the order the board or the filesystem handed things
        /// over. The order is ASCII, not numeric: `T-110` sorts before
        /// `T-9`, which is deterministic and is all this promises.
        rows: Vec<DispatchRow>,
        /// Worktrees that are not lanes: reported, never dropped.
        not_lanes: Vec<WorktreeEntry>,
        /// The reader hit its entry ceiling: the answer is a floor.
        truncated: bool,
    },
    Unavailable {
        because: LaneScanRefusal,
        /// [`LaneScanRefusal::sentence`], carried so the board renders the
        /// one spelling that has a pin under it.
        sentence: String,
    },
}

/// Join the lane list against the board.
///
/// Every task id on the board gets a row, and so does every lane whose id
/// is on no card — that second half is the [`DispatchState::StampSkipped`]
/// case with `card: None`, and it is the shape a dispatch that skipped the
/// stamp leaves when nobody has written the card yet either.
pub fn join_lanes(scan: &LaneScan, board: &[BoardStamp]) -> DispatchJoin {
    let LaneScan::Scanned { entries, truncated } = scan else {
        // `of` returns None only for `Scanned`, which this arm excludes.
        let because = LaneScanRefusal::of(scan).expect("a non-Scanned scan is a refusal");
        return DispatchJoin::Unavailable {
            because,
            sentence: because.sentence().to_string(),
        };
    };

    // Task id -> its lane registrations. Keyed by a string GIT wrote, so
    // a BTreeMap rather than anything the caller could collide with, and
    // one that keeps EVERY registration (ADR-009's Rust-side shape).
    let mut lanes_by_task: BTreeMap<String, Vec<LaneRegistration>> = BTreeMap::new();
    let mut not_lanes: Vec<WorktreeEntry> = Vec::new();
    for entry in entries {
        match LaneRegistration::of(entry) {
            Some(lane) => lanes_by_task
                .entry(lane.task_id.clone())
                .or_default()
                .push(lane),
            None => not_lanes.push(entry.clone()),
        }
    }

    let mut rows: Vec<DispatchRow> = Vec::new();
    let mut claimed: Vec<&str> = Vec::new();
    for card in board {
        let lanes = lanes_by_task.get(&card.id).cloned().unwrap_or_default();
        claimed.push(card.id.as_str());
        rows.push(DispatchRow {
            task_id: card.id.clone(),
            state: classify(is_in_flight(&card.status), !lanes.is_empty()),
            card: Some(card.clone()),
            lanes,
        });
    }
    // A lane whose task id is on NO card. Reported for the same reason a
    // non-lane worktree is: the board cannot report what it drops.
    for (task_id, lanes) in &lanes_by_task {
        if claimed.contains(&task_id.as_str()) {
            continue;
        }
        rows.push(DispatchRow {
            task_id: task_id.clone(),
            state: classify(false, !lanes.is_empty()),
            card: None,
            lanes: lanes.clone(),
        });
    }
    rows.sort_by(|a, b| a.task_id.cmp(&b.task_id));

    DispatchJoin::Joined {
        rows,
        not_lanes,
        truncated: *truncated,
    }
}

/// Count the rows in each state, with every state SEEDED — a state with
/// no rows must read as zero rather than be missing, or a renderer
/// iterating the tally silently stops naming it.
pub fn count_by_state(join: &DispatchJoin) -> BTreeMap<DispatchState, usize> {
    let mut counts: BTreeMap<DispatchState, usize> =
        DISPATCH_STATES.iter().map(|state| (*state, 0)).collect();
    if let DispatchJoin::Joined { rows, .. } = join {
        for row in rows {
            *counts.entry(row.state).or_insert(0) += 1;
        }
    }
    counts
}

#[cfg(test)]
mod tests {
    use super::super::fixtures::{branch_head, register, repo, repo_with_worktrees_dir, scratch};
    use super::super::lanes::read_lanes;
    use super::*;
    use std::fs;

    /// The rows of a join, as (task id, state) pairs — the shape every
    /// state assertion below is written against.
    fn states(join: &DispatchJoin) -> Vec<(&str, DispatchState)> {
        match join {
            DispatchJoin::Joined { rows, .. } => rows
                .iter()
                .map(|row| (row.task_id.as_str(), row.state))
                .collect(),
            other => panic!("expected a join, got {other:?}"),
        }
    }

    fn rows(join: &DispatchJoin) -> &[DispatchRow] {
        match join {
            DispatchJoin::Joined { rows, .. } => rows,
            other => panic!("expected a join, got {other:?}"),
        }
    }

    // ---- the four states, each driven by its own pin -------------------

    #[test]
    fn a_building_stamp_with_no_worktree_is_a_lane_that_died() {
        // **THE FIXTURE THE CARD NAMES BY NAME** — "a `building` stamp and
        // no worktree, which is the shape a killed lane leaves and the one
        // nothing in the tree can currently see". A repository whose
        // worktrees directory exists and is EMPTY, so the scan succeeds
        // and reports zero lanes; a card that says `building`.
        let root = repo_with_worktrees_dir("died");
        let scan = read_lanes(&root);
        assert_eq!(
            scan,
            LaneScan::Scanned {
                entries: vec![],
                truncated: false
            },
            "the fixture must produce a SUCCESSFUL empty scan, not a refusal"
        );

        let board = [BoardStamp::new("T-110", "building")];
        assert_eq!(
            states(&join_lanes(&scan, &board)),
            [("T-110", DispatchState::Died)]
        );

        // POSITIVE CONTROL: the SAME card against the SAME repository once
        // the lane is registered is `Live`. Without this, "died" is
        // equally satisfied by a classifier that always says died.
        register(
            &root,
            "nputer-T-110",
            &branch_head("task/T-110-lane-reader"),
            true,
        );
        assert_eq!(
            states(&join_lanes(&read_lanes(&root), &board)),
            [("T-110", DispatchState::Live)]
        );
    }

    #[test]
    fn the_four_states_are_four_different_answers_on_one_fixture() {
        // One repository, one board, all four states at once — so a
        // classifier that collapses any two of them reds here whatever
        // else it gets right.
        let root = repo_with_worktrees_dir("fourstates");
        register(&root, "wt-live", &branch_head("task/T-100-live"), true);
        register(&root, "wt-skipped", &branch_head("task/T-300-skipped"), true);

        let board = [
            BoardStamp::new("T-100", "building"), // in flight + lane  -> live
            BoardStamp::new("T-200", "building"), // in flight, no lane -> died
            BoardStamp::new("T-300", "done"),     // lane, not in flight -> stampSkipped
            BoardStamp::new("T-400", "planned"),  // neither -> notDispatched
        ];

        let join = join_lanes(&read_lanes(&root), &board);
        assert_eq!(
            states(&join),
            [
                ("T-100", DispatchState::Live),
                ("T-200", DispatchState::Died),
                ("T-300", DispatchState::StampSkipped),
                ("T-400", DispatchState::NotDispatched),
            ]
        );

        // And all four are DIFFERENT, asserted rather than eyeballed: the
        // row above would still pass if two names were spelled the same.
        let mut seen: Vec<DispatchState> = states(&join).into_iter().map(|(_, s)| s).collect();
        seen.sort();
        seen.dedup();
        assert_eq!(seen.len(), 4, "the four states collapsed into {seen:?}");
    }

    #[test]
    fn in_flight_is_exactly_three_statuses_named_as_literals() {
        // **HARDCODED ON PURPOSE.** A body that asked
        // `IN_FLIGHT_STATUSES.iter().all(is_in_flight)` would agree with
        // the constant at every value it could ever hold — CONVENTIONS'
        // "A TEST PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT PIN THAT
        // CONSTANT" (T-063). Emptying the constant is the mutant that
        // survived the first pass and makes `died` unreachable.
        assert!(is_in_flight("building"));
        assert!(is_in_flight("verifying"));
        assert!(is_in_flight("merging"));
        for settled in [
            "planned",
            "done",
            "parked",
            "suggested",
            "rejected",
            "blocked",
            "",
            "Building",
            "building ",
        ] {
            assert!(
                !is_in_flight(settled),
                "{settled:?} must not claim a lane exists"
            );
        }
        assert_eq!(IN_FLIGHT_STATUSES.len(), 3);
        assert_eq!(IN_FLIGHT_STATUSES, ["building", "verifying", "merging"]);
    }

    #[test]
    fn a_lane_on_no_card_becomes_its_own_row_rather_than_vanishing() {
        // The half of the join whose deletion survived the first pass:
        // every lane whose task id is on NO card must still produce a row.
        let root = repo_with_worktrees_dir("orphan");
        register(&root, "wt-orphan", &branch_head("task/T-777-nobody"), true);
        let board = [BoardStamp::new("T-100", "planned")];

        let join = join_lanes(&read_lanes(&root), &board);
        assert_eq!(
            states(&join),
            [
                ("T-100", DispatchState::NotDispatched),
                ("T-777", DispatchState::StampSkipped),
            ]
        );
        let orphan = rows(&join)
            .iter()
            .find(|row| row.task_id == "T-777")
            .expect("the orphan row");
        assert_eq!(orphan.card, None, "a lane on no card has no card");
        assert_eq!(orphan.lanes.len(), 1);

        // **THE POSITIVE CONTROL THE DRILL DEMANDED.** `card: None` above
        // is a negative assertion, and this body's first draft had no
        // positive beside it: `card: Some(card.clone())` -> `card: None`
        // in the producer SURVIVED the whole suite, because every other
        // body reads `state` and `lanes` and none read `card`. A row
        // built FROM a card must carry it.
        let carded = rows(&join)
            .iter()
            .find(|row| row.task_id == "T-100")
            .expect("the carded row");
        assert_eq!(
            carded.card,
            Some(BoardStamp::new("T-100", "planned")),
            "a row built from a card must carry the card verbatim"
        );

        // POSITIVE CONTROL: the same lane WITH a card produces ONE row,
        // not two. The no-card pass must not double-count.
        let board = [
            BoardStamp::new("T-100", "planned"),
            BoardStamp::new("T-777", "building"),
        ];
        assert_eq!(
            states(&join_lanes(&read_lanes(&root), &board)),
            [
                ("T-100", DispatchState::NotDispatched),
                ("T-777", DispatchState::Live),
            ]
        );
    }

    // ---- the refusals -------------------------------------------------

    #[test]
    fn every_refusal_has_its_own_sentence_and_no_two_are_equal() {
        // The mutant that survived the first pass gave two refusals one
        // sentence — "an empty list meaning two different things", one
        // layer up. Distinctness kills that; the substrings kill a SWAP,
        // which distinctness alone cannot see.
        let sentences: Vec<&str> = LANE_SCAN_REFUSALS
            .iter()
            .map(|refusal| refusal.sentence())
            .collect();
        let mut unique = sentences.clone();
        unique.sort();
        unique.dedup();
        assert_eq!(
            unique.len(),
            LANE_SCAN_REFUSALS.len(),
            "two refusals share one sentence: {sentences:?}"
        );

        assert!(LaneScanRefusal::NotAGitRepository
            .sentence()
            .contains("not a git repository"));
        assert!(LaneScanRefusal::GitIsAFile
            .sentence()
            .contains("itself a git worktree"));
        assert!(LaneScanRefusal::NoWorktreesDirectory
            .sentence()
            .contains("never registered a worktree"));
        assert!(LaneScanRefusal::WorktreesUnreadable
            .sentence()
            .contains("could not be read"));
        // Every sentence is non-empty, so "distinct" cannot be satisfied
        // by four different flavours of nothing.
        assert!(sentences.iter().all(|s| s.len() > 20), "{sentences:?}");
    }

    /// **THE FOUR SENTENCES, WHOLE — `T-195`'s body on the wire side.**
    ///
    /// The body above pins ONE FRAGMENT of each sentence with `contains`,
    /// and a containment matcher is satisfied by any superstring. Measured
    /// at `40c9b8b`, one side only, each mutation read back as `1 1` on
    /// `git diff --numstat` and each restore proved by sha256 against
    /// `f83ccbcb…48a9`: **all four arms survived `cargo test` at exit 0**
    /// under a wording mutation.
    ///
    /// `NoWorktreesDirectory` is the one to read. Its pinned fragment —
    /// `never registered a worktree` — IS its whole reason clause, so no
    /// DELETION can dodge it, and a deletion-only sweep therefore scores
    /// it safe. Appending `, probably` dodges it anyway and changes what
    /// the user is told. **So the exposure here is not deletion, it is
    /// EDIT**, and only an exact match closes it. That is also why this
    /// body exists beside the fragments rather than replacing them: the
    /// fragments were written to catch a SWAP between two arms, which they
    /// still do.
    ///
    /// **ASSERTED WHOLE RATHER THAN BY PARTS, DELIBERATELY** — the choice
    /// `T-195`'s second decision asks to be made explicitly.
    /// [`LaneScanRefusal::sentence`]'s own doc comment calls this "THE ONLY
    /// SPELLING OF THESE FOUR SENTENCES, AND IT TRAVELS ON THE WIRE". A pin
    /// asserting merely that a reason is PRESENT would survive precisely
    /// the edit that makes a refusal stop saying why — the failure family
    /// `T-171` and `T-183` were opened for. These are user-facing strings
    /// with no other pin under them, so changing one should cost a red and
    /// a second look rather than nothing. Freezing the wording is the
    /// point, not a side effect.
    #[test]
    fn every_refusal_sentence_is_pinned_whole_rather_than_by_a_fragment() {
        // A `match` rather than a table keyed by index: adding an arm to
        // the enum stops this compiling, so a new refusal cannot reach the
        // wire unpinned. A table would silently leave it uncovered.
        fn expected(refusal: LaneScanRefusal) -> &'static str {
            match refusal {
                LaneScanRefusal::NotAGitRepository => {
                    "this folder is not a git repository, so it has no lanes to read"
                }
                LaneScanRefusal::GitIsAFile => {
                    "this folder is itself a git worktree (its .git is a file), so its lanes live in the repository it was cut from"
                }
                LaneScanRefusal::NoWorktreesDirectory => {
                    "this repository has never registered a worktree"
                }
                LaneScanRefusal::WorktreesUnreadable => {
                    "this repository's .git/worktrees could not be read"
                }
            }
        }

        // Asserted non-empty before the loop is trusted: an empty corpus
        // would make every iteration below vacuously agree (poison shape
        // TEN, whose remedy is exactly this line).
        assert_eq!(LANE_SCAN_REFUSALS.len(), 4);

        for refusal in LANE_SCAN_REFUSALS {
            assert_eq!(
                refusal.sentence(),
                expected(refusal),
                "the wire sentence for {refusal:?} was edited and this pin was not — \
                 if the new wording is intended, change it HERE too, deliberately"
            );
        }
    }

    #[test]
    fn a_scan_that_refused_makes_the_join_unavailable_rather_than_all_not_dispatched() {
        let board = [
            BoardStamp::new("T-100", "building"),
            BoardStamp::new("T-200", "planned"),
        ];

        // Each of the four refusals, built as a REAL directory shape and
        // read by the REAL reader.
        let no_repo = scratch("unavail-norepo");
        let git_file = scratch("unavail-gitfile");
        fs::write(git_file.join(".git"), "gitdir: /somewhere/.git/worktrees/x\n").expect(".git");
        let no_worktrees = repo("unavail-noworktrees");
        let unreadable = repo("unavail-unreadable");
        fs::write(unreadable.join(".git").join("worktrees"), b"not a directory")
            .expect("worktrees file");

        for (root, expected) in [
            (&no_repo, LaneScanRefusal::NotAGitRepository),
            (&git_file, LaneScanRefusal::GitIsAFile),
            (&no_worktrees, LaneScanRefusal::NoWorktreesDirectory),
            (&unreadable, LaneScanRefusal::WorktreesUnreadable),
        ] {
            let join = join_lanes(&read_lanes(root), &board);
            match &join {
                DispatchJoin::Unavailable { because, sentence } => {
                    assert_eq!(*because, expected, "wrong case named for {root:?}");
                    assert_eq!(sentence, expected.sentence(), "the wire sentence drifted");
                }
                other => panic!("expected Unavailable for {root:?}, got {other:?}"),
            }
            // AND THE CARDS ARE NOT CLASSIFIED. Two cards went in; if the
            // join answered `notDispatched` for both it would be claiming
            // knowledge it does not have.
            assert!(
                matches!(join, DispatchJoin::Unavailable { .. }),
                "a refusal must not produce rows"
            );
        }

        // POSITIVE CONTROL: the same board over a SCANNABLE repository
        // does produce rows, so "unavailable" is a reading of the tree
        // rather than this function's only answer.
        let scannable = repo_with_worktrees_dir("unavail-control");
        assert_eq!(
            states(&join_lanes(&read_lanes(&scannable), &board)),
            [
                ("T-100", DispatchState::Died),
                ("T-200", DispatchState::NotDispatched),
            ]
        );
    }

    #[test]
    fn the_refusal_vocabulary_is_total_over_the_scan_and_scanned_is_not_one() {
        // `Scanned` is an ANSWER, so it has no refusal; the other four
        // each map to their own. A mutant that folded two arms together
        // would break the distinctness below.
        assert_eq!(
            LaneScanRefusal::of(&LaneScan::Scanned {
                entries: vec![],
                truncated: false
            }),
            None
        );
        let mapped = [
            (LaneScan::NotAGitRepository, LaneScanRefusal::NotAGitRepository),
            (LaneScan::GitIsAFile, LaneScanRefusal::GitIsAFile),
            (
                LaneScan::NoWorktreesDirectory,
                LaneScanRefusal::NoWorktreesDirectory,
            ),
            (
                LaneScan::WorktreesUnreadable,
                LaneScanRefusal::WorktreesUnreadable,
            ),
        ];
        for (scan, expected) in &mapped {
            assert_eq!(LaneScanRefusal::of(scan), Some(*expected), "{scan:?}");
        }
        let mut seen: Vec<LaneScanRefusal> = mapped.iter().map(|(_, r)| *r).collect();
        seen.sort();
        seen.dedup();
        assert_eq!(seen.len(), 4, "two scan arms share one refusal");
    }

    // ---- what a row carries -------------------------------------------

    #[test]
    fn a_row_carries_the_readers_five_lane_fields_and_the_same_json() {
        let root = repo_with_worktrees_dir("fields");
        let worktree = register(
            &root,
            "nputer-T-110",
            &branch_head("task/T-110-lane-reader"),
            true,
        );
        let scan = read_lanes(&root);
        let join = join_lanes(&scan, &[BoardStamp::new("T-110", "verifying")]);
        let [row] = rows(&join) else {
            panic!("one row, got {:?}", rows(&join))
        };
        let [lane] = row.lanes.as_slice() else {
            panic!("one lane, got {:?}", row.lanes)
        };

        assert_eq!(lane.name, "nputer-T-110");
        assert_eq!(lane.task_id, "T-110");
        assert_eq!(lane.branch, "task/T-110-lane-reader");
        assert_eq!(lane.worktree_path, worktree.to_string_lossy());
        assert!(lane.exists_on_disk);

        // **THE TWO SPELLINGS, HELD EQUAL BY SERIALIZING BOTH.** The
        // reader's `WorktreeEntry::Lane` and this struct are the same five
        // fields written twice; the TypeScript mirror reads whichever one
        // reaches the wire. If their JSON ever differs, that mirror is
        // wrong about one of them.
        let entry = match &scan {
            LaneScan::Scanned { entries, .. } => entries[0].clone(),
            other => panic!("expected a scan, got {other:?}"),
        };
        assert_eq!(
            serde_json::to_value(lane).expect("lane json"),
            serde_json::to_value(&entry).expect("entry json"),
            "the row's lane and the reader's entry serialize differently"
        );
        // And the wire really does carry the discriminator the mirror
        // switches on — a positive control on the comparison above, which
        // two identically-broken serializations would otherwise satisfy.
        assert_eq!(
            serde_json::to_value(lane).expect("lane json")["kind"],
            serde_json::Value::String("lane".to_string())
        );
    }

    #[test]
    fn two_lanes_carrying_one_task_id_both_survive() {
        let root = repo_with_worktrees_dir("twolanes");
        register(&root, "wt-a", &branch_head("task/T-110-a"), true);
        register(&root, "wt-b", &branch_head("task/T-110-b"), true);

        let join = join_lanes(&read_lanes(&root), &[BoardStamp::new("T-110", "building")]);
        let [row] = rows(&join) else {
            panic!("one row, got {:?}", rows(&join))
        };
        assert_eq!(row.state, DispatchState::Live);
        let branches: Vec<&str> = row.lanes.iter().map(|l| l.branch.as_str()).collect();
        assert_eq!(branches, ["task/T-110-a", "task/T-110-b"]);
    }

    #[test]
    fn a_pruned_but_not_removed_lane_is_still_a_lane_and_says_so_on_the_row() {
        // A REGISTRATION whose directory is gone is still a registration.
        // The card's own criterion says a stale lane must be REPORTED
        // rather than omitted, so `exists_on_disk` stays a field on the
        // row instead of turning a live stamp into `died` — and this body
        // is where that judgement can be argued with.
        let root = repo_with_worktrees_dir("pruned");
        register(&root, "wt-gone", &branch_head("task/T-042-gone"), false);

        let join = join_lanes(&read_lanes(&root), &[BoardStamp::new("T-042", "building")]);
        let [row] = rows(&join) else {
            panic!("one row, got {:?}", rows(&join))
        };
        assert_eq!(row.state, DispatchState::Live);
        assert_eq!(row.lanes.len(), 1);
        assert!(
            !row.lanes[0].exists_on_disk,
            "the row must carry the fact the directory is gone"
        );

        // POSITIVE CONTROL: the field tracks the disk. Create the
        // directory and the same registration flips.
        fs::create_dir_all(
            root.parent()
                .expect("parent")
                .join(format!(
                    "{}-wt-gone",
                    root.file_name().expect("name").to_string_lossy()
                )),
        )
        .expect("worktree dir");
        let join = join_lanes(&read_lanes(&root), &[BoardStamp::new("T-042", "building")]);
        assert!(rows(&join)[0].lanes[0].exists_on_disk);
    }

    #[test]
    fn worktrees_that_are_not_lanes_are_carried_rather_than_dropped() {
        let root = repo_with_worktrees_dir("notlanes");
        register(&root, "wt-hotfix", &branch_head("hotfix/please"), true);
        register(
            &root,
            "wt-drill",
            "d46f71f7e036d87629f46efdb65f4b070b89cb36",
            true,
        );
        register(&root, "wt-lane", &branch_head("task/T-110-x"), true);

        let join = join_lanes(&read_lanes(&root), &[]);
        // ONE row: only the lane. Two entries in `not_lanes`, neither
        // silently dropped and neither classified as a task.
        assert_eq!(states(&join), [("T-110", DispatchState::StampSkipped)]);
        match &join {
            DispatchJoin::Joined { not_lanes, .. } => {
                assert_eq!(not_lanes.len(), 2, "got {not_lanes:?}");
                assert!(not_lanes
                    .iter()
                    .any(|e| matches!(e, WorktreeEntry::NotALane { branch, .. } if branch == "hotfix/please")));
                assert!(not_lanes
                    .iter()
                    .any(|e| matches!(e, WorktreeEntry::Detached { name, .. } if name == "wt-drill")));
            }
            other => panic!("expected a join, got {other:?}"),
        }
    }

    #[test]
    fn rows_come_back_sorted_by_task_id_whatever_order_the_board_was_in() {
        let root = repo_with_worktrees_dir("sorted");
        register(&root, "wt-z", &branch_head("task/T-999-z"), true);
        let board = [
            BoardStamp::new("T-300", "planned"),
            BoardStamp::new("T-100", "planned"),
            BoardStamp::new("T-200", "planned"),
        ];
        let join = join_lanes(&read_lanes(&root), &board);
        let ids: Vec<&str> = states(&join).into_iter().map(|(id, _)| id).collect();
        // The no-card lane sorts in with the rest rather than being
        // appended, which is what "sorted" has to mean to be useful.
        assert_eq!(ids, ["T-100", "T-200", "T-300", "T-999"]);
    }

    #[test]
    fn the_counts_seed_every_state_and_tally_the_rows() {
        let root = repo_with_worktrees_dir("counts");
        register(&root, "wt-live", &branch_head("task/T-100-live"), true);
        let board = [
            BoardStamp::new("T-100", "building"),
            BoardStamp::new("T-200", "building"),
            BoardStamp::new("T-300", "planned"),
            BoardStamp::new("T-400", "planned"),
        ];
        let counts = count_by_state(&join_lanes(&read_lanes(&root), &board));
        assert_eq!(counts.get(&DispatchState::Live), Some(&1));
        assert_eq!(counts.get(&DispatchState::Died), Some(&1));
        // SEEDED, not missing: a state with no rows reads as zero.
        assert_eq!(counts.get(&DispatchState::StampSkipped), Some(&0));
        assert_eq!(counts.get(&DispatchState::NotDispatched), Some(&2));
        assert_eq!(counts.len(), 4);
        assert_eq!(counts.values().sum::<usize>(), 4);

        // An unavailable join counts nothing and still names all four.
        let counts = count_by_state(&DispatchJoin::Unavailable {
            because: LaneScanRefusal::GitIsAFile,
            sentence: LaneScanRefusal::GitIsAFile.sentence().to_string(),
        });
        assert_eq!(counts.len(), 4);
        assert_eq!(counts.values().sum::<usize>(), 0);
    }

    #[test]
    fn truncation_is_carried_from_the_scan_onto_the_join() {
        // `truncated` is a PUBLIC field the board renders as "the answer
        // is a floor". The first pass had no fixture that made it true,
        // so hardcoding it false survived; this drives it end to end.
        //
        // **4097 AND 4096 ARE LITERALS.** `MAX_WORKTREE_ENTRIES` is 4_096;
        // sizing the fixture from the constant and asserting against the
        // constant would agree with itself at any value (CONVENTIONS,
        // T-063), which is exactly how the two size bounds next door
        // survived their mutants.
        let root = repo_with_worktrees_dir("truncated");
        let base = root.join(".git").join("worktrees");
        for n in 0..4097 {
            fs::create_dir_all(base.join(format!("e{n:06}"))).expect("entry dir");
        }
        let scan = read_lanes(&root);
        let join = join_lanes(&scan, &[]);
        match &join {
            DispatchJoin::Joined {
                rows,
                not_lanes,
                truncated,
            } => {
                assert!(*truncated, "the ceiling was reached and not reported");
                assert_eq!(rows.len(), 0, "none of the entries is a lane");
                assert_eq!(
                    not_lanes.len(),
                    4096,
                    "the list must be the ceiling exactly, not more and not fewer"
                );
            }
            other => panic!("expected a join, got {other:?}"),
        }
        // And the entries kept are the FIRST 4096 BY NAME, not whichever
        // 4096 the filesystem handed back first — the property that makes
        // the truncation deterministic and the reason the ceiling is
        // applied after the sort (see `MAX_WORKTREE_ENTRIES`' comment).
        match &join {
            DispatchJoin::Joined { not_lanes, .. } => {
                let first = match &not_lanes[0] {
                    WorktreeEntry::Unreadable { name, .. } => name.as_str(),
                    other => panic!("expected an unreadable entry, got {other:?}"),
                };
                let last = match &not_lanes[4095] {
                    WorktreeEntry::Unreadable { name, .. } => name.as_str(),
                    other => panic!("expected an unreadable entry, got {other:?}"),
                };
                assert_eq!((first, last), ("e000000", "e004095"));
            }
            other => panic!("expected a join, got {other:?}"),
        }

        // POSITIVE CONTROL: a repository under the ceiling reports false,
        // so `truncated` tracks the entry count rather than being pinned
        // to either constant.
        let small = repo_with_worktrees_dir("truncated-control");
        register(&small, "wt", &branch_head("task/T-1-x"), true);
        assert!(matches!(
            join_lanes(&read_lanes(&small), &[]),
            DispatchJoin::Joined {
                truncated: false,
                ..
            }
        ));
    }
}
