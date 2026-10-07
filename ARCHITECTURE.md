# Architecture

This document describes the current implementation of Pirate Battle and distinguishes shipped behavior from challenge requirements that remain open. See [README-CHALLENGE.md](./README-CHALLENGE.md) for the complete brief and [README.md](./README.md) for setup and the implementation status summary.

## System overview

The application uses React for menus, overlays, and controls, and PixiJS for the real-time game scene. The React tree is mounted under `StrictMode`. During gameplay, `GameScreen` creates and owns the PixiJS application, its scene layers, and a `GameSessionManager`.

| Module | Responsibility |
| --- | --- |
| `src/game/GameScreen.tsx` | Loads assets, initializes PixiJS, builds scene layers, scales the arena, connects game callbacks to React state, and tears down the session and application. |
| `src/game/GameSessionManager.ts` | Owns the engine session, exposes player actions, and enriches a match summary with an ID, completion timestamp, and configuration snapshot. |
| `src/game/GameEngine.ts` | Orchestrates the match ticker, session time, score, manager calls, pause/resume, and match completion. |
| `src/game/PhysicsManager.ts` | Updates player/enemy movement, AI actions, collisions, projectile damage, and score gained from defeated enemies. |
| `src/game/SpawnManager.ts` | Creates the player and enemies, chooses spawn locations, and connects player weapon events to projectiles. |
| `src/game/TerrainManager.ts` | Selects and renders islands and maintains tile grids used for land and shallow-water checks. |
| `src/game/actors/ShipBase.ts` | Provides shared ship movement, health, health-bar rendering, damage effects, and collision response. |
| `src/components/menu/` and `src/components/ui/` | Render the main menu, options, HUD, buttons, and modal panels. |

## React and PixiJS lifecycle

`GameScreen` preloads game assets before starting combat and displays loading progress. It then initializes a PixiJS `Application` with automatic resize and device-pixel-ratio handling. The logical 1920×1152 arena is placed inside a scaled container; water fills the margins outside the centered arena.

Scene content is separated into water, terrain, actors, projectiles, and effects containers. `GameSessionManager` creates the engine and translates callbacks into typed React state updates for player health, score, remaining time, and match completion. These callbacks are emitted at match start and when the corresponding value changes, rather than on every render frame.

On unmount, `GameScreen` marks asynchronous initialization as cancelled, destroys the game session, and destroys the initialized PixiJS application. Asset loading failures are logged and displayed through an error panel. The root uses `StrictMode`; however, dedicated lifecycle tests under Strict Mode have not been added.

## Simulation and match flow

`GameEngine` owns a `PIXI.Ticker`. Each active tick reads `ticker.deltaMS`, advances elapsed match time, reports the rounded-up seconds remaining, checks the configured timeout, and calls `PhysicsManager.update`. Score is incremented from `PhysicsResult.scoreGained`; each enemy defeated by a player projectile contributes one point. The match stops once on player defeat, timeout, or the HUD close action. The existing result modal displays the score and elapsed duration.

Manual pause stops the ticker and disables player input; resume restarts the same session. Chaser explosion animation playback is also paused and resumed. The `P` key and HUD pause button use this flow.

### Current timing limitation

Although the ticker provides elapsed time and cooldowns/timers use milliseconds, ship translation, rotation, acceleration, and friction in `ShipBase.update()` are currently applied per update call. They are therefore frame-rate dependent and do **not** yet meet the challenge requirement for fully time-based movement. A fixed-step or delta-scaled simulation should be implemented and verified before claiming frame-rate independence.

Automatic pause on browser blur or page visibility changes is not implemented.

## Gameplay systems

### Configuration

`src/game/Config.ts` defines typed configuration interfaces and the in-memory `DEFAULT_CONFIG`. The Options screen edits session duration between 60 and 180 seconds in 10-second steps, and enemy spawn interval between 1 and 10 seconds in 1-second steps. Saving updates `DEFAULT_CONFIG` for the current page session.

Settings are not persisted across refreshes. The engine captures session duration when it is created, but other systems currently read values directly from `DEFAULT_CONFIG`; a complete immutable per-match configuration snapshot is not yet passed through all gameplay systems.

### Terrain and collisions

`TerrainManager` randomly selects one to three island sectors, asks each island model to build its visuals, and merges its land/shallow-water grids into arena-level boolean grids. `checkCollision` maps a world position to a tile and reports out-of-bounds, land, and shallow-water status. Ships that enter land or leave the arena are moved back to their prior position and receive a bounce response. When a ship enters shallow water, `ShipBase` applies stronger friction, reducing its speed and making navigation through those areas more deliberate.

