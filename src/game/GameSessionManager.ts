import * as PIXI from 'pixi.js';
import { DEFAULT_CONFIG, type RootGameConfig } from './Config';
import { GameEngine, type MatchSummary } from './GameEngine';

export interface CompletedMatch extends MatchSummary {
    matchId: string;
    completedAt: string;
    config: RootGameConfig;
}

export class GameSessionManager {
    private readonly engine: GameEngine;
    private readonly onMatchEnd: (match: CompletedMatch) => void;
    private readonly matchId = crypto.randomUUID();
    private readonly configSnapshot = structuredClone(DEFAULT_CONFIG);
    private isDisposed = false;

    constructor(
        terrainLayer: PIXI.Container,
        actorsLayer: PIXI.Container,
        projectilesLayer: PIXI.Container,
        onMatchEnd: (match: CompletedMatch) => void,
    ) {
        this.onMatchEnd = onMatchEnd;
        this.engine = new GameEngine(
            terrainLayer,
            actorsLayer,
            projectilesLayer,
            (summary) => this.handleMatchEnd(summary),
        );
    }

    public start(): void {
        if (!this.isDisposed) {
            this.engine.startMatch();
        }
    }

    public pause(): boolean {
        return !this.isDisposed && this.engine.pauseMatch();
    }

    public resume(): boolean {
        return !this.isDisposed && this.engine.resumeMatch();
    }

    public destroy(): void {
        if (this.isDisposed) return;

        this.isDisposed = true;
        this.engine.destroy();
    }

    private handleMatchEnd(summary: MatchSummary): void {
        if (this.isDisposed) return;

        this.onMatchEnd({
            ...summary,
            matchId: this.matchId,
            completedAt: new Date().toISOString(),
            config: this.configSnapshot,
        });
    }
}
