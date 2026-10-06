import { useEffect, useRef, useState } from 'react';
import { PanelModal } from '../components/ui/PanelModal';
import { Button } from '../components/ui/Button';
import * as PIXI from 'pixi.js';
import { AssetManager } from './AssetManager';
import { ARENA_WIDTH, ARENA_HEIGHT } from './Config';

interface GameScreenProps {
    onExit: () => void;
}

/**
 * GameScreen Component
 * Bridges React and PixiJS (v8).
 * Handles asset loading state, Strict Mode unmounting, and WebGL initialization.
 */
export function GameScreen({ onExit }: GameScreenProps) {
    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const [loadError, setLoadError] = useState<boolean>(false);
    
    // UI states to fulfill the "visible loading state" requirement
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);

    useEffect(() => {
        if (!pixiContainerRef.current) return;

        let isDestroyed = false;
        let hasInitialized = false;
        const app = new PIXI.Application();

        const initPixi = async () => {
            try {
                // 1. Load all required assets before touching the WebGL canvas
                await AssetManager.loadGameAssets((progress) => {
                    if (!isDestroyed) setLoadingProgress(progress);
                });

                if (isDestroyed) return;

                // 2. Initialize PixiJS Application
                // The canvas fills the window, but the logical game world is restricted inside arenaContainer
                await app.init({
                    resizeTo: window,
                    backgroundColor: 0x0f4c75,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                    preference: ['webgl', 'canvas'],
                });
                
                hasInitialized = true;

                if (isDestroyed) {
                    app.destroy(true, { children: true });
                    hasInitialized = false;
                    return;
                }

                if (pixiContainerRef.current) {
                    pixiContainerRef.current.appendChild(app.canvas);
                }

                // 3. Setup architectural layers inside a master scalable container
                const arenaContainer = new PIXI.Container();
                
                const waterLayer = new PIXI.Container();
                const terrainLayer = new PIXI.Container();
                const actorsLayer = new PIXI.Container();
                const projectilesLayer = new PIXI.Container();
                const effectsLayer = new PIXI.Container();

                arenaContainer.addChild(waterLayer, terrainLayer, actorsLayer, projectilesLayer, effectsLayer);
                app.stage.addChild(arenaContainer);

                // 4. Retrieve the pre-loaded texture and set it to the fixed logical boundaries
                const waterTexture = PIXI.Assets.get('waterTile');
                
                const waterSprite = new PIXI.TilingSprite({
                    texture: waterTexture,
                    width: ARENA_WIDTH,
                    height: ARENA_HEIGHT,
                });
                waterLayer.addChild(waterSprite);

                // 5. Responsive scaling logic (Letterboxing with immersive background)
                const resizeArena = () => {
                    const screenW = window.innerWidth;
                    const screenH = window.innerHeight;
                    
                    const scaleX = screenW / ARENA_WIDTH;
                    const scaleY = screenH / ARENA_HEIGHT;
                    const scale = Math.min(scaleX, scaleY); // Calculates logical arena scale

                    // Center the logical arena
                    arenaContainer.scale.set(scale);
                    arenaContainer.x = (screenW - ARENA_WIDTH * scale) / 2;
                    arenaContainer.y = (screenH - ARENA_HEIGHT * scale) / 2;

                    // Expand water sprite to cover the out-of-bounds screen margins
                    waterSprite.width = screenW / scale;
                    waterSprite.height = screenH / scale;
                    waterSprite.x = -arenaContainer.x / scale;
                    waterSprite.y = -arenaContainer.y / scale;
                    
                    // Lock the texture pattern to the logical (0,0) grid to maintain seamless tiling
                    waterSprite.tilePosition.x = -waterSprite.x;
                    waterSprite.tilePosition.y = -waterSprite.y;
                };

                app.renderer.on('resize', resizeArena);
                resizeArena(); // Force initial scale calculation

                // 6. Remove loading screen
                setIsLoading(false);

            } catch (error) {
                console.error("Game initialization failed:", error);
                if (!isDestroyed) {
                    setIsLoading(false);
                    setLoadError(true);
                }
            }
        };

        initPixi();

        return () => {
            isDestroyed = true;
            if (hasInitialized) {
                app.destroy(true, { children: true });
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
            
            {/* PixiJS Canvas Container */}
            <div ref={pixiContainerRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Temporary Exit Button */}
            {!isLoading && !loadError && (
                <button 
                    onClick={onExit}
                    style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
                >
                    LEAVE (TEMP)
                </button>
            )}

            {/* VISIBLE LOADING STATE */}
            {isLoading && !loadError && (
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: '#0f4c75', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', zIndex: 50, color: 'white'
                }}>
                    <h2 style={{ fontFamily: 'monospace', fontSize: '2rem' }}>LOADING ASSETS</h2>
                    <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', marginTop: '10px' }}>
                        {loadingProgress}%
                    </p>
                </div>
            )}

            {/* ERROR RECOVERY MODAL */}
            {loadError && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }}>
                    <PanelModal 
                        title="Loading Error" 
                        description="Connection timeout or texture loading failed. Please try again later or reload the page."
                    >
                        <Button label="RELOAD PAGE" onClick={() => window.location.reload()} />
                    </PanelModal>
                </div>
            )}
        </div>
    );
}