import './Button.css';

/**
 * Reusable Button component for the game UI.
 * Encapsulates the visual states (normal/hover/pressed) and exposes standard click events.
 */
interface ButtonProps {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
    return (
        <button 
            className={`game-button ${variant}`} 
            onClick={onClick}
            type="button"
        >
            {label}
        </button>
    );
}