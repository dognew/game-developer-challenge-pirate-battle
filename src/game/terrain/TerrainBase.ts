import * as PIXI from 'pixi.js';

export interface ActorSpawn {
    type: 'cannon' | 'tower' | 'enemy';
    gridX: number;
    gridY: number;
}

/**
 * Abstract base class for all modular terrain chunks.
 * Manages the internal 4-layer visual hierarchy and physical grid data.
 * Sector dimensions are strictly 10 columns by 6 rows (640x384 logical pixels).
 */
export abstract class TerrainBase extends PIXI.Container {
    // Visual layers
    protected shallowWaterLayer = new PIXI.Container(); // Layer 0
    protected sandLayer = new PIXI.Container();         // Layer 1
    protected decorationLayer = new PIXI.Container();   // Layer 2
    protected actorLayer = new PIXI.Container();        // Layer 3

    // Physical data grids (10x6 matrices). Empty string '' represents empty space.
    protected shallowWaterGrid: string[][] = [];
    protected sandGrid: string[][] = [];
    protected decorationGrid: string[][] = [];
    
    // Coordinates for the GameEngine to instantiate logical actors
    protected actorSpawns: ActorSpawn[] = [];

    constructor() {
        super();
        
        // Stack the visual layers in the correct Z-order
        this.addChild(
            this.shallowWaterLayer, 
            this.sandLayer, 
            this.decorationLayer, 
            this.actorLayer
        );

        this.setupGrids();
    }

    /**
     * Must be implemented by subclasses to populate the matrices and spawns.
     */
    protected abstract setupGrids(): void;

    // Getters for the physics and rendering engine
    public getShallowWaterGrid(): string[][] { return this.shallowWaterGrid; }
    public getSandGrid(): string[][] { return this.sandGrid; }
    public getDecorationGrid(): string[][] { return this.decorationGrid; }
    public getActorSpawns(): ActorSpawn[] { return this.actorSpawns; }

    /**
     * TO DO: This method will be called by the GameEngine using a TilemapBuilder
     * to read the grids and populate the PIXI.Containers with actual Sprites.
     * The underscore prevents the "declared but never read" TypeScript error.
     */
    public buildVisuals(_builder: any): void {
        // Implementation reserved for the texture parsing step
    }
}