import { useState, useEffect } from 'react';

export function useOrientation(): boolean {
    const [isLandscape, setIsLandscape] = useState<boolean>(
        window.matchMedia('(orientation: landscape)').matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(orientation: landscape)');
        
        const handleChange = (event: MediaQueryListEvent) => {
            setIsLandscape(event.matches);
        };

        // Modern event listener for media queries
        mediaQuery.addEventListener('change', handleChange);

        // Cleanup on unmount
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return isLandscape;
}