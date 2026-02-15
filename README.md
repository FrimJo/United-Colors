# United Colors (React Native)

Greenfield rebuild of the legacy Android game into a modern Expo/React Native app with strict SoC.

## Locked Versions

- Expo `54`
- React Native `0.81`
- React `19.1.0`
- TypeScript `5.9.3`
- Node `24.13.1`
- pnpm `10.29.3`

## Setup

```bash
nvm use
corepack enable
corepack use pnpm@10.29.3
pnpm install
```

## Run

```bash
pnpm start
```

## Quality

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Architecture

- `src/domain`: pure gameplay logic (rules, state machine, collision, spawning)
- `src/application`: orchestration and stores
- `src/infrastructure`: sensor, storage, clock, audio adapters
- `src/presentation`: Skia rendering and overlays
- `src/app`: composition root and bootstrap

## Docs

- Legacy parity checklist: `docs/legacy-parity-checklist.md`
- Remaining parity implementation plan: `docs/remaining-parity-implementation-plan.md`
- Developer implementation handoff: `docs/implementation-handoff.md`
- Manual parity QA script: `docs/parity-qa.md`

## Notes

- v1 intentionally excludes online leaderboards.
