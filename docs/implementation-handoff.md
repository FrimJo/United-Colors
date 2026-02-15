# Implementation Handoff

## Context
This repository is a greenfield rebuild of legacy Android game logic into React Native. The old project files were intentionally removed; legacy behavior reference is from `origin/master` and documented in `docs/legacy-parity-checklist.md`.

## What Is Already Done
- Stack pinned to required versions.
- Core project scaffolding complete.
- SoC directory structure established.
- Event-driven game engine (`EngineStepResult`) with deterministic RNG injection.
- Point lifecycle parity (grow -> pulse -> fade/shrink -> delayed removal).
- Audio service implemented with `expo-audio` and orchestrator event wiring.
- Sensor pipeline includes calibration, dead-zone, EMA smoothing, clamping.
- Textured + glare rendering and kiosk/start image parity.
- AppState pause behavior, Android hardware back-to-kiosk handling, conditional keep-awake.
- Versioned storage payload support with legacy fallback paths.
- Expanded tests for domain events/rules, orchestrator side effects, sensors, storage.
- CI/Jest/Biome/typecheck baseline working with workspace fix.

## Known Gaps to Implement Next
1. Manual parity QA script pass on physical Android and iOS devices.
2. FPS/perf verification in release builds.
3. Final confirmation of production app identifiers/store metadata.
4. EAS internal/production track validation.

## Source-of-Truth Files
- Architecture guidance: `AGENTS.md`
- Legacy parity checklist: `docs/legacy-parity-checklist.md`
- Remaining work plan: `docs/remaining-parity-implementation-plan.md`
- QA runbook: `docs/parity-qa.md`

## Implementation Order (Required)
1. Run `docs/parity-qa.md` on physical devices and capture results.
2. Execute release-profile validation from `eas.json`.
3. Finalize release metadata (bundle identifiers/listings) and store configuration.

## Public Interface Changes Expected
- `GameEngine.step(input)` now returns `EngineStepResult` (frame + events).
- Orchestrator now owns side effects from engine events (audio/sensor readiness).
- Presentation remains frame-driven and side-effect free.

## Quality Gates Before Merge
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- Manual parity QA pass from `docs/parity-qa.md`

## Notes for Next Developer
- Keep all gameplay rules in `src/domain` only.
- Avoid moving platform APIs into domain/application layers.
- Do not introduce ESLint/Prettier; Biome is authoritative.
- Preserve pinned versions unless explicitly approved.
