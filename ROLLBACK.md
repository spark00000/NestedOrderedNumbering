# Local rollback record

The exact pre-0.3.1 change backup is:

`E:\SRC\NestedOrderedNumbering.change-backup-20260824-064915-tab-layout`

SHA-256 verification succeeded for all 21 existing files captured from the
project and both Vault installations. `ABSENT_BEFORE_CHANGE.txt` records the
three `styles.css` files that did not exist before this change.

To restore the project, copy the files under `project\` back to the same relative
paths under `E:\SRC\NestedOrderedNumbering`. To restore either installation,
replace its files from `test-vault-plugin\` or `src-vault-plugin\`, then remove the
new `styles.css` recorded as absent and verify SHA-256 hashes again.

`E:\SRC\NestedOrderedNumbering.backup-20260824-063859-tabfix` is preserved but is
not the authoritative backup: `Copy-Item` expanded pnpm links, so its entry count
did not match the source. No project source was changed during that failed backup
attempt.

This record is intentionally excluded from Git.
