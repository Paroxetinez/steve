# Steve

Steve is a relationship copilot for 1:1 conversations.

Instead of acting like a generic chatbot, Steve steps into a direct chat like a shared friend: it notices when two people are warming up, stalling, misreading each other, or hovering around the same unresolved topic, then offers a short, socially-aware nudge to keep the conversation moving.

This project is being extended with EverMemOS as a long-term relationship memory sidecar so Steve can remember not just facts about two people, but the arc of their relationship, the loops they fall into, and the kinds of interventions that actually help.

## Live Demo

- Web: `https://steve.linchance.com`

The live demo reflects the current Steve web experience. The EverMemOS-backed relationship memory flow is being integrated in this repository and documented below.

## Why This Project Exists

Most AI chat assistants are good at reacting to the last few turns of a conversation and bad at understanding relationship history.

That creates three product problems:

- They miss long-running patterns such as repeated hesitation, soft misunderstandings, or nearly-planned meetups that never land.
- They cannot adapt intervention style to a specific pair of people over time.
- They fail to create the feeling that the assistant actually understands the relationship, not just the latest message.

Steve is designed to solve that gap. The product goal is not to replace the conversation. It is to help people get unstuck, move closer, and feel better understood.

## Core Features

- `Steve intervention`
  - A user can explicitly ask Steve to help inside a direct chat.
  - Steve can also appear automatically in selected moments when the conversation benefits from a light-touch nudge.
- `Relationship-aware chat`
  - Steve treats direct chat as an evolving relationship, not as isolated messages.
  - The product is designed to remember stage, tone, recurring loops, unresolved threads, and likely next momentum.
- `Lightweight relationship insights`
  - Steve surfaces compact summaries and reports instead of raw memory dumps.
  - The goal is practical clarity, not surveillance-style analytics.
- `Social-first UX`
  - The web app supports auth, profile setup, install prompt, inbox, chat, add-friends flow, reports, and preference management in a mobile-style interface.

## How EverMemOS Powers Steve

Steve uses EverMemOS as a memory sidecar, not as the primary chat database.

The architecture is intentionally simple:

1. `Convex` remains the source of truth for users, conversations, messages, unread state, media state, and UI-facing product data.
2. Selected direct-chat messages are mirrored asynchronously to `EverMemOS`.
3. EverMemOS extracts long-term memory signals such as `profile`, `episodic_memory`, `event_log`, and `foresight`.
4. Steve converts those raw memories into compact relationship context that can shape intervention timing, intervention tone, and lightweight reports.

This split keeps the chat product responsive while letting memory evolve independently.

For the integration model, data boundaries, and memory flow, see [docs/evermemos-integration.md](./docs/evermemos-integration.md).

## What Makes The Memory Layer Different

Steve is not trying to remember more profile labels.

The stronger idea is to remember:

- how each person tends to express interest, hesitation, frustration, or care
- what kind of conversational loops this pair falls into
- which topics keep returning without resolution
- whether Steve's previous interventions actually improved the interaction

That makes EverMemOS useful as a relationship-memory engine rather than a generic fact store.

## Quick Start

This is the fastest path to run the web app locally with the current Steve stack.

### Prerequisites

- Node.js `20+`
- Yarn `1.22+`
- A Convex deployment for local development
- A running EverMemOS API if you want to test the memory sidecar locally

### 1. Install dependencies

```bash
yarn install
```

### 2. Start Convex

In one terminal:

```bash
cd packages/backend
npx convex dev
```

This will create or update local Convex metadata and print the deployment URL used by the app.

### 3. Configure the web app

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

If you want the EverMemOS sync path enabled during development, also configure these environment variables in your Convex deployment:

```bash
EVERMEMOS_BASE_URL=http://localhost:1995/api/v1
EVERMEMOS_API_KEY=
```

### 4. Run the web app

In another terminal:

```bash
yarn workspace web-app dev
```

Then open `http://localhost:3000`.

## Repository Structure

- `apps/web`
  - Next.js web app for Steve
- `apps/native`
  - React Native client
- `packages/backend`
  - Convex backend, chat logic, Steve intervention logic, and EverMemOS integration hooks
- `docs`
  - Product notes, integration documents, and implementation plans

## Competition Fit

This project is primarily aimed at the `Agent + Memory` track of the Memory Genesis Competition 2026.

Why it fits:

- `Innovation`
  - Steve uses memory to model relationship dynamics and intervention effectiveness, not just static user facts.
- `Technical depth`
  - The system combines a real-time chat runtime with an asynchronous long-term memory sidecar.
- `Consumer value`
  - The product is built around a concrete user problem: helping real conversations move forward with better timing, tone, and context.

## Current Status

The repository already contains the Steve product experience and the first layer of EverMemOS integration work in `steve`:

- direct-chat message mirroring contract
- EverMemOS HTTP client scaffolding
- asynchronous sync entry points from chat messages and Steve assistant messages
- relationship-memory cache schema and first-pass summarization utilities

The next steps are to complete retrieval-backed relationship state refresh, use that state inside Steve intervention generation, and expose memory-backed insights in reports.

## Additional Reading

- [EverMemOS integration guide](./docs/evermemos-integration.md)
- [EverMemOS memory design notes](./docs/plans/2026-03-13-evermemos-steve-memory-design.md)
- [EverMemOS implementation plan](./docs/plans/2026-03-13-evermemos-steve-implementation.md)

