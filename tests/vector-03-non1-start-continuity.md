<!--
TEST VECTOR 03 - Non-1 list start remains continuous across fenced code

Requirement:
- A sequence that starts at 5 remains 5 -> fenced code -> 6.
- Enter after 6 must produce 7.
- Tab on the new 7 must produce 6.1.

Manual check in Obsidian:
1. Open this file in the test Vault with the plugin enabled.
2. Put the caret at the end of `6. AFTER`.
3. Press Enter: the new item must be `7. `.
4. Press Tab: the new item must become `6.1. `.
5. `5.` and `6.` must not be rewritten to `1.` and `2.`.
-->
<!-- TEST-DOCUMENT-START -->
5. TEST

```text
test
```

6. AFTER
<!-- TEST-DOCUMENT-END -->
