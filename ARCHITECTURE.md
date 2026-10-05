# Architecture Documentation

## React & PixiJS Integration
[TODO: Explain the isolation of React state from the PixiJS Ticker, detailing how the GameEngine class bridges the canvas element without causing React re-renders.]

## Simulation Cycle & Game Loop
[TODO: Describe how delta time is calculated and how entities are updated to maintain a stable 60 FPS target independent of frame rate fluctuations.]

## Collisions System
[TODO: Detail the AABB collision detection for entities and spatial grid checking for the island tiles.]

## Resource Management
[TODO: Explain the asset pre-loading strategy and how resources and memory are cleaned up upon game over or unmounting to prevent memory leaks.]

## Local Persistence & Network (Ranking & History)
[TODO: Document the MSW and TanStack Query integration. Detail caching strategies, API contracts, and how pending match records are recovered, persisted locally, and retried.]

## Test Reports & Profiling
* **E2E & Visual Regression:** [TODO: Link to HTML report or describe test coverage limits.]
* **Performance Profiling:** [TODO: Record frame rate stability, 95th percentile frame times, and entity counts during a 3-minute match.]

## Balancing & Limitations
[TODO: Record specific technical decisions, such as simplified enemy steering behaviors, UI scaling constraints on mobile, and performance trade-offs.]