import { useState, useEffect } from 'react';
import { useOrientation } from './hooks/useOrientation';
import { PanelModal } from './components/ui/PanelModal';
import { Button } from './components/ui/Button';
import { MainMenu } from './components/menu/MainMenu';
import { GameScreen } from './game/GameScreen'; // Caminho corrigido conforme sua instrução
import './index.css';

export default function App() {
  const isLandscape = useOrientation();
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState<boolean>(false);
  
  // Controls the main routing of the application
  const [appState, setAppState] = useState<'menu' | 'playing'>('menu');

  // Monitor fullscreen exits to restore the modal
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setHasEnteredFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Guard clause 1: Orientation Warning
  if (!isLandscape) {
    return (
      <PanelModal 
        title="Rotate your device" 
        description="Pirate Battle requires landscape mode to play." 
      />
    );
  }

  // Guard clause 2: Fullscreen Request
  if (!hasEnteredFullscreen) {
    const handleAcceptFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
        setHasEnteredFullscreen(true);
      } catch (error) {
        console.warn("Fullscreen API is not supported or was blocked by the browser.", error);
        setHasEnteredFullscreen(true);
      }
    };

    return (
      <PanelModal 
        title="Enter Fullscreen" 
        description="For the best experience, Pirate Battle requires fullscreen mode to prevent layout issues."
      >
        <Button label="Enter Game" onClick={handleAcceptFullscreen} />
      </PanelModal>
    );
  }

  // Main application state router
  return (
    <div className="app-container">
      {appState === 'menu' ? (
        <MainMenu onPlay={() => setAppState('playing')} />
      ) : (
        <GameScreen onExit={() => setAppState('menu')} />
      )}
    </div>
  );
}