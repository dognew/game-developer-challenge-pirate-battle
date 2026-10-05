import './PanelModal.css';

interface PanelModalProps {
    title?: string;
    description?: string;
    children?: React.ReactNode;
}

/**
 * Reusable Panel Modal.
 * Renders a wooden panel overlay. Title and description are optional, 
 * allowing it to act as a wrapper for complex UI like the Main Menu.
 */
export function PanelModal({ title, description, children }: PanelModalProps) {
    return (
        <div className="panel-overlay">
            <div className="game-panel">
                {title && <h2>{title}</h2>}
                {description && <p>{description}</p>}
                {children}
            </div>
        </div>
    );
}