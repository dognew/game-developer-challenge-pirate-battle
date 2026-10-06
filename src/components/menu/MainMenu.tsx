import { useState } from 'react';
import { PanelModal } from '../ui/PanelModal';
import { Button } from '../ui/Button';
import { Options } from './Options';
import './MainMenu.css';

interface MainMenuProps {
    onPlay: () => void;
}

type MenuTab = 'home' | 'options' | 'ranking' | 'history';

/**
 * Main Menu Component
 * Handles the internal routing for the menu tabs and delegates the 'Play' action to the parent App.
 */
export function MainMenu({ onPlay }: MainMenuProps) {
    const [currentTab, setCurrentTab] = useState<MenuTab>('home');

    const renderContent = () => {
        switch (currentTab) {
            case 'options':
                return <Options onBack={() => setCurrentTab('home')} />;
                
            case 'ranking':
                return (
                    <div className="main-menu-content" style={{ color: '#fff' }}>
                        <h2 style={{ marginBottom: '20px' }}>Ranking</h2>
                        <p style={{ marginBottom: '30px' }}>Coming soon...</p>
                        <Button label="MAIN MENU" onClick={() => setCurrentTab('home')} />
                    </div>
                );
                
            case 'history':
                return (
                    <div className="main-menu-content" style={{ color: '#fff' }}>
                        <h2 style={{ marginBottom: '20px' }}>Match History</h2>
                        <p style={{ marginBottom: '30px' }}>Coming soon...</p>
                        <Button label="MAIN MENU" onClick={() => setCurrentTab('home')} />
                    </div>
                );
                
            case 'home':
            default:
                return (
                    <div className="main-menu-buttons">
                        {/* Ao clicar, chama a função que altera o appState no App.tsx */}
                        <Button label="PLAY" onClick={onPlay} />
                        <Button label="OPTIONS" onClick={() => setCurrentTab('options')} />
                        
                        <div className="main-menu-secondary">
                            <Button label="RANKING" onClick={() => setCurrentTab('ranking')} variant="secondary" />
                            <Button label="MATCH HISTORY" onClick={() => setCurrentTab('history')} variant="secondary" />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="main-menu-background">
            <PanelModal>
                <div className="main-menu-content">
                    <img 
                        src="/assets/png/default/ui/menu/title_pirate_battle.png" 
                        alt="Pirate Battle" 
                        className="main-menu-logo" 
                    />
                    {renderContent()}
                </div>
            </PanelModal>
        </div>
    );
}