Shallow-water slowdown is an intentional gameplay and product-design choice beyond the challenge requirements. It gives terrain a navigational consequence and creates an additional movement trade-off for the player.

Actor-to-actor and projectile-to-actor hits use distance thresholds, not AABB collision detection. Projectile collision against islands uses the same tile lookup as ships. The arena and island selection are random and are not currently seedable for reproducible runs.

### Spawning and enemy behavior

`SpawnManager` places the player in a sector not selected for an island. Enemy spawn attempts check for land and require a minimum distance from the player; after a bounded number of unsuccessful attempts, no enemy is spawned for that interval. The configured distribution selects between Chaser and Shooter enemies.

Chasers steer toward the player and explode on impact, damaging the player. Shooters approach until within their attack range, then fire when aligned. Enemy steering and collision behavior are intentionally simple and have not been tuned through documented profiling.

### Damage, projectiles, and score

Player and enemy projectiles are updated and checked against terrain and opposing ships by `PhysicsManager`. A projectile that hits a target or obstacle explodes; expired projectiles are removed. Defeated enemies are removed from the simulation. Player-fired kills add one point, while Chaser impact does not award score.

`ShipBase` clamps health to zero, updates the ship health bar, and adds fire overlays as health falls. Player death disables the player and switches the hull to a wreck sprite. Health bars above the ships are rendered in PixiJS; the React HUD mirrors the player's health percentage.

## Input and interface

`PlayerShip` listens for keyboard events while its instance exists. WASD controls movement; arrow keys fire forward or to either side. The HUD exposes touch controls for movement and firing, plus pause and close actions. The HUD close action ends the active match with the `player-closed` reason and opens the result modal; it does not navigate directly to the main menu.

The application currently requires landscape orientation on mobile and requests fullscreen before entering the main menu. Keyboard menu accessibility, focus management, semantic announcements for game status, and accessibility verification are not complete.

## Assets and resource management

`AssetManager` loads UI and tile spritesheets through PixiJS and extracts named ship textures from spritesheet XML metadata. It chooses default or retina assets based on device pixel ratio and a best-effort network connection hint. Missing textures and invalid metadata throw explicit errors; the loading screen handles initialization failures.

Player keyboard listeners are removed when the player is destroyed. The ticker is stopped on pause and match end, and destroyed with the engine. The PixiJS application is destroyed on `GameScreen` unmount. Resource cleanup has not yet been verified with repeated-run memory profiling.

## Match results, persistence, and networking

`MatchSummary` contains the end reason, score, and elapsed duration. `GameSessionManager` adds a match UUID, completion timestamp, and a copy of `DEFAULT_CONFIG`, then passes the typed `CompletedMatch` to React. The result modal currently presents score and duration.

This is an in-memory handoff only. The last result and options are not persisted. A manually closed match currently produces a result with reason `player-closed`; the challenge's desired abandonment and persistence behavior still needs to be reconciled with this flow.

Axios, TanStack Query, and MSW are listed in the dependency manifest, but the application does not yet implement ranking/history API contracts, queries or mutations, handlers, fixtures, selectable failure scenarios, pending-write recovery, or local persistence. Ranking and Match History remain placeholders. API behavior, cache policy, retries, and recovery therefore cannot yet be documented as implemented.

## Testing, build, and performance evidence

There are currently no project Playwright E2E tests, visual-regression baselines, HTML test report, or performance profile in the repository. The required gameplay, responsive, network recovery, and resource-lifecycle flows have not been validated by automated tests.

The production bundler has been run independently, but `npm run build` currently fails at TypeScript compilation with `TS1294` in `PhysicsManager.ts` and `SpawnManager.ts` under the project's `erasableSyntaxOnly` setting. This must be fixed and the full build rerun. No measured FPS, p95 frame time, three-minute entity count, or five-cycle memory results are available; 60 FPS remains a target, not a verified result.

## Challenge completion snapshot

| Requirement area | Current state |
| --- | --- |
| Core combat, player/enemy ships, terrain, HUD, score, and result modal | Partially implemented; see the timing and collision limitations above. |
| Options and match configuration | Controls work in memory; persistence and full per-match configuration isolation remain. |
| PixiJS lifecycle and asset loading | Core initialization, progress, error handling, and teardown are implemented; lifecycle regression testing remains. |
| Automatic pause, full accessibility, and complete result details | Not complete. |
| Ranking/history, Axios + TanStack Query, MSW, and local recovery | Not implemented. |
| Playwright E2E and visual regression | Not implemented. |
| Performance profiling and public deployment | No evidence or deployment URL is currently recorded. |

Update this document as these items are implemented; do not treat dependencies in `package.json` or a successful bundler-only run as evidence that a challenge requirement is complete.
