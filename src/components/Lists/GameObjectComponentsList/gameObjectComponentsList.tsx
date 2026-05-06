import {
    EventStream,
    GameComponent,
    GameManager,
    GameObject,
    IGameObjectUpdatedPayload,
} from '@vmlibs/unit_three';
import { useEffect, useState } from 'react';
import { GameObjectComponent } from '../../GameObjectComponent/GameObjectComponent';
import { AddComponentModal } from '../../Modals/AddComponentModal';
import { ComponentEventLogSection } from './ComponentEventLogSection';

export const GameObjectComponentsList = ({ gameManager }: { gameManager: GameManager }) => {
    const [selectedGameObject, setSelectedGameObject] = useState<GameObject | undefined>();
    const [components, setComponents] = useState<GameComponent[]>([]);
    const [nameValue, setNameValue] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!gameManager) {
            return;
        }

        const { emitter } = gameManager;
        emitter.on('selectedGameObject', (gameObject) => {
            setSelectedGameObject(gameObject);
            setComponents((gameObject?.GetComponents?.() || []) as unknown as GameComponent[]);
            setNameValue(gameObject?.Name || '');
        });

        const sub = EventStream.streamTo('gameObject.updated').subscribe((payload: IGameObjectUpdatedPayload) => {
            setComponents((payload.gameObject?.GetComponents() || []) as unknown as GameComponent[]);
        });

        return () => sub.unsubscribe();
    }, [gameManager]);

    const openModal = () => {
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const applyNameChange = () => {
        const currentName = selectedGameObject?.Name;
        const nextName = nameValue.trim();

        if (!currentName || !nextName || nextName === currentName) {
            setNameValue(currentName || '');
            return;
        }

        gameManager.UpdateGameObjectValue(currentName, { refKey: 'name', value: nextName });
        gameManager.SelectGameObjectByName(nextName);
    };

    const handleDeleteSelectedGameObject = () => {
        const currentName = selectedGameObject?.Name;
        if (!currentName) return;
        gameManager.RemoveGameObject(currentName);
        setSelectedGameObject(undefined);
        setComponents([]);
        setNameValue('');
    };

    if (!selectedGameObject) {
        return <div className="inspector-empty">Select a GameObject to inspect and edit it.</div>;
    }

    return (
        <>
            <div key={`game-object-list-${selectedGameObject.Name}`} className="inspector-object">
                <div className="inspector-object__header">
                    <label className="inspector-object__label" htmlFor="selected-game-object-name">
                        Name
                    </label>
                    <input
                        id="selected-game-object-name"
                        className="inspector-object__name-input"
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onBlur={applyNameChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') applyNameChange();
                        }}
                    />
                    <button
                        type="button"
                        className="inspector-object__delete"
                        onClick={handleDeleteSelectedGameObject}
                        title={`Delete ${selectedGameObject.Name}`}
                    >
                        ❌
                    </button>
                </div>

                <button type="button" className="inspector-object__add-component" onClick={openModal}>
                    Add Component
                </button>

                <div className="inspector-object__components">
                    {components.map((component) => (
                        <GameObjectComponent
                            key={`game-object-component-${component.NAME}`}
                            gameComponent={component}
                        />
                    ))}
                </div>

                <ComponentEventLogSection />
            </div>

            <AddComponentModal
                isOpen={modalOpen}
                onClose={closeModal}
                gameManager={gameManager}
            />
        </>
    );
};
