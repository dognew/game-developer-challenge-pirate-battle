import { TerrainBase } from '../TerrainBase';

/**
 * Defines a specific 10x6 terrain sector containing a 3x3 sand island.
 * Surrounded by a 5x5 shallow water area and features a defensive cannon.
 */
export class IslandModelB extends TerrainBase {
    
    protected setupGrids(): void {
        // Layer 0: Shallow waters (5x5 area)
        // Wraps around the 3x3 island to slow down approaching ships
        this.shallowWaterGrid = [
            ['', 'shoal_water_lt_tile', 'shoal_water_mt_tile', 'shoal_water_mt_tile', 'shoal_water_mt_tile', 'shoal_water_mt_tile', 'shoal_water_rt_tile', '', '', ''],
            ['', 'shoal_water_lm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_rm_tile', '', '', ''],
            ['', 'shoal_water_lm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_rm_tile', '', '', ''],
            ['', 'shoal_water_lm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_rm_tile', '', '', ''],
            ['', 'shoal_water_lm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_mm_tile', 'shoal_water_rm_tile', '', '', ''],
            ['', 'shoal_water_lb_tile', 'shoal_water_mb_tile', 'shoal_water_mb_tile', 'shoal_water_mb_tile', 'shoal_water_mb_tile', 'shoal_water_rb_tile', '', '', ''],
        ];
        // Layer 1: Sand/Island (3x3 area at the center of the shallow waters)
        // Causes damage on impact and blocks projectiles
        this.sandGrid = [
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', 'sandgreen_lt_tile', 'sandgreen_mt1_tile', 'sandgreen_mt2_tile', 'sandgreen_rt_tile', '', ''],
            ['', '', 'sandgreen_lm1_tile', 'sandgreen_vegetation1_tile', 'sandgreen_vegetation2_tile', 'sandgreen_rm1_tile', '', ''],
            ['', '', 'sandgreen_lm2_tile', 'sandgreen_vegetation3_tile', 'sandgreen_vegetation4_tile', 'sandgreen_rm2_tile', '', ''],
            ['', '', 'sandgreen_lb_tile', 'sandgreen_ship_tile', 'sandgreen_mb2_tile', 'sandgreen_rb_tile', '', ''],
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