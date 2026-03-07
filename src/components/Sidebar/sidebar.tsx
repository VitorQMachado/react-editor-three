import { GameManager } from '@vmlibs/unit_three';
import "./styles.css";
import GameObjectsListComponent from '../Lists/GameObjectsList/gameObjectsList';

const SidebarComponent = ({ gameManager }: { gameManager?: GameManager }) => {
    return (
        <GameObjectsListComponent gameManager={gameManager} />
    )
}

export default SidebarComponent
