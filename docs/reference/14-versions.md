# 14 — Versions

A selected project has separate versioned inputs. Keep their identities
when saving evidence, resuming work or upgrading the method.

- PRODUCT history identifies the code, its committed root
  `supertaskr.yaml`, and its public documentation. A working settings
  edit takes effect after it is committed; observation can explicitly
  inspect working settings.
- RECORDS history identifies the private cards, foundation documents,
  plans, reviews and completion records. A local save receipt names the
  exact accepted commit. Later edits do not change that receipt.
- TOOL identifies the installed parser, method assets and runtime
  components by their manifest and content hashes. A package version
  alone does not establish that every required component is present.
- RUNTIME belongs to one local PRODUCT checkout. It holds the selected
  records binding, operation progress and session observations. It is
  not copied into private history or a portable records backup.

## Method updates

The app embeds a method snapshot, and an installed TOOL carries its own
verified method assets. A project's adopted method version records which
snapshot its generated files came from. Upgrading the application or
installing another TOOL does not prove that a project adopted it.

Review generated changes against the project's current files. Preserve
user edits and the previous history, and record adoption only after the
intended generated changes are accepted. A pending or interrupted update
retains its original operation and must be reconciled before a different
update replaces it. An unsupported version or changed original context
is a refusal, not permission to infer a newer snapshot.

## Saved and delivered versions

Local save, optional private backup, protected integration, publication
and CI answer different questions. Each result belongs to its captured
commit and original destination. Stored progress is not fresh evidence
that a receiver accepted it. Reopening a project may reconcile an original
operation; it must not substitute the latest branch tip or create another
operation merely because the previous response was unavailable.

A records backup preserves the qualified private history reachable from
its accepted save. It excludes uncommitted files and local operational
state. Restore into a new home and verify its association before selecting
it. Restoring records does not restore grants, credentials or permission
to resume an old worker.

Project roadmaps, release planning and their historical decisions belong
in the selected private records home. This public chapter describes the
version contracts and does not publish a project's development board.

## Inspecting and restoring a private backup

Use `supertaskr backup inspect FILE` to read the artifact's saved commit,
history digest and file count without selecting a project. Use
`supertaskr backup restore FILE --to NEW_RECORDS` to restore into a new
records directory. Its parent must already exist outside a Git repository.
The original records home and binding need not be available.

An existing or partial destination is preserved and refused. If restoration
stops, preserve the partial directory for inspection. Verify the restored
association before selecting it; restoration itself installs no binding,
runtime, credentials or worker authority.

## Interrupted local setup

New setup creates local PRODUCT and RECORDS history. Reopen the original
PRODUCT folder to discover its captured setup and reconcile the same
operation. Keep both selected folders and the original TOOL available.
Do not clear claims, edit progress, create a replacement setup or publish
anything to recover a missing response.

There is one narrow interval requiring operator help: setup may stop after
creating an empty staging directory but before durably recording that
directory's physical identity. `PROJECT_INIT_STAGE_UNATTRIBUTED` preserves
the directory and claims instead of adopting unknown contents. Stop other
work on both selected folders, inspect the original operation and exact
reported stage, and verify it is an empty ordinary directory. Preserve it
by moving it into a new location outside both selected folders. Keep that
preserved directory; do not delete it or edit the operation record.

Then reconcile the original setup again. It may create a new attributed
stage and complete only its originally captured files and commits. The
preserved unknown directory stays untouched. If the directory contains
files, is linked, has changed, or its original operation cannot be
identified, leave it in place and investigate before continuing. This
manual preservation procedure is not automatic crash recovery or a grant
to adopt unrelated files.
