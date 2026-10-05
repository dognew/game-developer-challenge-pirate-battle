import { useState } from 'react';
import { PanelModal } from '../ui/PanelModal';
import { Button } from '../ui/Button';
import { Options } from './Options';
import './MainMenu.css';

// Defines the possible states (views) for the menu router
type MenuTab = 'home' | 'options' | 'ranking' | 'history';

export function MainMenu() {
    const [currentTab, setCurrentTab] = useState<MenuTab>('home');

    // State machine to render the correct component inside the panel
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
                        {/* The PLAY button will eventually trigger the GameEngine mount */}
                        <Button label="PLAY" onClick={() => console.log('Initialize GameEngine')} />
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
                    {/* The logo is shared across all tabs and sits at the top of the panel */}
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