import * as PIXI from 'pixi.js';
import { TILE_SIZE, ARENA_WIDTH, ARENA_HEIGHT } from './Config';
import { AvailableIslands } from './terrain/islands';
import { PlayerShip } from './actors/PlayerShip';

/**
 * Core Game Engine
 * Manages procedural generation, physics, game loop, and entity lifecycle.
 */
export class GameEngine {
    private _app: PIXI.Application;
    private _actorsLayer: PIXI.Container;
    private terrainLayer: PIXI.Container;

    private player!: PlayerShip;
    private ticker: PIXI.Ticker;

    // Global collision and environmental maps (18 rows by 30 columns)
    private landGrid: boolean[][] = [];
    private shallowWaterGrid: boolean[][] = [];

    constructor(app: PIXI.Application, terrainLayer: PIXI.Container, actorsLayer: PIXI.Container) {
        this._app = app;
        this.terrainLayer = terrainLayer;
        this._actorsLayer = actorsLayer;

        this.ticker = new PIXI.Ticker();
        
        // Initialize empty environmental maps based on arena bounds
        const rows = Math.floor(ARENA_HEIGHT / TILE_SIZE);
        const cols = Math.floor(ARENA_WIDTH / TILE_SIZE);
        this.landGrid = Array.from({ length: rows }, () => Array(cols).fill(false));
        this.shallowWaterGrid = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    /**
     * Bootstraps the match by generating the arena and spawning entities.
     */
    public startMatch(): void {
        const occupiedSectors = this.generateArena();
        this.spawnPlayer(occupiedSectors);

        // Start the game loop
        this.ticker.add(() => this.gameLoop());
        this.ticker.start();
    }

    /**
     * Procedurally generates the map by dividing the logical arena into a 3x3 macro-grid.
     * Randomly selects 1 to 3 sectors and spawns a random island model in them.
     * @returns Array of sector indices (0-8) that are occupied by islands.
     */
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

            // Populate global maps using the island's local data
            const localSandGrid = island.getSandGrid();
            const localWaterGrid = island.getShallowWaterGrid();

            for (let r = 0; r < localSandGrid.length; r++) {
                for (let c = 0; c < localSandGrid[r].length; c++) {
                    const globalRow = (row * 6) + r;
                    const globalCol = (col * 10) + c;

                    if (localSandGrid[r][c] !== '') {
                        this.landGrid[globalRow][globalCol] = true;
                    }

                    if (localWaterGrid[r][c] !== '') {
                        this.shallowWaterGrid[globalRow][globalCol] = true;
                    }
                }
            }

            this.terrainLayer.addChild(island);
            
            // TO DO: Inject actors (cannons) from island.getActorSpawns() into this._actorsLayer
        }

        return chosenSectors;
    }

    /**
     * Spawns the player in a random sector that is strictly water.
     */
    private spawnPlayer(occupiedSectors: number[]): void {
        this.player = new PlayerShip();
        
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
     * Main update loop. Processes physics and environment limits before rendering.
     */
    private gameLoop(): void {
        const prevX = this.player.x;
        const prevY = this.player.y;

        this.player.update();
        
        let collided = false;
        let inShallowWater = false;

        // 1. Boundary Collision Check
        if (this.player.x < 0 || this.player.x > ARENA_WIDTH || 
            this.player.y < 0 || this.player.y > ARENA_HEIGHT) {
            collided = true;
        } else {
            // 2. Environment Matrix Checks
            const gridX = Math.floor(this.player.x / TILE_SIZE);
            const gridY = Math.floor(this.player.y / TILE_SIZE);
            
            if (gridY >= 0 && gridY < this.landGrid.length && gridX >= 0 && gridX < this.landGrid[0].length) {
                if (this.landGrid[gridY][gridX]) {
                    collided = true;
                } else if (this.shallowWaterGrid[gridY][gridX]) {
                    inShallowWater = true;
                }
            }
        }

        // Apply environmental drag
        this.player.setInShallowWater(inShallowWater);

        // 3. Collision Resolution
        if (collided) {
            this.player.x = prevX;
            this.player.y = prevY;
            this.player.crash();
        }
    }

    /**
     * Safely cleans up the engine instances and tickers.
     */
    public destroy(): void {
        this.ticker.stop();
        this.ticker.destroy();
        if (this.player) {
            this.player.parent?.removeChild(this.player);
            this.player.destroy({ children: true });
        }
    }
}