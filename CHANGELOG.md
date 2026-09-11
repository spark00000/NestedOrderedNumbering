# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and use [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.5] - 2026-09-11

### Fixed

- Fenced code blocks are fully excluded from Nested Ordered Numbering keyboard handling, so numbering-like text such as `1.1.` remains literal code.
- Numbering remains continuous across standalone fenced code blocks, including non-1 starts such as `5.` -> code block -> `6.` and nested continuations.
- Rebuilt and committed `main.js` from the current TypeScript sources so the shipped runtime contains the fenced-code fixes.

### Added

- Added Markdown regression vectors under `tests/` for fenced-code isolation, root continuity, non-1 starts, and nested continuity.
- CI now verifies that a production build leaves committed `main.js` unchanged, preventing stale runtime bundles from passing verification.

## [0.3.4] - 2026-08-30

### Fixed

- Pressing Enter on a prefix-only item now removes the prefix and leaves one
  plain blank line instead of generating another numbered item.

### Changed

- Shortened internal command IDs so Obsidian can add the plugin ID without
  duplication. Reassign custom command hotkeys after upgrading if necessary.

## [0.3.3] - 2026-08-28

### Fixed

- Renumber downstream root items after an inserted item is indented into an
  intermediate level, including numbered blocks separated by blank lines.
- Replaced stale marketplace copy with the final public author and a concise,
  action-oriented description.

### Added

- Added an automated Enter-then-Tab regression test for the intermediate-level
  insertion workflow.

## [0.3.2] - 2026-08-24

### Fixed

- Updated CI and release automation to Node.js 22 for pnpm 11.19 compatibility.

### Changed

- Kept generated `main.js` out of the source branch and published it only as a
  GitHub release asset.
- Added stricter Community directory manifest and packaging checks.

## [0.3.1] - 2026-08-24

### Fixed

- Kept the first, second, and deeper hierarchy levels visually uniform in Live
  Preview by neutralizing Obsidian's Markdown-list and indented-code offsets only
  on parser-recognized numbering lines.
- Included `styles.css` in manual installation and GitHub release instructions.

## [0.3.0] - 2026-08-24

### Added

- Fixed-width hierarchy layout: content advances four columns per level.
- Automatic normalization of legacy four-space or tab-indented numbered blocks.
- Compatibility handling for Outliner and other highest-priority editor keymaps.
- Commands for insert, delete, and renumber operations, ready for user-assigned hotkeys.
- Automated tests, CI, release checks, and marketplace documentation.

### Changed

- Hierarchy indentation is now two spaces per level because each numeric prefix
  adds two visible characters per level.

## [0.2.0] - 2026-08-24

### Added

- Root-level Shift+Tab converts an item to plain text.
- Direct keyboard shortcuts and Outliner conflict mitigation.

## [0.1.0] - 2026-08-24

### Added

- Initial proof of concept for Enter, Tab, Shift+Tab, subtree movement,
  insertion, deletion, renumbering, and single-step undo.
