# Full Refactor Plan: Legacy Android Game -> Modern React Native (Expo 54) with Strict SoC

## Summary
Rebuild the app from scratch in the same repo using your locked stack:
- Expo `54`
- React Native `0.81`
- React `19.1.0`
- TypeScript `5.9.3`
- Node `24.13.1` (`.nvmrc`)
- pnpm `10.29.3` via Corepack
- Biome for linting + formatting

Execution order will follow your requirement exactly:
1. Wipe repository (keep `.git` only).
2. Install React Native LLM skill: `npx add-skill callstackincubator/agent-skills`.
3. Bootstrap and implement the new RN app.

## Locked Technical Baseline
1. Runtime/tooling:
- `.nvmrc` = `24.13.1`
- `package.json`:
  - `"engines": { "node": "24.13.1", "pnpm": "10.29.3" }`
  - `"packageManager": "pnpm@10.29.3"`
- Corepack enabled and pinned for pnpm use.
2. App stack:
- Expo SDK 54
- React Native 0.81
- React 19.1.0
- TypeScript 5.9.3
3. Code quality:
- Replace ESLint/Prettier with Biome only.
- Biome runs in CI and pre-commit hooks (format + lint checks).

## Migration Phases

### 1. Pre-Rebuild Snapshot (reference only)
1. Extract behavior and constants from `origin/master`:
- game states, spawn cadence, collision rules, score increments, kiosk mode, pause/resume behavior.
2. Inventory legacy assets to reuse:
- dot textures, glare textures, sounds, colors.

### 2. Repo Wipe and Skill Install (required order)
1. Remove all tracked content except `.git`.
2. Run: `npx add-skill callstackincubator/agent-skills`.
3. Confirm skill install before RN initialization (if install fails, stop and resolve before proceeding).

### 3. Project Bootstrap
1. Initialize Expo 54 TypeScript app in repo root.
2. Configure:
- portrait-only orientation
- pnpm workspace/setup (single app)
- Corepack/pnpm lock baseline
- Biome config (`biome.json`) and npm scripts:
  - `lint`, `lint:fix`, `format`, `format:check`, `check`
3. Add CI workflow:
- install with pnpm
- typecheck
- biome check
- unit tests

### 4. SoC Architecture Implementation
Use layered architecture with strict boundaries:

- `src/domain`: pure game logic (no React/Expo imports)
- `src/application`: orchestration/use-cases and app state coordination
- `src/infrastructure`: platform adapters (sensors, audio, storage, frame clock)
- `src/presentation`: React components, Skia rendering, overlays/UI

Target modules:
- Domain:
  - `GameRules`, `GameEngine`, `StateMachine`, `Collision`, `SpawnSystem`, entities (`Dot`, `PlayerDot`, `PointDot`)
- Infrastructure:
  - `DeviceMotionAdapter` (gyro-only input path)
  - `AudioService`
  - `AsyncStorageRepository`
  - `FixedStepClock`
- Presentation:
  - `GameCanvas` (Skia)
  - overlays for Start/Kiosk, Pause, Game Over
  - HUD (score)

### 5. Feature Parity Scope (v1)
1. Behavior parity first (no gameplay redesign).
2. Keep kiosk/attract mode on launch.
3. Gyro-only controls.
4. Persist:
- high score
- settings: sound, gyro sensitivity
5. No online leaderboard in v1.
6. Android + iOS day-one support.
7. New store identities (no legacy release continuity constraints).

### 6. Performance and Release Hardening
1. Fixed-step simulation and allocation-minimized render/update path.
2. Release acceptance target: 60 FPS on modern devices.
3. EAS Build pipeline for TestFlight and Play internal testing tracks.

## Public Interfaces / Contracts
Core contracts to freeze early:

```ts
type GamePhase = "KIOSK" | "RUNNING" | "PAUSED" | "GAME_OVER";

interface GameSettings {
  soundEnabled: boolean;
  gyroSensitivity: number;
}

interface SensorSample {
  x: number;
  y: number;
  timestampMs: number;
}

interface DotView {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  kind: "player" | "small" | "point";
}

interface RenderFrame {
  phase: GamePhase;
  score: number;
  dots: DotView[];
}
```

## Test Cases and Scenarios (Unit-focused)
1. State transitions:
- kiosk -> running -> paused -> running -> game_over -> kiosk
2. Collision outcomes:
- matching color small dot = +1
- point dot = +5 and player color switch
- mismatched color = game over
3. Spawn/difficulty progression:
- spawn interval decreases with timestep progression
4. Point-dot lifecycle:
- spawn, pulse, timeout/fade removal
5. Player bounds:
- cannot move outside screen limits
6. Persistence:
- settings/high-score save-load integrity

## Explicit Assumptions and Defaults
1. Use only the pinned versions you specified, even if newer versions exist.
2. Biome is the sole formatter/linter.
3. Skill install command is mandatory and occurs after wipe, before Expo bootstrap.
4. Legacy code remains accessible only via `origin/master` reference during rebuild.
5. No in-place migration of old Android project files; this is a clean greenfield implementation.
