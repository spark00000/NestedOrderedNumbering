<!--
TEST VECTOR 04 - Nested sequence remains continuous across fenced code

Requirement:
- A fenced code block between nested siblings is transparent to the custom numbering sequence.
- Enter after 1.2 must create 1.3, not 1.1 or 1.

Manual check in Obsidian:
1. Open this file in the test Vault with the plugin enabled.
2. Put the caret at the end of `1.2. after`.
3. Press Enter: the new item must be `1.3. `.
4. Earlier items must not be renumbered.
-->
<!-- TEST-DOCUMENT-START -->
1. test
  1.1. before

```text
test
```

  1.2. after
<!-- TEST-DOCUMENT-END -->
