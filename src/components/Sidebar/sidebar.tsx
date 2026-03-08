import { GameManager } from '@vmlibs/unit_three';
import "./styles.css";
import GameObjectsListComponent from '../Lists/GameObjectsList/gameObjectsList';
import { GameObjectComponentsList } from '../Lists/GameObjectComponentsList/gameObjectComponentsList';

const SidebarComponent = ({ gameManager }: { gameManager?: GameManager }) => {
    return gameManager && (
        <div>
            <GameObjectsListComponent gameManager={gameManager} />
            <GameObjectComponentsList gameManager={gameManager}/>
        </div>
    )
}

export default SidebarComponent
