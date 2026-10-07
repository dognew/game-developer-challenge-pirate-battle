import { useCallback, useEffect, useRef, useState } from 'react';
import { PanelModal } from '../components/ui/PanelModal';
import { Button } from '../components/ui/Button';
import { HUD } from '../components/ui/HUD';
import * as PIXI from 'pixi.js';
import { AssetManager } from './AssetManager';
import { ARENA_WIDTH, ARENA_HEIGHT, DEFAULT_CONFIG } from './Config';
import { GameSessionManager, type CompletedMatch } from './GameSessionManager';

interface GameScreenProps {
    onExit: () => void;
    onRestart: () => void;
}

/**
 * GameScreen Component
 * Bridges React and PixiJS (v8).
 * Handles asset loading state, Strict Mode unmounting, and WebGL initialization.
 */
export function GameScreen({ onExit, onRestart }: GameScreenProps) {
    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const gameSessionRef = useRef<GameSessionManager | null>(null);
    const isPausedRef = useRef(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState(false);
    const [completedMatch, setCompletedMatch] = useState<CompletedMatch | null>(null);
    const [playerHealth, setPlayerHealth] = useState(100);
    const [playerScore, setPlayerScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(
        DEFAULT_CONFIG.match.sessionTimeMs / 1000,
    );
    
    // UI states to fulfill the "visible loading state" requirement
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);

    const pauseGame = useCallback(() => {
        if (gameSessionRef.current?.pause()) {
            isPausedRef.current = true;
            setIsPaused(true);
        }
    }, []);

    const resumeGame = useCallback(() => {
        if (gameSessionRef.current?.resume()) {
            isPausedRef.current = false;
            setIsPaused(false);
        }
    }, []);

    const endGame = useCallback(() => {
        isPausedRef.current = false;
        setIsPaused(false);
        gameSessionRef.current?.endMatch();
    }, []);

    useEffect(() => {
        const handlePauseKey = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== 'p' || event.repeat) return;

            event.preventDefault();
            if (isPausedRef.current) {
                resumeGame();
            } else {
                pauseGame();
            }
        };

        window.addEventListener('keydown', handlePauseKey);
        return () => window.removeEventListener('keydown', handlePauseKey);
    }, [pauseGame, resumeGame]);

    useEffect(() => {
        if (!pixiContainerRef.current) return;

        let isDestroyed = false;
        let hasInitialized = false;
        let gameSession: GameSessionManager | null = null;
        const app = new PIXI.Application();

        const initPixi = async () => {
            try {
                // 1. Load all required assets before touching the WebGL canvas
                await AssetManager.loadGameAssets((progress) => {
                    if (!isDestroyed) setLoadingProgress(progress);
                });

                if (isDestroyed) return;

                // 2. Initialize PixiJS Application
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
                const waterTexture = PIXI.Assets.get('water_tile');
                
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

                    // Center the logical arena container
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

                // 6. Initialize the core GameEngine and hand over control
                gameSession = new GameSessionManager(
                    terrainLayer,
                    actorsLayer,
                    projectilesLayer,
                    (match) => {
                        if (!isDestroyed) setCompletedMatch(match);
                    },
                    (health) => {
                        if (!isDestroyed) setPlayerHealth(health);
                    },
                    (time) => {
                        if (!isDestroyed) setTimeRemaining(time);
                    },
                    (score) => {
                        if (!isDestroyed) setPlayerScore(score);
                    },
                );
                gameSessionRef.current = gameSession;
                gameSession.start();

                // 7. Remove loading screen
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
            gameSessionRef.current = null;
            isPausedRef.current = false;
            gameSession?.destroy();
            if (hasInitialized) {
                app.destroy(true, { children: true });
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
            {/* PixiJS Canvas Container */}
            <div ref={pixiContainerRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Heads Up Display */}
            {!isLoading && !loadError && (
                <HUD 
                    health={playerHealth} 
                    score={playerScore} 
                    time={timeRemaining} 
                    onPause={pauseGame} 
                    onClose={endGame} 
                    onFireFront={() => gameSessionRef.current?.fireFront()}
                    onFireLeft={() => gameSessionRef.current?.fireLeft()}
                    onFireRight={() => gameSessionRef.current?.fireRight()}
                    onInput={(action, isPressed) => gameSessionRef.current?.setPlayerInput(action, isPressed)}
                />
            )}

            {isPaused && !completedMatch && (
                <PanelModal title="Paused">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Button label="RESUME" onClick={resumeGame} />
                        <Button label="MAIN MENU" onClick={onExit} variant="secondary" />
                    </div>
                </PanelModal>
            )}

            {completedMatch && (
                <PanelModal
                    title="Game Over"
                    description={`Score: ${completedMatch.score} · Time: ${Math.ceil(completedMatch.durationMs / 1000)}s`}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Button label="PLAY AGAIN" onClick={onRestart} />
                        <Button label="MAIN MENU" onClick={onExit} variant="secondary" />
                    </div>
                </PanelModal>
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