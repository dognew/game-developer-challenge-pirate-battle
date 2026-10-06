# Architecture Documentation

## React & PixiJS Integration
`GameSessionManager` owns the PixiJS `GameEngine` lifecycle and translates its terminal event into one typed `CompletedMatch` callback for React. The engine remains isolated from React rendering; React only updates when the match ends and displays the Game Over modal. Restarting creates a fresh keyed `GameScreen` and therefore a fresh session.

## Simulation Cycle & Game Loop
[TODO: Describe how delta time is calculated and how entities are updated to maintain a stable 60 FPS target independent of frame rate fluctuations.]

## Collisions System
[TODO: Detail the AABB collision detection for entities and spatial grid checking for the island tiles.]

## Resource Management
Assets are preloaded before the PixiJS application starts. On player defeat or session timeout, `GameEngine` stops its ticker before notifying the session manager, preventing further spawning, movement, attacks, and damage. The scene remains frozen behind the result modal until restart or return to the menu; unmounting destroys the engine and PixiJS application.

## Local Persistence & Network (Ranking & History)
[TODO: Document the MSW and TanStack Query integration. Detail caching strategies, API contracts, and how pending match records are recovered, persisted locally, and retried.]

## Test Reports & Profiling
* **E2E & Visual Regression:** [TODO: Link to HTML report or describe test coverage limits.]
* **Performance Profiling:** [TODO: Record frame rate stability, 95th percentile frame times, and entity counts during a 3-minute match.]

## Balancing & Limitations
[TODO: Record specific technical decisions, such as simplified enemy steering behaviors, UI scaling constraints on mobile, and performance trade-offs.]
* **Single Source of Truth:** Game balancing (speeds, health, damage, spawn times) is strictly centralized in the `Config.ts` file via the `DEFAULT_CONFIG` object.
* **Frame-Rate Independence:** All numeric parameters for movement and time are modeled in milliseconds and pixels/radians per second, ensuring the game engine (PixiJS) calculates physics based on *Delta Time* (actual elapsed time) rather than the user machine's frame rate (FPS).
* **Typing:** Strict interfaces (`RootGameConfig`, `ShipConfig`, etc.) ensure that the React Options screen and the PixiJS Engine share the exact same data structure, preventing configuration injection runtime errors.
* **Ship Damage Visuals:** The ship atlas has no alternate damaged hull frames. Damage is applied through `ShipBase.takeDamage()`, which updates health and adds one, two, then three fire overlays at 75%, 50%, and 25% remaining health; the hull tint also darkens at the lower thresholds.
* **Player Death:** At zero health, the player enters an irreversible dead state, stops accepting input and simulation updates, hides weapons and damage effects, and switches to the `ship_19.png` wreck frame.
* **Match Completion:** A match ends once, on player defeat or configured duration expiry. `GameSessionManager` adds a match ID, completion timestamp, and configuration snapshot to the score, effective duration, and end reason. This is the typed handoff point for future ranking/history persistence; no network request is made by the combat loop.