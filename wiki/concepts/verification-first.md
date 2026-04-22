# Verification-First Engineering

- **Source:** Ajey Gore (via Martin Fowler)
- **Article:** https://ajeygore.in/content/the-expensive-thing
- **Referenced in:** [martin-fowler-fragments-2026-04-02](../source-summaries/martin-fowler-fragments-2026-04-02.md)

## Overview

When coding agents make execution free, verification becomes the expensive resource. This inverts the traditional engineering model where writing code is the bottleneck.

## Key Points

- "Correct" has thousands of shifting, context-dependent definitions in large systems
- Judgment that agents cannot perform for you — defining what "correct" means in each context
- Agents do well when they have good, preferably automated, verification
- Organizations should reorganize around verification rather than writing code

## Organizational Shift

> "The team that used to have ten engineers building features now has three engineers and seven people defining acceptance criteria, designing test harnesses, and monitoring outcomes."

Standup changes from "what did we ship?" to "what did we validate?"

## lid as a Verification-First Project

lid embodies this principle:
- 94 tests across 76 dithering assertions and 18 CLI tests
- The test suite is the product — the dithering code is the implementation
- `--dry-run`, `--json`, and `--help` flags are all verification surfaces
- The browser UI's before/after split view is a visual verification tool

## See Also

- [Cognitive surrender](./cognitive-surrender.md) — why verification prevents surrender
- [Three layers of system health](./system-health.md) — verification combats all three debt types
