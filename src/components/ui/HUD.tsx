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
                    <button className="hud-round-btn hud-btn-pause" onPointerDown={onPause} />
                    <button className="hud-round-btn hud-btn-close" onPointerDown={onClose} />
                </div>
            </div>

            <div className="hud-bottom">
                <div className="hud-dpad">
                    <div className="dpad-row">
                        <button 
                            className="hud-round-btn hud-btn-up"
                            onPointerDown={() => onInput?.('w', true)}
                            onPointerUp={() => onInput?.('w', false)}
                            onPointerOut={() => onInput?.('w', false)}
                        />
                    </div>
                    <div className="dpad-row dpad-middle">
                        <button 
                            className="hud-round-btn hud-btn-left"
                            onPointerDown={() => onInput?.('a', true)}
                            onPointerUp={() => onInput?.('a', false)}
                            onPointerOut={() => onInput?.('a', false)}
                        />
                        <div className="dpad-center-spacer"></div>
                        <button 
                            className="hud-round-btn hud-btn-right"
                            onPointerDown={() => onInput?.('d', true)}
                            onPointerUp={() => onInput?.('d', false)}
                            onPointerOut={() => onInput?.('d', false)}
                        />
                    </div>
                    <div className="dpad-row">
                        <button 
                            className="hud-round-btn hud-btn-down"
                            onPointerDown={() => onInput?.('s', true)}
                            onPointerUp={() => onInput?.('s', false)}
                            onPointerOut={() => onInput?.('s', false)}
                        />
                    </div>
                </div>

                <div className="hud-fire-controls">
                    <button className="hud-round-btn hud-btn-fire-left" onPointerDown={onFireLeft} />
                    <button className="hud-round-btn hud-btn-fire-front fire-front" onPointerDown={onFireFront} />
                    <button className="hud-round-btn hud-btn-fire-right" onPointerDown={onFireRight} />
                </div>
            </div>
        </div>
    );
}