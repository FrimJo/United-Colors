# Legacy Parity Checklist (origin/master)

Use this checklist while validating gameplay behavior in the React Native rebuild.

## Game States
- [x] Kiosk mode on app launch
- [x] Running mode after Start
- [x] Pause mode
- [x] Game over mode on wrong-color collision
- [x] Back to kiosk from game over/pause

## Gameplay Rules
- [x] Small dot speed ratio = `0.02 * density`
- [x] Small dot size ratio = `0.0625 * density`
- [x] Point dot size ratio = `0.125 * density`
- [x] Point dot value = `5`
- [x] Dot cap = `200`
- [x] Color set = `#E91E63`, `#2196F3`, `#8BC34A`

## Spawn and Difficulty
- [x] Small dots spawn at interval based on time progression
- [x] Difficulty increases by reducing spawn wait over time
- [x] Kiosk mode keeps ambient dot count constrained
- [x] Point dot appears with random interval window
- [x] Point dot times out and is removed

## Collision and Scoring
- [x] Player + same-color small dot => score +1
- [x] Player + point dot => score +5 and player color switches
- [x] Player + wrong-color small dot => game over

## Player and Movement
- [x] Gyro/device motion input controls player
- [x] Player bounded to viewport
- [x] Portrait-only play

## Persistence (v1)
- [x] High score persists across restarts
- [x] Sound toggle persists
- [x] Gyro sensitivity persists

## Out of Scope in v1
- [ ] Online leaderboard sync (intentionally excluded)
