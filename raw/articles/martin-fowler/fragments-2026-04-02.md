# Martin Fowler — Fragments: April 2, 2026

Source: https://martinfowler.com/fragments/2026-04-02.html
Archived: 2026-04-22

---

## 1. Three Layers of System Health (Margaret-Anne Storey)

Margaret-Anne Storey proposes three layers of system health:

- **Technical debt** lives in code. It accumulates when implementation decisions compromise future changeability. It limits how systems can change.
- **Cognitive debt** lives in people. It accumulates when shared understanding of the system erodes faster than it is replenished. It limits how teams can reason about change.
- **Intent debt** lives in artifacts. It accumulates when the goals and constraints that should guide the system are poorly captured or maintained. It limits whether the system continues to reflect what we meant to build and it limits how humans and AI agents can continue to evolve the system effectively.

Article: https://arxiv.org/abs/2603.22106

## 2. Tri-System Theory of Cognition (Shaw & Nave)

Shaw and Nave at the Wharton School add LLMs to Kahneman's two-system model:

- **System 1** (intuition): rapid, often barely-conscious decisions
- **System 2** (deliberation): applied, deliberate thinking
- **System 3** (AI): externally generated artificial reasoning

Key concept: **cognitive surrender** — uncritical reliance on AI-generated reasoning, bypassing System 2 entirely. This is distinct from **cognitive offloading**, which is strategic delegation of cognition during deliberation.

Paper: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6097646

## 3. Code Icons Use `< >` — Why?

Observation that illustrations use `< >` as a code icon symbol. The reason is HTML/XML thinking, but programmers don't program in HTML.

## 4. Verification as the Expensive Thing (Ajey Gore)

Ajey Gore asks: if coding agents make coding free, what becomes expensive? Answer: **verification**.

Key points:
- "Correct" has thousands of shifting, context-dependent definitions in large systems
- Judgment that agents cannot perform for you
- Agents do well when they have good, preferably automated, verification
- Organizations should reorganize around verification rather than writing code
- "The team that used to have ten engineers building features now has three engineers and seven people defining acceptance criteria, designing test harnesses, and monitoring outcomes"
- "It's uncomfortable because it demotes the act of building and promotes the act of judging"

Article: https://ajeygore.in/content/the-expensive-thing

Fowler's quibble: agrees agentic coding is overrated for legacy migration, but LLMs help a great deal in *understanding* what legacy code is doing.

## 5. Future of Source Code (David Cassel / The New Stack)

Overview of views on the future of code:
- Some experimenting with new languages built for LLMs
- Others think strictly typed languages (TypeScript, Rust) are the best fit
- Fowler's view: humans still need to work with LLMs to build useful abstractions — DDD's **Ubiquitous Language**
- Unmesh's take: "Programming isn't just typing coding syntax that computers can understand and execute; it's shaping a solution. We slice the problem into focused pieces, bind related data and behaviour together, and—crucially—choose names that expose intent. Good names cut through complexity and turn code into a schematic everyone can follow."

Article: https://thenewstack.io/ai-programming-languages-future/
Conversation: https://martinfowler.com/articles/convo-llm-abstractions.html
