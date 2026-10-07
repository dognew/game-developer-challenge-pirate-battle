import * as PIXI from 'pixi.js';
import { TILE_SIZE, ARENA_WIDTH, ARENA_HEIGHT } from './Config';
import { AvailableIslands } from './terrain/islands';

/**
 * Manages procedural map generation and terrain collision detection.
 */
export class TerrainManager {
    private landGrid: boolean[][] = [];
    private shallowWaterGrid: boolean[][] = [];

    constructor() {
        const rows = Math.floor(ARENA_HEIGHT / TILE_SIZE);
        const cols = Math.floor(ARENA_WIDTH / TILE_SIZE);
        this.landGrid = Array.from({ length: rows }, () => Array(cols).fill(false));
        this.shallowWaterGrid = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    public generateArena(terrainLayer: PIXI.Container): number[] {
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

            terrainLayer.addChild(island);
        }

        return chosenSectors;
    }

    public checkCollision(x: number, y: number): { isOutOfBounds: boolean; isLand: boolean; isShallowWater: boolean } {
        const result = { isOutOfBounds: false, isLand: false, isShallowWater: false };

        if (x < 0 || x > ARENA_WIDTH || y < 0 || y > ARENA_HEIGHT) {
            result.isOutOfBounds = true;
            return result;
        }

        const gridX = Math.floor(x / TILE_SIZE);
        const gridY = Math.floor(y / TILE_SIZE);

        if (gridY >= 0 && gridY < this.landGrid.length && gridX >= 0 && gridX < this.landGrid[0].length) {
            result.isLand = this.landGrid[gridY][gridX];
            result.isShallowWater = this.shallowWaterGrid[gridY][gridX];
        }

        return result;
    }
}