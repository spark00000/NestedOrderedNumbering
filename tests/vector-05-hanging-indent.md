# Variable-prefix hanging-indent manual vector

Use a narrow editor pane so every long item wraps to at least two visual lines.

Acceptance rules for every nested item:

1. The numbering prefix itself must move right with hierarchy depth.
2. The first content character must begin after the full prefix.
3. Every wrapped continuation line must begin exactly under that first content character.
4. Root Markdown list markers must keep Obsidian's native layout behavior.

9. TEST root marker position.
  9.1. TEST level two marker position.
    9.1.1. TEST level three marker position.
      9.1.1.1. TEST level four marker position.

1. Root item with enough text to wrap onto another visual line and verify root alignment root alignment root alignment root alignment root alignment.
10. Two-digit root item with enough text to wrap onto another visual line and verify root alignment root alignment root alignment root alignment.
  10.1. Nested item with enough text to wrap onto another visual line and verify nested alignment nested alignment nested alignment nested alignment.
    10.1.1. Deeper item with enough text to wrap onto another visual line and verify deeper alignment deeper alignment deeper alignment deeper alignment.
      10.12.3. Multi-digit segments with enough text to wrap onto another visual line and verify dynamic prefix width dynamic prefix width dynamic prefix width.
