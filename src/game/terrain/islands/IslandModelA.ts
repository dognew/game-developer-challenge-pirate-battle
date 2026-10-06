import { TerrainBase } from '../TerrainBase';

/**
 * Defines a specific 10x6 terrain sector containing a 3x3 sand island.
 * Surrounded by a 5x5 shallow water area and features a defensive cannon.
 */
export class IslandModelA extends TerrainBase {
    
    protected setupGrids(): void {
        // Layer 0: Shallow waters (5x5 area)
        // Wraps around the 3x3 island to slow down approaching ships
        this.shallowWaterGrid = [
            ['', '', 'shoal_water_lt_tile', 'shoal_water_mt_tile', 'shoal_water_mt_tile', 'shoal_water_mt_tile', 'shoal_water_rt_tile', '', '', ''],
            ['', '', 'shoal_water_lm_tile', '', '', '', 'shoal_water_rm_tile', '', '', ''],
            ['', '', 'shoal_water_lm_tile', '', '', '', 'shoal_water_rm_tile', '', '', ''],
            ['', '', 'shoal_water_lm_tile', '', '', '', 'shoal_water_rm_tile', '', '', ''],
            ['', '', 'shoal_water_lb_tile', 'shoal_water_mb_tile', 'shoal_water_mb_tile', 'shoal_water_mb_tile', 'shoal_water_rb_tile', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
        ];

        // Layer 1: Sand/Island (3x3 area at the center of the shallow waters)
        // Causes damage on impact and blocks projectiles
        this.sandGrid = [
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', 'sand_lt_tile', 'sand_mt_tile', 'sand_rt_tile', '', '', '', ''],
            ['', '', '', 'sand_lm_tile', 'sand_mm_tile', 'sand_rm_tile', '', '', '', ''],
            ['', '', '', 'sand_lb_tile', 'sand_mb_tile', 'sand_rb_tile', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
        ];

        // Layer 2: Foliage and Rocks
        this.decorationGrid = [
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', 'foliage1_tile', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', 'rock1_tile', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
        ];

        // Layer 3: Logical Actors
        // Spawns a defensive cannon on the middle-right tile of the island
        this.actorSpawns = [
            { type: 'cannon', gridX: 5, gridY: 2 }
        ];
    }
}