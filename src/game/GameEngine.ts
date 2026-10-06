import * as PIXI from 'pixi.js';
import { TILE_SIZE } from './Config';
import { AvailableIslands } from './terrain/islands';

/**
 * Core Game Engine
 * Manages procedural generation, physics, game loop, and entity lifecycle.
 */
export class GameEngine {
    private _app: PIXI.Application;
    private _actorsLayer: PIXI.Container;
    private terrainLayer: PIXI.Container;

    constructor(app: PIXI.Application, terrainLayer: PIXI.Container, actorsLayer: PIXI.Container) {
        this._app = app;
        this.terrainLayer = terrainLayer;
        this._actorsLayer = actorsLayer;
    }

    /**
     * Bootstraps the match by generating the arena and spawning entities.
     */
    public startMatch(): void {
        this.generateArena();
    }

    /**
     * Procedurally generates the map by dividing the logical arena into a 3x3 macro-grid.
     * Randomly selects 1 to 3 sectors and spawns a random island model in them.
     */
    private generateArena(): void {
        const sectorColumns = 3;
        
        // A sector is strictly 10x6 tiles (640x384 pixels)
        const sectorWidth = 10 * TILE_SIZE;
        const sectorHeight = 6 * TILE_SIZE;

        // Determines the amount of islands for the current match (1 to 3)
        const numIslandsToSpawn = Math.floor(Math.random() * 3) + 1;

        // Selects unique sectors based on the target island count
        const availableSectors = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const chosenSectors = availableSectors.sort(() => 0.5 - Math.random()).slice(0, numIslandsToSpawn);

        for (const sectorIndex of chosenSectors) {
            // Calculate grid coordinates for the specific sector
            const col = sectorIndex % sectorColumns;
            const row = Math.floor(sectorIndex / sectorColumns);

            // Select and instantiate a random island class from the registry
            const RandomIslandClass = AvailableIslands[Math.floor(Math.random() * AvailableIslands.length)];
            const island = new RandomIslandClass();
            
            island.buildVisuals();

            // Offset the entire chunk to its exact sector position in the arena
            island.x = col * sectorWidth;
            island.y = row * sectorHeight;

            // Attach to the main terrain layer
            this.terrainLayer.addChild(island);
            
            // TO DO: Inject actors (cannons) from island.getActorSpawns() into this._actorsLayer
        }
    }

    /**
     * Safely cleans up the engine instances and tickers.
     */
    public destroy(): void {
        // Implementation reserved for physics and ticker cleanup
    }
}