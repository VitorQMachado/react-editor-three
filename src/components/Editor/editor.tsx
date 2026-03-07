import { useState } from 'react';
import { GameManager, THREE } from "@vmlibs/unit_three";
import SidebarComponent from '../Sidebar/sidebar';
import "./styles.css"
import { GameScreenComponent } from '../GameScreen/game-screen';

export const Editor = () => {
    const [gameManager, setGameManager] = useState<GameManager>();

    const handleOnGameLoad = (gameManager: GameManager) => {
        setGameManager(gameManager);
        const axesHelper = new THREE.AxesHelper( 5 );
        gameManager?.scene.add( axesHelper );
    }

	return (
        <div className="editor-container">
            <SidebarComponent gameManager={gameManager} />
            <GameScreenComponent onGameLoad={handleOnGameLoad} isEditor/>
        </div>
    );
}
