<!--
TEST VECTOR 01 - Fenced code is plugin-inert

Requirement:
- Text inside a fenced code block is literal code.
- Nested Ordered Numbering must not handle Enter, Tab, Shift+Tab, or renumber numbering-like text inside the fence.

Manual check in Obsidian:
1. Open this file in the test Vault with the plugin enabled.
2. Put the caret immediately after `1.1. literal code` inside the code block.
3. Press Enter. The plugin must not generate a numbered item.
4. Undo, then press Tab and Shift+Tab. The plugin must not renumber or move the code line.
5. `1.1. literal code` must stay literal code.
-->
<!-- TEST-DOCUMENT-START -->
1. test
  1.1. test

```text
test
1.1. literal code
```

  1.2. after
<!-- TEST-DOCUMENT-END -->
