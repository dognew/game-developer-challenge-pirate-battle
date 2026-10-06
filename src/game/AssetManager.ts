import * as PIXI from 'pixi.js';

export class AssetManager {
    private static isInitialized = false;
    private static shipTexturesPromise: Promise<Record<string, PIXI.Texture>> | null = null;
    private static shipTextures: Record<string, PIXI.Texture> | null = null;

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
            PIXI.Assets.add({ alias: 'shipsSheetImage', src: `/assets/spritesheet/ships_miscellaneous_sheet${suffix}.png` });
            PIXI.Assets.add({ alias: 'tilesSheet', src: `/assets/tilesheet/tiles_sheet${suffix}.json` });
            
            this.isInitialized = true;
        }

        try {
            await PIXI.Assets.load(['uiSheet', 'shipsSheetImage', 'tilesSheet'], (progress) => {
                onProgress(Math.round(progress * 100));
            });

            if (!this.shipTexturesPromise) {
                const image = PIXI.Assets.get<PIXI.Texture>('shipsSheetImage');
                const xmlUrl = `/assets/spritesheet/ships_miscellaneous_sheet${suffix}.xml`;
                this.shipTexturesPromise = this.loadShipTextures(image, xmlUrl).catch((error: unknown) => {
                    this.shipTexturesPromise = null;
                    throw error;
                });
            }

            this.shipTextures = await this.shipTexturesPromise;
        } catch (error) {
            console.error("[AssetManager] Critical failure loading game assets.", error);
            throw error; 
        }
    }

    public static getShipTexture(name: string): PIXI.Texture {
        if (!this.shipTextures) {
            throw new Error('Ship textures have not been loaded yet.');
        }

        const texture = this.shipTextures[name];
        if (!texture) {
            throw new Error(`Ship texture "${name}" was not found in the ships spritesheet.`);
        }

        return texture;
    }

    public static getUiTexture(name: string): PIXI.Texture {
        const uiSheet = PIXI.Assets.get<PIXI.Spritesheet>('uiSheet');
        const texture = uiSheet.textures[name];

        if (!texture) {
            throw new Error(`UI texture "${name}" was not found in the UI spritesheet.`);
        }

        return texture;
    }

    private static async loadShipTextures(
        image: PIXI.Texture,
        xmlUrl: string,
    ): Promise<Record<string, PIXI.Texture>> {
        const response = await fetch(xmlUrl);
        if (!response.ok) {
            throw new Error(`Failed to load ships spritesheet metadata: ${response.status} ${response.statusText}`);
        }

        const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
        if (xml.querySelector('parsererror')) {
            throw new Error(`Invalid ships spritesheet XML: ${xmlUrl}`);
        }

        const frames: PIXI.SpritesheetData['frames'] = {};
        for (const subTexture of Array.from(xml.getElementsByTagName('SubTexture'))) {
            const name = subTexture.getAttribute('name');
            const values = ['x', 'y', 'width', 'height'].map((attribute) => subTexture.getAttribute(attribute));

            if (!name || values.some((value) => value === null)) {
                throw new Error(`Invalid frame in ships spritesheet XML: ${subTexture.outerHTML}`);
            }

            const [x, y, w, h] = values.map(Number);
            if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) {
                throw new Error(`Invalid frame in ships spritesheet XML: ${subTexture.outerHTML}`);
            }

            frames[name] = {
                frame: { x, y, w, h },
                rotated: subTexture.getAttribute('rotated') === 'true',
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w, h },
                sourceSize: { w, h },
            };
        }

        if (Object.keys(frames).length === 0) {
            throw new Error(`No SubTexture frames found in ships spritesheet XML: ${xmlUrl}`);
        }

        const spritesheet = new PIXI.Spritesheet(image.source, {
            frames,
            meta: { scale: '1' },
        });
        return spritesheet.parse();
    }
}