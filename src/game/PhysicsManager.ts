import * as PIXI from 'pixi.js';
import { DEFAULT_CONFIG } from './Config';
import { PlayerShip } from './actors/PlayerShip';
import { Projectile } from './actors/Projectile';
import { ChaserEnemy } from './actors/ChaserEnemy';
import { ShooterEnemy } from './actors/ShooterEnemy';
import { TerrainManager } from './TerrainManager';

export interface PhysicsResult {
    playerDefeated: boolean;
    scoreGained: number;
}

/**
 * Handles updates, movement physics, AI triggers, and collision logic.
 */
export class PhysicsManager {
    constructor(
        private terrainManager: TerrainManager,
        private projectilesLayer: PIXI.Container,
        private projectiles: Projectile[],
        private enemies: (ChaserEnemy | ShooterEnemy)[]
    ) {}

    public update(deltaMs: number, matchTimeMs: number, player: PlayerShip): PhysicsResult {
        const result: PhysicsResult = { playerDefeated: false, scoreGained: 0 };

        // 1. Process Player
        const prevPlayerX = player.x;
        const prevPlayerY = player.y;

        player.update(deltaMs);
        const playerCollision = this.terrainManager.checkCollision(player.x, player.y);

        player.setInShallowWater(playerCollision.isShallowWater);
        if (playerCollision.isOutOfBounds || playerCollision.isLand) {
            player.x = prevPlayerX;
            player.y = prevPlayerY;
            player.crash();
        }

        // 2. Process Enemies
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

            if (enemy instanceof ChaserEnemy) {
                enemy.chaseTarget(player.x, player.y);
            } else if (enemy instanceof ShooterEnemy) {
                const isShooting = enemy.updateAI(player.x, player.y, matchTimeMs);
                if (isShooting) {
                    const config = DEFAULT_CONFIG.enemies.shooter.weapon.projectile;
                    const spawnX = enemy.x + Math.cos(enemy.rotation) * enemy.frontCannon.x - Math.sin(enemy.rotation) * enemy.frontCannon.y;
                    const spawnY = enemy.y + Math.sin(enemy.rotation) * enemy.frontCannon.x + Math.cos(enemy.rotation) * enemy.frontCannon.y;
                    
                    const proj = new Projectile(spawnX, spawnY, enemy.rotation + Math.PI / 2, config, 'enemy');
                    this.projectilesLayer.addChild(proj);
                    this.projectiles.push(proj);
                }
            }

            enemy.update(deltaMs);

            const enemyCollision = this.terrainManager.checkCollision(enemy.x, enemy.y);
            enemy.setInShallowWater(enemyCollision.isShallowWater);
            
            if (enemyCollision.isOutOfBounds || enemyCollision.isLand) {
                enemy.x = prevX;
                enemy.y = prevY;
                enemy.crash();
            }
            
            if (enemy instanceof ChaserEnemy) {
                const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (distToPlayer < 40) {
                    enemy.explode();
                    player.takeDamage(DEFAULT_CONFIG.enemies.chaser.impactDamage);
                    if (player.isDead) result.playerDefeated = true;
                }
            }
        }

        // 3. Process Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            if (proj.update(deltaMs)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            if (!proj.isExploding) {
                let hit = false;
                const projCollision = this.terrainManager.checkCollision(proj.x, proj.y);
                
                if (projCollision.isOutOfBounds || projCollision.isLand) {
                    hit = true;
                }
                
                if (!hit) {
                    if (proj.ownerType === 'player') {
                        for (const enemy of this.enemies) {
                            if (enemy.isDestroyed || (enemy instanceof ChaserEnemy && enemy.isExploding)) continue;
                            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
                            if (dist < 32) {
                                hit = true;
                                enemy.takeDamage(proj.damage);
                                if (enemy.isDead) {
                                    enemy.isDestroyed = true;
                                    result.scoreGained += 1;
                                }
                                break;
                            }
                        }
                    } else if (proj.ownerType === 'enemy') {
                        const distToPlayer = Math.hypot(proj.x - player.x, proj.y - player.y);
                        if (distToPlayer < 32) {
                            hit = true;
                            player.takeDamage(proj.damage);
                            if (player.isDead) {
                                proj.explode();
                                result.playerDefeated = true;
                            }
                        }
                    }
                }

                if (hit) proj.explode();
            }
        }

        return result;
    }
}