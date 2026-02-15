# Parity QA Script

Use this script for manual parity validation against legacy behavior.

## Setup
1. Use required runtime/tooling versions.
2. Install deps: `pnpm install`.
3. Start app: `pnpm start`.
4. Run on physical device (gyro checks are not reliable on many simulators).

## Session A — Game Flow
1. Launch app.
Expected:
- Starts in kiosk mode.
- Ambient dots animate in background.
- Start overlay visible.
2. Press Start.
Expected:
- Running state begins.
- HUD score resets to `0`.
3. Pause and resume.
Expected:
- Simulation pauses; resume continues same session.
4. Trigger game over (hit wrong color).
Expected:
- Game over overlay appears.
- Score is frozen.
5. Press Back from pause/game-over.
Expected:
- Returns to kiosk mode.

## Session B — Gameplay Rules
1. Consume same-color small dot.
Expected: score +1.
2. Consume point dot.
Expected:
- score +5
- player color changes
- point removed
3. Consume wrong-color small dot.
Expected: immediate game over.

## Session C — Input and Bounds
1. Tilt aggressively in each direction.
Expected:
- Player stays inside screen bounds.
- Motion is stable and not excessively jittery.

## Session D — Audio
1. Spawn point dot.
Expected: jump sound.
2. Consume any dot.
Expected: blop sound.
3. Toggle sound off.
Expected: no sound playback.

## Session E — Persistence
1. Finish session with new high score.
2. Restart app.
Expected:
- High score persists.
- Sound toggle persists.
- Gyro sensitivity persists.

## Session F — Lifecycle/Platform
1. Put app in background during running session.
Expected: session pauses safely.
2. Return foreground.
Expected: resumes with correct state behavior.
3. Android hardware Back during running session.
Expected: returns to kiosk, not abrupt app exit.

## Pass Criteria
- All expected results pass without critical gameplay regressions.
- `pnpm typecheck`, `pnpm lint`, and `pnpm test` all pass.
