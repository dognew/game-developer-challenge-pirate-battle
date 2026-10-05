import { useState, useEffect } from 'react';
import { useOrientation } from './hooks/useOrientation';
import { PanelModal } from './components/ui/PanelModal';
import { Button } from './components/ui/Button';
import './index.css';
import { MainMenu } from './components/menu/MainMenu';

export default function App() {
  const isLandscape = useOrientation();
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState<boolean>(false);

  // Monitor fullscreen exits (e.g., user pressing ESC) to restore the modal
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

  // Guard clause 1: Block rendering and show a warning if in portrait mode.
  // Relies on PanelModal without children to enforce the orientation rule.
  if (!isLandscape) {
    return (
      <PanelModal 
        title="Rotate your device" 
        description="Pirate Battle requires landscape mode to play." 
      />
    );
  }

  // Guard clause 2: Force fullscreen interaction before loading the game
  if (!hasEnteredFullscreen) {
    const handleAcceptFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          // Note: Fullscreen API might reject or be unsupported (e.g., iOS Safari)
          await document.documentElement.requestFullscreen();
        }
        setHasEnteredFullscreen(true);
      } catch (error) {
        console.warn("Fullscreen API is not supported or was blocked by the browser.", error);
        // Fallback: Proceed to the game anyway to prevent soft-locking mobile users
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

  // Main application state (Ready to load Menus and PixiJS)
  return (
    <div className="app-container">
      <MainMenu />
    </div>
  );
}