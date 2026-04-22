# Three Layers of System Health

- **Source:** Margaret-Anne Storey et al.
- **Paper:** https://arxiv.org/abs/2603.22106
- **Referenced in:** [martin-fowler-fragments-2026-04-02](../source-summaries/martin-fowler-fragments-2026-04-02.md)

## Overview

Storey proposes three distinct but interacting layers of system health, each with its own debt type, accumulation mechanism, and consequence:

| Layer | Debt lives in | Accumulates when | Limits |
|-------|--------------|-------------------|--------|
| Technical | Code | Implementation decisions compromise future changeability | How systems can change |
| Cognitive | People | Shared understanding erodes faster than replenished | How teams can reason about change |
| Intent | Artifacts | Goals and constraints are poorly captured or maintained | Whether the system reflects what we meant to build |

## Key Insight

Intent debt is the most overlooked layer. It's not about code quality or team knowledge — it's about whether the system's goals and constraints are captured in artifacts (docs, specs, comments, tests, configuration) well enough that both humans and AI agents can evolve the system effectively.

## Relation to lid

Intent debt is directly relevant to lid's design: the README, the algorithm documentation, the test suite, and the CLI flags all serve as intent artifacts. When they drift from the code's actual behavior, agents (and humans) can no longer reliably evolve the system.

## See Also

- [Cognitive surrender](./cognitive-surrender.md) — cognitive debt's relationship to AI
- [Verification-first engineering](./verification-first.md) — how verification combats all three debt types
