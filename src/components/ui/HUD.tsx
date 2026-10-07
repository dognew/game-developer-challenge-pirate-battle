import './HUD.css';

interface HUDProps {
    health?: number;
    score?: number;
    time?: number;
    onPause?: () => void;
    onClose?: () => void;
    onFireFront?: () => void;
    onFireLeft?: () => void;
    onFireRight?: () => void;
    onInput?: (action: string, isPressed: boolean) => void;
}

export function HUD({ 
    health = 100, 
    score = 0, 
    time = 120, 
    onPause, 
    onClose,
    onFireFront,
    onFireLeft,
    onFireRight,
    onInput
}: HUDProps) {
    
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="hud-container">
            <div className="hud-top">
                <div className="hud-col">
                    <div className="hud-icon-floating hud-icon-heart" />
                    <div className="hud-bar-wrapper">
                        {/* Camada 0: Frame */}
                        <div className="hud-bar-frame" />
                        {/* Camada 1: Fundo Vermelho (Dano Completo) */}
                        <div className="hud-bar-fill-red" />
                        {/* Camada 3 (2): Barra Verde Dinâmica */}
                        <div 
                            className="hud-bar-fill-green"
                            style={{ 
                                width: `${Math.max(0, Math.min(100, health))}%`
                            }}
                        />
                    </div>
                </div>

                <div className="hud-col">
                    <div className="hud-icon-floating hud-icon-score" />
                    <div className="hud-panel-wrapper">
                        <div className="hud-panel-bg" />
                        <span className="hud-panel-text">{score}</span>
                    </div>
                </div>

                <div className="hud-col">
                    <div className="hud-icon-floating hud-icon-time" />
                    <div className="hud-panel-wrapper">
                        <div className="hud-panel-bg" />
                        <span className="hud-panel-text">{formatTime(time)}</span>
                    </div>
                </div>

                <div className="hud-col hud-system-buttons">
                    <button type="button" className="hud-round-btn hud-btn-pause" aria-label="Pause game" onPointerDown={onPause}>
                        <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_pause.png" srcSet="/assets/png/default/ui/controls/icon_pause.png 1x, /assets/png/retina/ui/controls/icon_pause.png 2x" alt="" draggable="false" />
                    </button>
                    <button type="button" className="hud-round-btn hud-btn-close" aria-label="End game" onPointerDown={onClose}>
                        <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_close.png" srcSet="/assets/png/default/ui/controls/icon_close.png 1x, /assets/png/retina/ui/controls/icon_close.png 2x" alt="" draggable="false" />
                    </button>
                </div>
            </div>

            <div className="hud-bottom">
                <div className="hud-dpad">
                    <div className="dpad-row">
                        <button 
                            type="button"
                            className="hud-round-btn hud-btn-up"
                            aria-label="Move forward"
                            onPointerDown={() => onInput?.('w', true)}
                            onPointerUp={() => onInput?.('w', false)}
                            onPointerOut={() => onInput?.('w', false)}
                        >
                            <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_forward.png" srcSet="/assets/png/default/ui/controls/icon_forward.png 1x, /assets/png/retina/ui/controls/icon_forward.png 2x" alt="" draggable="false" />
                        </button>
                    </div>
                    <div className="dpad-row dpad-middle">
                        <button 
                            type="button"
                            className="hud-round-btn hud-btn-left"
                            aria-label="Turn left"
                            onPointerDown={() => onInput?.('a', true)}
                            onPointerUp={() => onInput?.('a', false)}
                            onPointerOut={() => onInput?.('a', false)}
                        >
                            <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_turn_left.png" srcSet="/assets/png/default/ui/controls/icon_turn_left.png 1x, /assets/png/retina/ui/controls/icon_turn_left.png 2x" alt="" draggable="false" />
                        </button>
                        <div className="dpad-center-spacer"></div>
                        <button 
                            type="button"
                            className="hud-round-btn hud-btn-right"
                            aria-label="Turn right"
                            onPointerDown={() => onInput?.('d', true)}
                            onPointerUp={() => onInput?.('d', false)}
                            onPointerOut={() => onInput?.('d', false)}
                        >
                            <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_turn_right.png" srcSet="/assets/png/default/ui/controls/icon_turn_right.png 1x, /assets/png/retina/ui/controls/icon_turn_right.png 2x" alt="" draggable="false" />
                        </button>
                    </div>
                    <div className="dpad-row">
                        <button 
                            type="button"
                            className="hud-round-btn hud-btn-down"
                            aria-label="Move backward"
                            onPointerDown={() => onInput?.('s', true)}
                            onPointerUp={() => onInput?.('s', false)}
                            onPointerOut={() => onInput?.('s', false)}
                        >
                            <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_forward.png" srcSet="/assets/png/default/ui/controls/icon_forward.png 1x, /assets/png/retina/ui/controls/icon_forward.png 2x" alt="" draggable="false" />
                        </button>
                    </div>
                </div>

                <div className="hud-fire-controls">
                    <button type="button" className="hud-round-btn hud-btn-fire-left" aria-label="Fire left" onPointerDown={onFireLeft}>
                        <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_fire_left.png" srcSet="/assets/png/default/ui/controls/icon_fire_left.png 1x, /assets/png/retina/ui/controls/icon_fire_left.png 2x" alt="" draggable="false" />
                    </button>
                    <button type="button" className="hud-round-btn hud-btn-fire-front fire-front" aria-label="Fire forward" onPointerDown={onFireFront}>
                        <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_fire_front.png" srcSet="/assets/png/default/ui/controls/icon_fire_front.png 1x, /assets/png/retina/ui/controls/icon_fire_front.png 2x" alt="" draggable="false" />
                    </button>
                    <button type="button" className="hud-round-btn hud-btn-fire-right" aria-label="Fire right" onPointerDown={onFireRight}>
                        <img className="hud-round-btn-icon" src="/assets/png/default/ui/controls/icon_fire_right.png" srcSet="/assets/png/default/ui/controls/icon_fire_right.png 1x, /assets/png/retina/ui/controls/icon_fire_right.png 2x" alt="" draggable="false" />
                    </button>
                </div>
            </div>
        </div>
    );
}