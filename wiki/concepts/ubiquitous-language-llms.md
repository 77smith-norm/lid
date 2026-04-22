# Ubiquitous Language for LLMs

- **Source:** Martin Fowler, Unmesh Joshi (via Martin Fowler)
- **Conversation:** https://martinfowler.com/articles/convo-llm-abstractions.html
- **DDD Concept:** [Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html)
- **Referenced in:** [martin-fowler-fragments-2026-04-02](../source-summaries/martin-fowler-fragments-2026-04-02.md)

## Overview

As LLMs become coding partners, the human role shifts from writing syntax to shaping abstractions. The DDD concept of **Ubiquitous Language** — a shared vocabulary between domain experts and developers — extends naturally to human-LLM collaboration.

## Key Insight

> "Programming isn't just typing coding syntax that computers can understand and execute; it's shaping a solution. We slice the problem into focused pieces, bind related data and behaviour together, and—crucially—choose names that expose intent. Good names cut through complexity and turn code into a schematic everyone can follow."

The most creative act is "continual weaving of names that reveal the structure of the solution that maps clearly to the problem we are trying to solve."

## Implications

- Humans define the abstraction layer; LLMs work within it
- Naming is the primary interface between human intent and AI execution
- Strictly typed languages (TypeScript, Rust) may be best suited for LLM collaboration because their type systems encode intent
- Growing a language with LLMs means iteratively refining the shared vocabulary

## See Also

- [Verification-first engineering](./verification-first.md)
- [Cognitive surrender](./cognitive-surrender.md)
