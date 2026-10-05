import { useState } from 'react';
import { DEFAULT_CONFIG } from '../../game/Config';
import { Button } from '../ui/Button';
import './Options.css';

interface OptionsProps {
    onBack: () => void;
}

/**
 * Options Menu Component
 * Allows players to configure game parameters (session time and spawn interval).
 * Converts internal milliseconds from Config.ts to seconds for UI display.
 */
export function Options({ onBack }: OptionsProps) {
    // Initialize states from the single source of truth (Config.ts)
    // Converted to seconds for easier user interaction
    const [sessionTime, setSessionTime] = useState<number>(DEFAULT_CONFIG.match.sessionTimeMs / 1000);
    const [spawnTime, setSpawnTime] = useState<number>(DEFAULT_CONFIG.match.spawnIntervalMs / 1000);

    // Handlers with hard limits based on game design rules
    const handleSessionDecrease = () => setSessionTime(prev => Math.max(60, prev - 10)); // Min 60s
    const handleSessionIncrease = () => setSessionTime(prev => Math.min(180, prev + 10)); // Max 180s

    const handleSpawnDecrease = () => setSpawnTime(prev => Math.max(1, prev - 1)); // Min 1s
    const handleSpawnIncrease = () => setSpawnTime(prev => Math.min(10, prev + 1)); // Max 10s

    const handleSaveAndBack = () => {
        // Here we will eventually persist the modified config to LocalStorage or a Global Context
        // For now, we update the DEFAULT_CONFIG directly in memory (temporary) or just return
        DEFAULT_CONFIG.match.sessionTimeMs = sessionTime * 1000;
        DEFAULT_CONFIG.match.spawnIntervalMs = spawnTime * 1000;
        onBack();
    };

    return (
        <div className="options-container">
            <h2 className="options-title">Options</h2>

            <div className="options-row">
                <span className="options-label">Game session time</span>
                <div className="stepper-control">
                    <button className="stepper-button" onClick={handleSessionDecrease}>-</button>
                    <span className="stepper-value">{sessionTime} s</span>
                    <button className="stepper-button" onClick={handleSessionIncrease}>+</button>
                </div>
            </div>

            <div className="options-row">
                <span className="options-label">Enemy spawn time</span>
                <div className="stepper-control">
                    <button className="stepper-button" onClick={handleSpawnDecrease}>-</button>
                    <span className="stepper-value">{spawnTime} s</span>
                    <button className="stepper-button" onClick={handleSpawnIncrease}>+</button>
                </div>
            </div>

            <div className="options-footer">
                <Button label="MAIN MENU" onClick={handleSaveAndBack} variant="primary" />
            </div>
        </div>
    );
}