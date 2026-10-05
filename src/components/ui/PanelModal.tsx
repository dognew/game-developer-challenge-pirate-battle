import './PanelModal.css';

interface PanelModalProps {
    title: string;
    description: string;
    children?: React.ReactNode; // Permite injetar botões ou outros elementos opcionalmente
}

export function PanelModal({ title, description, children }: PanelModalProps) {
    return (
        <div className="panel-overlay">
            <div className="game-panel">
                <h2>{title}</h2>
                <p>{description}</p>
                {children}
            </div>
        </div>
    );
}