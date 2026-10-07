import * as PIXI from 'pixi.js';
import { TILE_SIZE, ARENA_WIDTH, ARENA_HEIGHT, DEFAULT_CONFIG } from './Config';
import { AvailableIslands } from './terrain/islands';
import { PlayerShip } from './actors/PlayerShip';
import { Projectile } from './actors/Projectile';
import { ChaserEnemy } from './actors/ChaserEnemy';
import { ShooterEnemy } from './actors/ShooterEnemy';

export type MatchEndReason = 'player-defeated' | 'time-expired';

export interface MatchSummary {
    reason: MatchEndReason;
    score: number;
    durationMs: number;
}

/**
 * Core Game Engine
 * Manages procedural generation, physics, game loop, and entity lifecycle.
 */
export class GameEngine {
    private _actorsLayer: PIXI.Container;
    private terrainLayer: PIXI.Container;
    private projectilesLayer: PIXI.Container;

    private player!: PlayerShip;
    private projectiles: Projectile[] = [];
    private enemies: (ChaserEnemy | ShooterEnemy)[] = [];
    private ticker: PIXI.Ticker;

    private landGrid: boolean[][] = [];
    private shallowWaterGrid: boolean[][] = [];

    private timeSinceLastSpawn: number = 0;
    private matchTimeMs: number = 0;
    private score = 0;
    private matchEnded = false;
    private matchStarted = false;
    private matchPaused = false;
    private readonly onMatchEnd: (summary: MatchSummary) => void;

