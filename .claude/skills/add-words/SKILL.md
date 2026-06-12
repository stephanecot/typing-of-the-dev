---
name: add-words
description: Add typed words to Typing of the Dev banks (rules - AZERTY-safe, no accents, FR/EN parity, short words for easy mode). Use when the user asks for more words/insults/commands.
---

# Add words

All banks live in `public/js/data/words.js`. Hard rules (checked by
`npm run check`):

- **Never** `{ } [ ]` (AltGr pain on AZERTY). Avoid other AltGr-heavy chars
  when an alternative reads as well.
- **Never** accented characters (é→e, è→e…) — words must be typable on any
  layout, and the banks are lowercase except CamelCase exception names.
- Every sizeable bank needs **a few words ≤ 10 chars** (STAGIAIRE has
  `maxLen: 10`; `pickWord` falls back to the whole bank but short words must
  exist for a fair game).
- Banks whose humor is French (deadlines, missiles, spammers, buzzwords,
  poIdeas, freelance, insults) have an **EN variant in `WORDS.en`** — add to
  both, similar counts. Tech-jargon banks (keywords, exceptions, snippets,
  commands, legacyNames, typos, obfuscation) are shared.
- Insults stay **booth-friendly** (cheeky, never crude); the combinatorial
  generator at the bottom of words.js (`expandInsults`) multiplies
  noun × domain — extending those arrays beats adding one-off entries.
- Append under a `// — extension N —` marker, mind duplicates within a bank.

Validate with `npm run check` (scans every bank).
