import * as PIXI from 'pixi.js';

export class AssetManager {
    private static isInitialized = false;

    /**
     * Determines the base path considering pixel density and network quality.
     */
    public static getQualityPrefix(): 'retina' | 'default' {
        const isRetina = window.devicePixelRatio > 1;

        const nav = navigator as any;
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
        
        let isSlowConnection = false;
        if (connection) {
            isSlowConnection = connection.saveData === true || /2g|3g/.test(connection.effectiveType);
        }

        if (isRetina && !isSlowConnection) {
            console.log("[AssetManager] Using retina assets.");
            return 'retina';
        }
        
        console.log("[AssetManager] Using default assets.");
        return 'default';
    }

    /**
     * Loads all mandatory game assets (Spritesheets and isolated tiles).
     * Reports progress back to the UI to fulfill the loading state requirement.
     * 
     * @param onProgress Callback function receiving progress from 0 to 100.
     */
    public static async loadGameAssets(onProgress: (progress: number) => void): Promise<void> {
        const quality = this.getQualityPrefix();
        const suffix = quality === 'retina' ? '_retina' : '';

        // Prevent duplicate asset registration during React Strict Mode double invocation
        if (!this.isInitialized) {
            PIXI.Assets.add({ alias: 'uiSheet', src: `/assets/spritesheet/ui_sheet${suffix}.json` });
            PIXI.Assets.add({ alias: 'shipsSheet', src: `/assets/spritesheet/ships_miscellaneous_sheet${suffix}.xml` });
            PIXI.Assets.add({ alias: 'waterTile', src: `/assets/png/${quality}/tiles/tile_73.png` });
            this.isInitialized = true;
        }

        try {
            await PIXI.Assets.load(['uiSheet', 'shipsSheet', 'waterTile'], (progress) => {
                onProgress(Math.round(progress * 100));
            });
        } catch (error) {
            console.error("[AssetManager] Critical failure loading game assets.", error);
            throw error; 
        }
    }
}