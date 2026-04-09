import { EventBus, GameComponent, GameComponentName, GameManager, GameObject, IGameObjectUpdatedPayload } from '@vmlibs/unit_three'
import { useEffect, useRef, useState } from 'react';
import { GameObjectComponent } from '../../GameObjectComponents/GameObjectComponent/GameObjectComponent';

const ALL_COMPONENTS: { name: GameComponentName; label: string; description: string }[] = [
    { name: 'MeshComponent',    label: 'Mesh',    description: 'Renders a 3D mesh in the scene' },
    { name: 'LightComponent',   label: 'Light',   description: 'Adds a light source to the scene' },
    { name: 'SkyboxComponent',  label: 'Skybox',  description: 'Applies a skybox environment' },
    { name: 'GrassComponent',   label: 'Grass',   description: 'Renders procedural grass geometry' },
];

export const GameObjectComponentsList = ({ gameManager }: { gameManager: GameManager }) => {
    const [selectedGameObject, setSelectedGameObject] = useState<GameObject | undefined>();
    const [components, setComponents] = useState<GameComponent[] | []>([]);
    const [nameValue, setNameValue] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!gameManager) {
            return;
        }

        const { emitter } = gameManager;
        emitter.on('selectedGameObject', (gameObject) => {
            setSelectedGameObject(gameObject);
            setComponents(gameObject?.GetComponents?.() || []);
            setNameValue(gameObject?.Name || '');
        });

        const sub = EventBus.streamTo('gameObject.updated').subscribe((payload: IGameObjectUpdatedPayload) => {
            setComponents(payload.gameObject?.GetComponents() || []);
        });

        return () => sub.unsubscribe();
    }, [gameManager]);

    const openModal = () => {
        setSearch('');
        setModalOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    const closeModal = () => setModalOpen(false);

    const handleAddComponent = (componentName: GameComponentName) => {
        if (!selectedGameObject) return;
        gameManager.AddGameComponent(componentName, {}, selectedGameObject);
        setComponents(selectedGameObject.GetComponents?.() || []);
        closeModal();
    };

    const filteredComponents = ALL_COMPONENTS.filter(
        (c) =>
            c.label.toLowerCase().includes(search.toLowerCase()) ||
            c.description.toLowerCase().includes(search.toLowerCase())
    );

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

    if (!selectedGameObject) {
        return <div className="inspector-empty">Select a GameObject to inspect and edit it.</div>;
    }

    return (
        <>
            <div key={`game-object-list-${selectedGameObject.Name}`} className="inspector-object">
                <div className="inspector-object__header">
                    <label className="inspector-object__label" htmlFor="selected-game-object-name">Name</label>
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
                </div>

                <button type="button" className="inspector-object__add-component" onClick={openModal}>
                    Add Component
                </button>

                <div className="inspector-object__components">
                    {components.map((component) => (
                        <GameObjectComponent key={`game-object-component-${component.NAME}`} gameComponent={component} />
                    ))}
                </div>
            </div>

            {modalOpen && (
                <div className="add-component-overlay" onClick={closeModal}>
                    <div
                        className="add-component-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Add Component"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="add-component-modal__header">
                            <span className="add-component-modal__title">Add Component</span>
                            <button type="button" className="add-component-modal__close" onClick={closeModal} aria-label="Close">✕</button>
                        </div>

                        <div className="add-component-modal__search-wrap">
                            <input
                                ref={searchRef}
                                className="add-component-modal__search"
                                type="text"
                                placeholder="Search components…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <ul className="add-component-modal__list">
                            {filteredComponents.length === 0 && (
                                <li className="add-component-modal__empty">No components found.</li>
                            )}
                            {filteredComponents.map((c) => (
                                <li key={c.name}>
                                    <button
                                        type="button"
                                        className="add-component-modal__item"
                                        onClick={() => handleAddComponent(c.name)}
                                    >
                                        <span className="add-component-modal__item-label">{c.label}</span>
                                        <span className="add-component-modal__item-desc">{c.description}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    )
}
