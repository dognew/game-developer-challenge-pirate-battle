import * as PIXI from 'pixi.js';
import { DEFAULT_CONFIG } from './Config';
import { PlayerShip } from './actors/PlayerShip';
import { Projectile } from './actors/Projectile';
import { ChaserEnemy } from './actors/ChaserEnemy';
import { ShooterEnemy } from './actors/ShooterEnemy';
import { TerrainManager } from './TerrainManager';
import { SpawnManager } from './SpawnManager';
import { PhysicsManager } from './PhysicsManager';

export type MatchEndReason = 'player-defeated' | 'time-expired' | 'player-closed';

export interface MatchSummary {
    reason: MatchEndReason;
    score: number;
    durationMs: number;
}

/**
 * Core Game Engine Orchestrator
 * Delegates procedural generation, physics, and entity lifecycle to domain managers.
 */
export class GameEngine {
    private terrainLayer: PIXI.Container;
    private ticker: PIXI.Ticker;

    private terrainManager: TerrainManager;
    private spawnManager: SpawnManager;
    private physicsManager: PhysicsManager;

    private player!: PlayerShip;
    private projectiles: Projectile[] = [];
    private enemies: (ChaserEnemy | ShooterEnemy)[] = [];

    private timeSinceLastSpawn: number = 0;
    private matchTimeMs: number = 0;
    private score = 0;
    private matchEnded = false;
    private matchStarted = false;
    private matchPaused = false;
    private readonly onMatchEnd: (summary: MatchSummary) => void;
    private readonly onPlayerHealthChange: (health: number) => void;
    private readonly onTimeRemainingChange: (timeRemaining: number) => void;
    private readonly onScoreChange: (score: number) => void;
    private readonly sessionDurationMs: number;
    private lastReportedPlayerHealth: number | null = null;
    private lastReportedTimeRemaining: number | null = null;
    private lastReportedScore: number | null = null;

    constructor(
        terrainLayer: PIXI.Container,
        actorsLayer: PIXI.Container,
        projectilesLayer: PIXI.Container,
        onMatchEnd: (summary: MatchSummary) => void,
        onPlayerHealthChange: (health: number) => void,
        onTimeRemainingChange: (timeRemaining: number) => void,
        onScoreChange: (score: number) => void,
    ) {
        this.onMatchEnd = onMatchEnd;
        this.onPlayerHealthChange = onPlayerHealthChange;
        this.onTimeRemainingChange = onTimeRemainingChange;
        this.onScoreChange = onScoreChange;
        this.sessionDurationMs = DEFAULT_CONFIG.match.sessionTimeMs;
        this.terrainLayer = terrainLayer;
        this.ticker = new PIXI.Ticker();

        this.terrainManager = new TerrainManager();
        this.spawnManager = new SpawnManager(
            this.terrainManager,
            actorsLayer,
            projectilesLayer,
            this.projectiles,
            this.enemies
        );
        this.physicsManager = new PhysicsManager(
            this.terrainManager,
            projectilesLayer,
            this.projectiles,
            this.enemies
        );
    }

    public startMatch(): void {
        if (this.matchEnded || this.matchStarted) return;

        this.matchStarted = true;
        const occupiedSectors = this.terrainManager.generateArena(this.terrainLayer);
        this.player = this.spawnManager.spawnPlayer(occupiedSectors);
        this.reportPlayerHealth();
        this.reportTimeRemaining();
        this.reportScore();

        this.ticker.add(() => this.gameLoop());
        this.ticker.start();
    }

    public pauseMatch(): boolean {
        if (!this.matchStarted || this.matchEnded || this.matchPaused) return false;

        this.matchPaused = true;
        this.ticker.stop();
        this.player.setInputEnabled(false);
        this.enemies.forEach((enemy) => {
            if (enemy instanceof ChaserEnemy) enemy.pauseExplosion();
        });
        return true;
    }

    public resumeMatch(): boolean {
        if (!this.matchStarted || this.matchEnded || !this.matchPaused) return false;

        this.matchPaused = false;
        this.player.setInputEnabled(true);
        this.enemies.forEach((enemy) => {
            if (enemy instanceof ChaserEnemy) enemy.resumeExplosion();
        });
        this.ticker.start();
        return true;
    }

    public endMatch(): void {
        if (!this.matchStarted || this.matchEnded) return;

        this.finishMatch('player-closed');
    }

    private gameLoop(): void {
        if (this.matchEnded) return;

        const deltaMs = this.ticker.deltaMS;
        this.matchTimeMs = Math.min(
            this.matchTimeMs + deltaMs,
            this.sessionDurationMs,
        );
        this.reportTimeRemaining();

        if (this.matchTimeMs >= this.sessionDurationMs) {
            this.finishMatch('time-expired');
            return;
        }

        this.timeSinceLastSpawn += deltaMs;

        if (this.timeSinceLastSpawn >= DEFAULT_CONFIG.match.spawnIntervalMs) {
            this.spawnManager.spawnEnemy(this.player.x, this.player.y);
            this.timeSinceLastSpawn = 0;
        }

        const physicsResult = this.physicsManager.update(deltaMs, this.matchTimeMs, this.player);
        this.score += physicsResult.scoreGained;
        this.reportPlayerHealth();
        this.reportScore();

        if (physicsResult.playerDefeated) {
            this.finishMatch('player-defeated');
        }
    }

    private reportPlayerHealth(): void {
        const health = this.player.healthPercentage;
        if (health === this.lastReportedPlayerHealth) return;

        this.lastReportedPlayerHealth = health;
        this.onPlayerHealthChange(health);
    }

    private reportTimeRemaining(): void {
        const timeRemaining = Math.ceil(
            Math.max(0, this.sessionDurationMs - this.matchTimeMs) / 1000,
        );
        if (timeRemaining === this.lastReportedTimeRemaining) return;

        this.lastReportedTimeRemaining = timeRemaining;
        this.onTimeRemainingChange(timeRemaining);
    }

    private reportScore(): void {
        if (this.score === this.lastReportedScore) return;

        this.lastReportedScore = this.score;
        this.onScoreChange(this.score);
    }

    private finishMatch(reason: MatchEndReason): void {
        if (this.matchEnded) return;

        this.matchEnded = true;
        this.ticker.stop();
        this.player.setInputEnabled(false);
        this.onMatchEnd({
            reason,
            score: this.score,
            durationMs: this.matchTimeMs,
        });
    }

    public destroy(): void {
        this.ticker.stop();
        this.ticker.destroy();
        if (this.player) {
            this.player.parent?.removeChild(this.player);
            this.player.destroy({ children: true });
        }
        this.enemies.forEach(enemy => {
            enemy.parent?.removeChild(enemy);
            enemy.destroy({ children: true });
        });
    }

    public getPlayer(): PlayerShip | undefined {
        return this.player;
    }
}