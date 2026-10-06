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
    protected shallowWaterLayer = new PIXI.Container(); // Layer 0
    protected sandLayer = new PIXI.Container();         // Layer 1
    protected decorationLayer = new PIXI.Container();   // Layer 2
    protected actorLayer = new PIXI.Container();        // Layer 3

    protected shallowWaterGrid: string[][] = [];
    protected sandGrid: string[][] = [];
    protected decorationGrid: string[][] = [];
    protected actorSpawns: ActorSpawn[] = [];

    // TILE_SIZE corresponds to the 64x64 logical pixels
    private readonly TILE_SIZE = 64; 

    constructor() {
        super();
        
        this.addChild(
            this.shallowWaterLayer, 
            this.sandLayer, 
            this.decorationLayer, 
            this.actorLayer
        );

        this.setupGrids();
    }

    protected abstract setupGrids(): void;

    public getShallowWaterGrid(): string[][] { return this.shallowWaterGrid; }
    public getSandGrid(): string[][] { return this.sandGrid; }
    public getDecorationGrid(): string[][] { return this.decorationGrid; }
    public getActorSpawns(): ActorSpawn[] { return this.actorSpawns; }

    /** Reads the string matrices and instantiates sprites from the loaded tile spritesheet. */
    public buildVisuals(): void {
        const tileTextures = PIXI.Assets.get<PIXI.Spritesheet>('tilesSheet').textures;

        this.populateLayer(this.shallowWaterGrid, this.shallowWaterLayer, tileTextures);
        this.populateLayer(this.sandGrid, this.sandLayer, tileTextures);
        this.populateLayer(this.decorationGrid, this.decorationLayer, tileTextures);
    }

    /**
     * Helper method to iterate through a grid and spawn sprites.
     */
    private populateLayer(
        grid: string[][],
        targetLayer: PIXI.Container,
        tileTextures: Record<string, PIXI.Texture>,
    ): void {
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const tileId = grid[row][col];
                
                // Skip empty definitions
                if (tileId !== '') {
                    const texture = tileTextures[tileId];
                    if (!texture) {
                        throw new Error(`Tile "${tileId}" is missing from the loaded tilesheet.`);
                    }

                    const sprite = new PIXI.Sprite(texture);
                    sprite.x = col * this.TILE_SIZE;
                    sprite.y = row * this.TILE_SIZE;
                    targetLayer.addChild(sprite);
                }
            }
        }
    }
}