    constructor(
        terrainLayer: PIXI.Container,
        actorsLayer: PIXI.Container,
        projectilesLayer: PIXI.Container,
        onMatchEnd: (summary: MatchSummary) => void,
    ) {
        this.onMatchEnd = onMatchEnd;
        this.terrainLayer = terrainLayer;
        this._actorsLayer = actorsLayer;
        this.projectilesLayer = projectilesLayer;

        this.ticker = new PIXI.Ticker();
        
        const rows = Math.floor(ARENA_HEIGHT / TILE_SIZE);
        const cols = Math.floor(ARENA_WIDTH / TILE_SIZE);
        this.landGrid = Array.from({ length: rows }, () => Array(cols).fill(false));
        this.shallowWaterGrid = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    public startMatch(): void {
        if (this.matchEnded || this.matchStarted) return;

        this.matchStarted = true;
        const occupiedSectors = this.generateArena();
        this.spawnPlayer(occupiedSectors);

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

    private generateArena(): number[] {
        const sectorColumns = 3;
        const sectorWidth = 10 * TILE_SIZE;
        const sectorHeight = 6 * TILE_SIZE;
        const numIslandsToSpawn = Math.floor(Math.random() * 3) + 1;

        const availableSectors = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const chosenSectors = availableSectors.sort(() => 0.5 - Math.random()).slice(0, numIslandsToSpawn);

        for (const sectorIndex of chosenSectors) {
            const col = sectorIndex % sectorColumns;
            const row = Math.floor(sectorIndex / sectorColumns);

            const RandomIslandClass = AvailableIslands[Math.floor(Math.random() * AvailableIslands.length)];
            const island = new RandomIslandClass();
            
            island.buildVisuals();
            island.x = col * sectorWidth;
            island.y = row * sectorHeight;

            const localSandGrid = island.getSandGrid();
            const localWaterGrid = island.getShallowWaterGrid();

            for (let r = 0; r < localSandGrid.length; r++) {
                for (let c = 0; c < localSandGrid[r].length; c++) {
                    const globalRow = (row * 6) + r;
                    const globalCol = (col * 10) + c;

                    if (localSandGrid[r][c] !== '') this.landGrid[globalRow][globalCol] = true;
                    if (localWaterGrid[r][c] !== '') this.shallowWaterGrid[globalRow][globalCol] = true;
                }
            }

            this.terrainLayer.addChild(island);
        }

        return chosenSectors;
    }

    private spawnPlayer(occupiedSectors: number[]): void {
        this.player = new PlayerShip();
        
        // Listen to player firing events
        this.player.onFire = (projectilesData) => {
            projectilesData.forEach(data => {
                const config = data.isFront ? DEFAULT_CONFIG.player.frontWeapon.projectile : DEFAULT_CONFIG.player.sideWeapon.projectile;
                const proj = new Projectile(data.x, data.y, data.heading, config, 'player'); // Added 'player' owner
                this.projectilesLayer.addChild(proj);
                this.projectiles.push(proj);
            });
        };
        
        const allSectors = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const freeSectors = allSectors.filter(sector => !occupiedSectors.includes(sector));
        const spawnSector = freeSectors[Math.floor(Math.random() * freeSectors.length)];
        
        const sectorColumns = 3;
        const sectorWidth = 10 * TILE_SIZE;
        const sectorHeight = 6 * TILE_SIZE;
        
        const col = spawnSector % sectorColumns;
        const row = Math.floor(spawnSector / sectorColumns);
        
        this.player.x = (col * sectorWidth) + (sectorWidth / 2);
        this.player.y = (row * sectorHeight) + (sectorHeight / 2);
        
        this._actorsLayer.addChild(this.player);
    }

    /**
     * Attempts to spawn an enemy in a valid, clear location far from the player.
     */
    private spawnEnemy(): void {
        let spawnX = 0;
        let spawnY = 0;
        let validSpawn = false;
        let attempts = 0;
        const MIN_SPAWN_DISTANCE = 600;

        // Try up to 20 times to find a random valid spot
        while (!validSpawn && attempts < 20) {
            attempts++;
            spawnX = Math.random() * ARENA_WIDTH;
            spawnY = Math.random() * ARENA_HEIGHT;

            const gridX = Math.floor(spawnX / TILE_SIZE);
            const gridY = Math.floor(spawnY / TILE_SIZE);

            // Boundary check
            if (gridX < 0 || gridX >= this.landGrid[0].length || gridY < 0 || gridY >= this.landGrid.length) continue;

            // Terrain check
            if (this.landGrid[gridY][gridX]) continue;

            // Distance from player check
            const distToPlayer = Math.hypot(spawnX - this.player.x, spawnY - this.player.y);
            if (distToPlayer < MIN_SPAWN_DISTANCE) continue;

            validSpawn = true;
        }

        if (!validSpawn) return; // Skip spawning this cycle if no valid spot found

        const rand = Math.random();
        let enemy: ChaserEnemy | ShooterEnemy;
        
        if (rand < DEFAULT_CONFIG.match.spawnDistribution.chaser) {
            enemy = new ChaserEnemy();
        } else {
            enemy = new ShooterEnemy();
        }

        enemy.x = spawnX;
        enemy.y = spawnY;
        this._actorsLayer.addChild(enemy);
        this.enemies.push(enemy);
    }

    private gameLoop(): void {
        if (this.matchEnded) return;

        const deltaMs = this.ticker.deltaMS;
        this.matchTimeMs = Math.min(
            this.matchTimeMs + deltaMs,
            DEFAULT_CONFIG.match.sessionTimeMs,
        );

        if (this.matchTimeMs >= DEFAULT_CONFIG.match.sessionTimeMs) {
            this.finishMatch('time-expired');
            return;
        }

        this.timeSinceLastSpawn += deltaMs;

        // 1. Spawner Logic
        if (this.timeSinceLastSpawn >= DEFAULT_CONFIG.match.spawnIntervalMs) {
            this.spawnEnemy();
            this.timeSinceLastSpawn = 0;
        }

        // 2. Player Logic
        const prevPlayerX = this.player.x;
        const prevPlayerY = this.player.y;

        this.player.update(deltaMs);
        
        let playerCollided = false;
        let playerInShallowWater = false;

        if (this.player.x < 0 || this.player.x > ARENA_WIDTH || this.player.y < 0 || this.player.y > ARENA_HEIGHT) {
            playerCollided = true;
        } else {
            const gridX = Math.floor(this.player.x / TILE_SIZE);
            const gridY = Math.floor(this.player.y / TILE_SIZE);
            
            if (gridY >= 0 && gridY < this.landGrid.length && gridX >= 0 && gridX < this.landGrid[0].length) {
                if (this.landGrid[gridY][gridX]) playerCollided = true;
                else if (this.shallowWaterGrid[gridY][gridX]) playerInShallowWater = true;
            }
        }

        this.player.setInShallowWater(playerInShallowWater);
        if (playerCollided) {
            this.player.x = prevPlayerX;
            this.player.y = prevPlayerY;
            this.player.crash();
        }

        // 3. Enemies Logic
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.isDestroyed) {
                enemy.parent?.removeChild(enemy);
                enemy.destroy({ children: true });
                this.enemies.splice(i, 1);
                continue;
            }

            if (enemy instanceof ChaserEnemy && enemy.isExploding) continue;

            const prevX = enemy.x;
            const prevY = enemy.y;

            // AI Decision Making
            if (enemy instanceof ChaserEnemy) {
                enemy.chaseTarget(this.player.x, this.player.y);
            } else if (enemy instanceof ShooterEnemy) {
                const isShooting = enemy.updateAI(this.player.x, this.player.y, this.matchTimeMs);
                if (isShooting) {
                    const config = DEFAULT_CONFIG.enemies.shooter.weapon.projectile;
                    
                    // Spawn projectile at the tip of the front cannon
                    const spawnX = enemy.x + Math.cos(enemy.rotation) * enemy.frontCannon.x - Math.sin(enemy.rotation) * enemy.frontCannon.y;
                    const spawnY = enemy.y + Math.sin(enemy.rotation) * enemy.frontCannon.x + Math.cos(enemy.rotation) * enemy.frontCannon.y;
                    
                    const proj = new Projectile(spawnX, spawnY, enemy.rotation + Math.PI / 2, config, 'enemy'); // Added 'enemy' owner
                    this.projectilesLayer.addChild(proj);
                    this.projectiles.push(proj);
                }
            }

            enemy.update(deltaMs);

            // Bounds and terrain collision for enemies
            let collided = false;
            let inShallowWater = false;

            if (enemy.x < 0 || enemy.x > ARENA_WIDTH || enemy.y < 0 || enemy.y > ARENA_HEIGHT) {
                collided = true;
            } else {
                const gridX = Math.floor(enemy.x / TILE_SIZE);
                const gridY = Math.floor(enemy.y / TILE_SIZE);
                
                if (gridY >= 0 && gridY < this.landGrid.length && gridX >= 0 && gridX < this.landGrid[0].length) {
                    if (this.landGrid[gridY][gridX]) collided = true;
                    else if (this.shallowWaterGrid[gridY][gridX]) inShallowWater = true;
                }
            }

            enemy.setInShallowWater(inShallowWater);
            if (collided) {
                enemy.x = prevX;
                enemy.y = prevY;
                enemy.crash();
            }
            
            // Check impact collision with player (Chaser)
            if (enemy instanceof ChaserEnemy) {
                const distToPlayer = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
                if (distToPlayer < 40) { // Arbitrary collision radius
                    enemy.explode();
                    
                    // Player takes damage
                    this.player.takeDamage(DEFAULT_CONFIG.enemies.chaser.impactDamage);
                    if (this.player.isDead) {
                        this.finishMatch('player-defeated');
                        return;
                    }
                }
            }
        }

        // 4. Process Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            if (proj.update(deltaMs)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            if (!proj.isExploding) {
                const gridX = Math.floor(proj.x / TILE_SIZE);
                const gridY = Math.floor(proj.y / TILE_SIZE);
                let hit = false;
                
                // Boundaries
                if (proj.x < 0 || proj.x > ARENA_WIDTH || proj.y < 0 || proj.y > ARENA_HEIGHT) {
                    hit = true;
                } 
                // Terrain
                else if (gridY >= 0 && gridY < this.landGrid.length && gridX >= 0 && gridX < this.landGrid[0].length) {
                    if (this.landGrid[gridY][gridX]) hit = true;
                }
                
                // Entity Hit Detection
                if (!hit) {
                    if (proj.ownerType === 'player') {
                        // Player's bullets hit enemies
                        for (const enemy of this.enemies) {
                            if (enemy.isDestroyed || (enemy instanceof ChaserEnemy && enemy.isExploding)) continue;
                            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
                            if (dist < 32) {
                                hit = true;
                                enemy.takeDamage(proj.damage);
                                if (enemy.isDead) {
                                    enemy.isDestroyed = true;
                                    this.score += 1;
                                }
                                break;
                            }
                        }
                    } else if (proj.ownerType === 'enemy') {
                        // Enemy's bullets hit player
                        const distToPlayer = Math.hypot(proj.x - this.player.x, proj.y - this.player.y);
                        if (distToPlayer < 32) {
                            hit = true;
                            this.player.takeDamage(proj.damage);
                            if (this.player.isDead) {
                                proj.explode();
                                this.finishMatch('player-defeated');
                                return;
                            }
                        }
                    }
                }

                if (hit) proj.explode();
            }
        }
    }

    private finishMatch(reason: MatchEndReason): void {
        if (this.matchEnded) return;

        this.matchEnded = true;
        this.ticker.stop();
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
}