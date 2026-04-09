import { GameManager, GameObject } from '@vmlibs/unit_three'
import { useEffect, useState } from 'react'
import { loadeGameObjects } from '../../../services';
import "./styles.css";

const GameObjectsListComponent = ({ gameManager }: { gameManager?: GameManager }) => {
    const [gameInitiated, setGameInitiated] = useState(false);
    const [gameObjects, setGameObjects] = useState([]);
    const [selectedGameObjectName, setSelectedGameObjectName] = useState<string | undefined>();

    useEffect(() => {
        console.log("🚀 ~ GameObjectsListComponent ~ gameManager:", gameManager)
        if(!gameInitiated && !gameManager) {
            return;
        }
        setGameInitiated(true);

        loadeGameObjects('wargame').then(data => {
            data && gameManager?.LoadGameObjectsMap(data);
        });

        const { emitter } = gameManager;

        emitter.on("updatedGameObject", () => {
            console.log("🚀 ~ GameObjectsListComponent ~ gameObjects:", gameManager?.GetGameObjects())
            setGameObjects(gameManager?.GetGameObjects());
        });

        emitter.on("selectedGameObject", (gameObject) => {
            const gameObjectName = gameObject?.Name;
            console.log("🚀 ~ GameObjectsListComponent ~ gameObjectName:", gameObject, gameObjectName)
            setSelectedGameObjectName(gameObjectName);
        });

        emitter.on("clicked-raycaster", ({ intersects }) => {
            console.log("🚀 ~ GameObjectsListComponent ~ intersects:",
                intersects.filter(o => o.object.type === 'Mesh').sort((o1, o2) => o1.distance - o2.distance)
            )
        })
    }, []);

    const onSelectGameObject = (gameObjectName: string) => {
        console.log("🚀 ~ onSelectGameObject ~ gameObjectName:", gameObjectName)
        gameManager?.SelectGameObjectByName(gameObjectName);
    }

    const renderGameObject = (gameObject: GameObject) => {
        const children = gameObject?.Children;
        return (
            <div
                key={`game-object-list-${gameObject.Name}`}
                className={`game-object-item ${selectedGameObjectName === gameObject.Name ? 'selected' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectGameObject(gameObject.Name);
                }}
            >
                <span className="game-object-item__name">{gameObject.Name}</span>
                {children && (
                    <div className="game-object-children-items">
                        {children.map((childGameObject) => renderGameObject(childGameObject))}
                    </div>
                )}
            </div>
        )
    }


    return (
        <div className="game-objects-list">{gameObjects?.map((gameObject) => renderGameObject(gameObject))}</div>
    )
}

export default GameObjectsListComponent
