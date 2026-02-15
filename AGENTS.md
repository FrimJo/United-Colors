# AGENTS.md

Agent operating guide for this repository. Follow this file first, then user/developer instructions.

## Do / Don't

Do:
- Keep changes small, scoped, and reversible.
- Enforce strict Separation of Concerns (SoC): `domain`, `application`, `infrastructure`, `presentation`.
- Keep `domain` pure TypeScript with no React/Expo/platform imports.
- Add or update tests for behavior-changing logic.
- Run quality checks before finishing work.

Don't:
- Mix game rules into UI components.
- Add unapproved dependencies or change locked versions.
- Introduce ESLint/Prettier; use Biome only.
- Perform broad rewrites when targeted edits are enough.
- Assume behavior details when legacy code can verify them.

## Locked Stack

Use exactly:
- Expo `54`
- React Native `0.81`
- React `19.1.0`
- TypeScript `5.9.3`
- Node `24.13.1`
- pnpm `10.29.3` via Corepack

Repository requirements:
- `.nvmrc` must be `24.13.1`.
- `package.json` must include:
  - `"engines": { "node": "24.13.1", "pnpm": "10.29.3" }`
  - `"packageManager": "pnpm@10.29.3"`

## Setup and Command Conventions

Full-project commands:
- `corepack enable`
- `nvm use` (or install/use Node `24.13.1`)
- `pnpm install`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm test`

File-scoped commands (preferred while iterating):
- `pnpm biome check <path>`
- `pnpm biome format --write <path>`

Before opening a PR, run full-project checks.

## Architecture and Boundaries

Target structure:
- `src/domain`: entities, rules, simulation, collision, scoring (pure TS)
- `src/application`: orchestration, app/game flow use-cases, store wiring
- `src/infrastructure`: sensor/audio/storage/clock adapters
- `src/presentation`: React Native screens/components, Skia rendering, overlays
- `src/app`: bootstrap, providers, composition root

Boundary rules:
- `presentation` may depend on `application` contracts, never domain internals.
- `infrastructure` implements interfaces owned by `application`/`domain`.
- `domain` must be deterministic and testable without device APIs.

## Product Constraints

- Platforms: Android + iOS day one.
- Behavior parity first.
- Keep kiosk mode.
- Gyro-only controls in v1.
- No online leaderboard in v1.
- Persist high score + settings.
- Portrait only.
- New app IDs/store listings (no legacy release continuity).

## Testing and Quality Gates

Minimum expected checks:
- Unit tests for state transitions, collisions, spawn progression, bounds, persistence roundtrip.
- TypeScript strict pass.
- Biome lint + format checks pass.

If behavior changes, update/add tests in the same change.

## Safety and Change Hygiene

- Prefer reading legacy behavior from `origin/master` over guessing.
- Document assumptions in PR notes or handoff summary.
- Avoid destructive commands unless explicitly requested.
- Never commit secrets or machine-local paths.

## When Stuck

- Stop and state the blocker clearly.
- Provide 1-2 concrete options with tradeoffs.
- Default to the smallest safe step that preserves parity and SoC.
