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
        onPlayerHealthChange: (health: number) => void,
        onTimeRemainingChange: (timeRemaining: number) => void,
        onScoreChange: (score: number) => void,
    ) {
        this.onMatchEnd = onMatchEnd;
        this.engine = new GameEngine(
            terrainLayer,
            actorsLayer,
            projectilesLayer,
            (summary) => this.handleMatchEnd(summary),
            onPlayerHealthChange,
            onTimeRemainingChange,
            onScoreChange,
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

    public endMatch(): void {
        if (!this.isDisposed) {
            this.engine.endMatch();
        }
    }

    public fireFront(): void { this.engine.getPlayer()?.fireFront(); }
    public fireLeft(): void { this.engine.getPlayer()?.fireLeft(); }
    public fireRight(): void { this.engine.getPlayer()?.fireRight(); }
    
    public setPlayerInput(action: string, isPressed: boolean): void {
        this.engine.getPlayer()?.setInput(action, isPressed);
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
