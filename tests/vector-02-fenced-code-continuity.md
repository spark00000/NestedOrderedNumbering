<!--
TEST VECTOR 02 - Numbering continues across fenced code

Requirement:
- A standalone fenced code block does not force the visible/plain-text ordered numbering after it to restart at 1.
- The code block is transparent to Nested Ordered Numbering's logical sequence.

Manual check in Obsidian:
1. Open this file in the test Vault with the plugin enabled.
2. Put the caret at the end of `4. TEST4`.
3. Press Enter: the new item must be `5. `.
4. Press Tab on that new empty item: it must become `4.1. `.
5. Items 1-4 must not be renumbered or reset.
-->
<!-- TEST-DOCUMENT-START -->
1. TEST1
2. TEST2
3. TEST3

```text
1. TTTT
2. TTTT
3. TTTT
```

4. TEST4
<!-- TEST-DOCUMENT-END -->
