import { GameComponent, GameManager, GameObject } from '@vmlibs/unit_three'
import { useEffect, useState } from 'react';
import { GameObjectComponent } from '../../GameObjectComponents/GameObjectComponent/GameObjectComponent';

export const GameObjectComponentsList = ({ gameManager }: { gameManager: GameManager }) => {
    const [selectedGameObject, setSelectedGameObject] = useState<GameObject | undefined>();
    const [components, setComponents] = useState<GameComponent[] | []>([]);

    useEffect(() => {
        if(!gameManager) {
            return;
        }

        const { emitter } = gameManager;
        emitter.on("selectedGameObject", (gameObject) => {
            console.log("🚀 ~ GameObjectComponentsList ~ gameObjectName:", gameObject)
            setSelectedGameObject(gameObject);
            setComponents(gameObject.GetComponents());
        })
    }, []);

    const onSelectItem = (gameObjectName: string) => {
        console.log("🚀 ~ onSelectGameObject ~ gameObjectName:", gameObjectName)
        // gameManager?.SelectGameObjectByName(gameObjectName);
    }


    return (
        <div
            key={`game-object-list-${selectedGameObject?.Name}`}
            className={`game-object-item`}
            onClick={(e) => {
                e.stopPropagation();
                onSelectItem(selectedGameObject?.Name || "");
            }}
        >
            <label>{selectedGameObject?.Name}</label>
            {
                components && (
                    <div className="game-object-children-items">
                        {
                            components.map(component => (
                                <GameObjectComponent key={`game-object-component-${component.NAME}`} component={component} />
                            ))
                        }
                    </div>
                )
            }
        </div>
    )
}
