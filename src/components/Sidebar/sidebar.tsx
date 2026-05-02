import { GameManager } from '@vmlibs/unit_three';
import './styles.css';
import GameObjectsListComponent from '../Lists/GameObjectsList/gameObjectsList';
import { GameObjectComponentsList } from '../Lists/GameObjectComponentsList/gameObjectComponentsList';
import { SidebarHeader } from './SidebarHeader/sidebarHeader';

const SidebarComponent = ({
    gameManager,
    isPlaying = false,
    onTogglePlay,
}: {
    gameManager?: GameManager;
    isPlaying?: boolean;
    onTogglePlay?: () => void;
}) => {
    return (
        gameManager && (
            <aside className="sidebar">
                <SidebarHeader gameManager={gameManager} isPlaying={isPlaying} onTogglePlay={onTogglePlay} />

                <section className="sidebar__panel sidebar__panel--inspector">
                    <h3 className="sidebar__panel-title">Inspector</h3>
                    <GameObjectComponentsList gameManager={gameManager} />
                </section>

                <section className="sidebar__panel">
                    <h3 className="sidebar__panel-title">Game Objects</h3>
                    <GameObjectsListComponent gameManager={gameManager} />
                </section>
            </aside>
        )
    );
};

export default SidebarComponent;
