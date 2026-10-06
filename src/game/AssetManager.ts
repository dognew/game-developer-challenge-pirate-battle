import * as PIXI from 'pixi.js';

export class AssetManager {
    private static isInitialized = false;

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

    public static async loadGameAssets(onProgress: (progress: number) => void): Promise<void> {
        const quality = this.getQualityPrefix();
        const suffix = quality === 'retina' ? '_retina' : '';

        if (!this.isInitialized) {
            PIXI.Assets.add({ alias: 'uiSheet', src: `/assets/spritesheet/ui_sheet${suffix}.json` });
            PIXI.Assets.add({ alias: 'shipsSheet', src: `/assets/spritesheet/ships_miscellaneous_sheet${suffix}.xml` });
            PIXI.Assets.add({ alias: 'tilesSheet', src: `/assets/spritesheet/tiles_sheet${suffix}.json` });
            
            this.isInitialized = true;
        }

        try {
            await PIXI.Assets.load(['uiSheet', 'shipsSheet', 'tilesSheet'], (progress) => {
                onProgress(Math.round(progress * 100));
            });
        } catch (error) {
            console.error("[AssetManager] Critical failure loading game assets.", error);
            throw error; 
        }
    }
}