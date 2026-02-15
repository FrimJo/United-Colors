# Remaining Parity Implementation Plan

## Status Update (2026-02-15)
- Phases A through H are implemented on the current React Native branch.
- Automated checks currently pass: `pnpm preflight` (typecheck, lint, format) and `pnpm test`.
- Remaining work is Phase I (manual parity QA/perf/release validation).

## Goal
Complete parity with the legacy Android app (`origin/master`) for gameplay, flow, and feel, while preserving current architecture and stack constraints.

## Current State Summary
- Greenfield Expo 54 + RN 0.81 app is in place.
- SoC layers exist (`domain`, `application`, `infrastructure`, `presentation`, `app`).
- Core loop and basic gameplay are implemented.
- Strict TypeScript, Biome, Jest, CI are configured.
- Major parity gaps remain in event wiring, audio, sensor fidelity, render style, lifecycle behavior, and test depth.

## Constraints (Locked)
- Expo `54`
- React Native `0.81`
- React `19.1.0`
- TypeScript `5.9.3`
- Node `24.13.1`
- pnpm `10.29.3`
- Biome only for lint/format
- Gyro-only controls
- Portrait only
- No online leaderboard in v1

## Phase A — Domain Contracts and Event Model
1. Extend `src/domain/types/GameTypes.ts` with:
- `EngineEvent` union (`POINT_SPAWNED`, `DOT_CONSUMED`, `POINT_CONSUMED`, `SCORE_CHANGED`, `GAME_OVER`, `PHASE_CHANGED`).
- `EngineStepResult` contract (`frame`, `events`).
- `RandomProvider` interface for deterministic tests.
2. Refactor `src/domain/engine/GameEngine.ts`:
- Change `step()` return from `RenderFrame` to `EngineStepResult`.
- Emit events in strict update order.
- Keep frame snapshot logic unchanged for presentation consumers.

## Phase B — Rules Fidelity Hardening
1. Point-dot lifecycle parity:
- Spawn grow-in animation stage.
- Pulse after grow-in.
- Fade timeout and delayed removal behavior aligned to legacy timing.
2. Collision fidelity:
- Same-color consume: score +1 and size increment.
- Point consume: score +5, forced removal, player color switch.
- Wrong-color collision: immediate game over state transition.
3. Spawn fidelity:
- Maintain dynamic spawn interval curve against `MAX_TIME_DIFFICULTY`.
- Keep kiosk ambient limits and normal mode dot cap.

## Phase C — Sensor Fidelity
1. Replace raw tilt mapping in `src/infrastructure/sensors/DeviceMotionAdapter.ts` with:
- Calibration window.
- Dead-zone threshold.
- Smoothing (EMA).
- Clamp max influence.
2. Preserve gyro-only behavior.
3. Expose sensor readiness state for UI and orchestrator.

## Phase D — Audio Parity
1. Implement `src/infrastructure/audio/AudioService.ts` using `expo-audio`:
- `preload()` for `blop.ogg` and `jump.ogg`.
- `playBlop()`, `playJump()`, `dispose()`.
2. Wire domain events in `src/application/orchestrators/GameSessionOrchestrator.ts`:
- `POINT_SPAWNED` -> `playJump()`.
- `DOT_CONSUMED`/`POINT_CONSUMED` -> `playBlop()`.
3. Honor `soundEnabled` from settings store.

## Phase E — Rendering and UI Parity
1. Upgrade `src/presentation/game/GameCanvas.tsx` to textured rendering:
- Use `src/assets/images/dot.png`.
- Layer glare using `src/assets/images/dot_glare_top_left.png`.
- Preserve color tint behavior.
2. Bring start/kiosk screen closer to legacy:
- Show `src/assets/images/united_colors_top_down.png`.
- Maintain best score and start CTA behavior.
3. Keep overlay visibility/state transitions aligned with legacy flow.

## Phase F — Lifecycle and Platform Behavior
1. Add AppState-based pause/resume rules in `useGameViewModel` + orchestrator.
2. Add Android hardware back behavior:
- Running game -> return to kiosk (not app exit).
3. Keep keep-awake only when needed for kiosk/running session.

## Phase G — Persistence and Cleanup
1. Keep storage boundary at `LocalStorageRepository`.
2. Add schema version migration safety for settings/high score.
3. Remove or integrate unused `scoreStore` to avoid dead state.

## Phase H — Test Expansion
1. Domain tests:
- Collision outcomes (+1/+5/game-over).
- Point lifecycle behavior.
- Spawn progression/difficulty curve.
- Bounds enforcement.
2. Orchestrator tests:
- Event routing to audio.
- Pause/resume/back-to-kiosk transitions.
3. Sensor adapter tests:
- Calibration/dead-zone/smoothing transform.
4. Storage tests:
- Corrupted payload fallback.
- Version migration behavior.

## Phase I — Acceptance + Release Readiness
1. Execute parity QA checklist (`docs/parity-qa.md`).
2. Verify 60 FPS in release builds on modern Android and iOS devices.
3. Ensure CI passes (`pnpm preflight`, `pnpm test`).
4. Validate EAS build profiles for internal tracks.

## Deliverables
- Updated parity implementation in existing architecture.
- Expanded automated test coverage.
- Updated docs and parity checklist with true verification status.
