# Pirate Battle

**[Live Demo](URL_HERE)**

A browser-based 2D naval combat simulation built with React and PixiJS. This project was developed as a technical challenge. For the full requirements of challenge, please see [README-CHALLENGE.md](README-CHALLENGE.md).

For detailed technical decisions, simulation cycle mechanics, and API integration contracts, please refer to the [Architecture Documentation](ARCHITECTURE.md).

## Technical Overview
* **Custom Physics & Collisions:** AABB collision detection and entity movement calculated independently using fixed delta time.
* **State Decoupling:** React UI components overlay the game canvas without triggering render cycles during the PixiJS game loop.
* **Network Resilience:** Mocked REST APIs using MSW. TanStack Query handles caching and retries, while a local storage queue manages pending state recovery for history and rankings.
* **Automated Testing:** E2E workflows and visual regression testing (with versioned baselines) implemented via Playwright.

## Controls
* [TODO: Document keyboard and touch controls for movement, rotation, and firing.]

## Gameplay Configuration
* [TODO: Explain how to adjust match duration and spawn rates via the Options menu.]

## Network Scenarios, Mocking & Reset
* [TODO: Document how to select network conditions (500 errors, timeouts, empty states) via the MSW control panel, and how to reset the scenarios to the initial state.]

## Reproducing Failures
* [TODO: Provide step-by-step instructions to reproduce API failure recovery and timeout handling during gameplay.]

## Setup & Commands

### Prerequisites
- Node.js (v20+)

### Installation
```bash
npm ci

```

### Environment Variables

None required for standard execution. Copy `.env.example` to `.env` if local port overrides are needed.

### Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server with MSW enabled. |
| `npm run build` | Builds the application for production. |
| `npm run preview` | Locally previews the production build. |
| `npm run lint` | Runs ESLint for code quality. |
| `npm run type-check` | Runs TypeScript compiler check (`tsc --noEmit`). |
| `npx playwright test` | Runs E2E workflows and visual regression tests. |
