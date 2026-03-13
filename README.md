# Steve

This directory is a submission-ready wrapper for the Steve and EverMemOS pairing.

It contains:

- `steve/`
  - the Steve product codebase, including the current web experience and the in-progress EverMemOS integration work
- `EverMemOS/`
  - the upstream EverMemOS long-term memory system used as Steve's memory sidecar

## Live Demo

- Steve web demo: `https://steve.linchance.com`

## What This Package Is For

This wrapper exists to keep the competition submission easy to review.

The two projects are intentionally kept side by side:

- `steve` shows the product that users interact with
- `EverMemOS` shows the memory engine the product builds on

This makes it easier to review:

- the Steve product experience
- the EverMemOS memory platform
- the integration boundary between them

## Where To Start

If you want to understand the submission quickly, read in this order:

1. [steve/README.md](./steve/README.md)
2. [steve/docs/evermemos-integration.md](./steve/docs/evermemos-integration.md)
3. [EverMemOS/README.md](./EverMemOS/README.md)
4. [EverMemOS/docs/STARTER_KIT.md](./EverMemOS/docs/STARTER_KIT.md)

## Directory Layout

```text
steve-evermemos-repo/
├── README.md
├── steve/
└── EverMemOS/
```

## Notes

- `steve` is the active integration workspace.
- `EverMemOS` is included as the memory-system source and reference implementation.
- The live demo currently reflects Steve's deployed web product, while the repository continues to expand the EverMemOS-backed relationship memory flow.
