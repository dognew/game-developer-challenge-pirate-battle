import * as PIXI from 'pixi.js';
import { TILE_SIZE, ARENA_WIDTH, ARENA_HEIGHT, DEFAULT_CONFIG } from './Config';
import { PlayerShip } from './actors/PlayerShip';
import { ChaserEnemy } from './actors/ChaserEnemy';
import { ShooterEnemy } from './actors/ShooterEnemy';
import { Projectile } from './actors/Projectile';
import { TerrainManager } from './TerrainManager';

/**
 * Handles the instantiation and placement of game actors and entities.
 */
export class SpawnManager {
    constructor(
        private terrainManager: TerrainManager,
        private actorsLayer: PIXI.Container,
        private projectilesLayer: PIXI.Container,
        private projectiles: Projectile[],
        private enemies: (ChaserEnemy | ShooterEnemy)[]
    ) {}

    public spawnPlayer(occupiedSectors: number[]): PlayerShip {
        const player = new PlayerShip();
        
        player.onFire = (projectilesData) => {
            projectilesData.forEach(data => {
                const config = data.isFront ? DEFAULT_CONFIG.player.frontWeapon.projectile : DEFAULT_CONFIG.player.sideWeapon.projectile;
                const proj = new Projectile(data.x, data.y, data.heading, config, 'player');
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
        
        player.x = (col * sectorWidth) + (sectorWidth / 2);
        player.y = (row * sectorHeight) + (sectorHeight / 2);
        
        this.actorsLayer.addChild(player);
        return player;
    }

    public spawnEnemy(playerX: number, playerY: number): void {
        let spawnX = 0;
        let spawnY = 0;
        let validSpawn = false;
        let attempts = 0;
        const MIN_SPAWN_DISTANCE = 600;

        while (!validSpawn && attempts < 20) {
            attempts++;
            spawnX = Math.random() * ARENA_WIDTH;
            spawnY = Math.random() * ARENA_HEIGHT;

            const collision = this.terrainManager.checkCollision(spawnX, spawnY);
            if (collision.isOutOfBounds || collision.isLand) continue;

            const distToPlayer = Math.hypot(spawnX - playerX, spawnY - playerY);
            if (distToPlayer < MIN_SPAWN_DISTANCE) continue;

            validSpawn = true;
        }

        if (!validSpawn) return;

        const rand = Math.random();
        let enemy: ChaserEnemy | ShooterEnemy;
        
        if (rand < DEFAULT_CONFIG.match.spawnDistribution.chaser) {
            enemy = new ChaserEnemy();
        } else {
            enemy = new ShooterEnemy();
        }

        enemy.x = spawnX;
        enemy.y = spawnY;
        this.actorsLayer.addChild(enemy);
        this.enemies.push(enemy);
    }
}