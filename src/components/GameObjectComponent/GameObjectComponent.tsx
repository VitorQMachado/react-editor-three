import { useState } from 'react';
import { GameComponent } from '@vmlibs/unit_three';
import { GroupedFactoryFields } from '../InputFactory/GroupedFactoryFields';
import './styles.css';

export const GameObjectComponent = ({ gameComponent: gameComponentProp }: { gameComponent: GameComponent }) => {
    const gameComponent = gameComponentProp as any;
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div key={`game-object-component-${gameComponent.NAME}`} className="inspector-component">
            <button
                type="button"
                className="inspector-component__toggle"
                onClick={() => setIsCollapsed((prev) => !prev)}
                aria-expanded={!isCollapsed}
            >
                <span className="inspector-component__title">{gameComponent.NAME}</span>
                <span className={`inspector-component__chevron ${isCollapsed ? 'is-collapsed' : ''}`}>▾</span>
            </button>

            {!isCollapsed && (
                <>
                    <div className="inspector-component__fields">
                        <GroupedFactoryFields gameComponent={gameComponent} />
                    </div>
                </>
            )}
        </div>
    );
};
