import * as PIXI from 'pixi.js';
import { TILE_SIZE, ARENA_WIDTH, ARENA_HEIGHT, DEFAULT_CONFIG } from './Config';
import { AvailableIslands } from './terrain/islands';
import { PlayerShip } from './actors/PlayerShip';
import { Projectile } from './actors/Projectile';

/**
 * Core Game Engine
 * Manages procedural generation, physics, game loop, and entity lifecycle.
 */
export class GameEngine {
    private _app: PIXI.Application;
    private _actorsLayer: PIXI.Container;
    private terrainLayer: PIXI.Container;
    private projectilesLayer: PIXI.Container;

    private player!: PlayerShip;
    private projectiles: Projectile[] = [];
    private ticker: PIXI.Ticker;

    private landGrid: boolean[][] = [];
    private shallowWaterGrid: boolean[][] = [];

    constructor(app: PIXI.Application, terrainLayer: PIXI.Container, actorsLayer: PIXI.Container, projectilesLayer: PIXI.Container) {
        this._app = app;
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
        const occupiedSectors = this.generateArena();
        this.spawnPlayer(occupiedSectors);

        this.ticker.add(() => this.gameLoop());
        this.ticker.start();
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
                const proj = new Projectile(data.x, data.y, data.heading, config);
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

    private gameLoop(): void {
        const deltaMs = this.ticker.deltaMS;
        const prevX = this.player.x;
        const prevY = this.player.y;

        // Update player
        this.player.update(deltaMs);
        
        // Evaluate player environment and bounds
        let collided = false;
        let inShallowWater = false;

        if (this.player.x < 0 || this.player.x > ARENA_WIDTH || this.player.y < 0 || this.player.y > ARENA_HEIGHT) {
            collided = true;
        } else {
            const gridX = Math.floor(this.player.x / TILE_SIZE);
            const gridY = Math.floor(this.player.y / TILE_SIZE);
            
            if (gridY >= 0 && gridY < this.landGrid.length && gridX >= 0 && gridX < this.landGrid[0].length) {
                if (this.landGrid[gridY][gridX]) collided = true;
                else if (this.shallowWaterGrid[gridY][gridX]) inShallowWater = true;
            }
        }

        this.player.setInShallowWater(inShallowWater);
        if (collided) {
            this.player.x = prevX;
            this.player.y = prevY;
            this.player.crash();
        }

        // Process projectiles
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

                if (hit) proj.explode();
            }
        }
    }

    public destroy(): void {
        this.ticker.stop();
        this.ticker.destroy();
        if (this.player) {
            this.player.parent?.removeChild(this.player);
            this.player.destroy({ children: true });
        }
    }
}