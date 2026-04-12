import { EventBus } from '@vmlibs/unit_three'
import { useEffect, useRef, useState } from 'react';
import { GameObjectComponent } from '../../GameObjectComponents/GameObjectComponent/GameObjectComponent';

type ComponentName = 'MeshComponent' | 'LightComponent' | 'SkyboxComponent' | 'GrassComponent' | 'RigidBodyComponent' | 'ColliderComponent' | '';
type GameManagerLike = any;
type GameObjectLike = any;
type GameComponentLike = any;

const ALL_COMPONENTS: { name: ComponentName; label: string; description: string }[] = [
    { name: 'MeshComponent',    label: 'Mesh',    description: 'Renders a 3D mesh in the scene' },
    { name: 'LightComponent',   label: 'Light',   description: 'Adds a light source to the scene' },
    { name: 'SkyboxComponent',  label: 'Skybox',  description: 'Applies a skybox environment' },
    { name: 'GrassComponent',   label: 'Grass',   description: 'Renders procedural grass geometry' },
    { name: 'RigidBodyComponent', label: 'RigidBody', description: 'Adds physics body properties like velocity and gravity' },
    { name: 'ColliderComponent',  label: 'Collider',  description: 'Adds collision shape for physics interaction' },
];

type ComponentEventLog = {
    id: string;
    category: 'collision' | 'component';
    label: string;
    detail: string;
    time: string;
};

export const GameObjectComponentsList = ({ gameManager }: { gameManager: GameManagerLike }) => {
    const [selectedGameObject, setSelectedGameObject] = useState<GameObjectLike | undefined>();
    const [components, setComponents] = useState<GameComponentLike[] | []>([]);
    const [nameValue, setNameValue] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [eventLogs, setEventLogs] = useState<ComponentEventLog[]>([]);
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

        const sub = EventBus.streamTo('gameObject.updated').subscribe((payload: any) => {
            setComponents(payload.gameObject?.GetComponents() || []);
        });

        return () => sub.unsubscribe();
    }, [gameManager]);

    useEffect(() => {
        const pushEvent = (entry: Omit<ComponentEventLog, 'id' | 'time'>) => {
            setEventLogs((prev) => [
                {
                    ...entry,
                    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                    time: new Date().toLocaleTimeString()
                },
                ...prev
            ].slice(0, 50));
        };

        const collisionSub = EventBus.streamTo('collision').subscribe((payload: any) => {
            const event = payload?.event || 'collision';
            const selfName = payload?.self?.Name || 'Unknown';
            const otherName = payload?.gameObject?.Name || payload?.other?.Parent?.Name || 'Unknown';
            pushEvent({ category: 'collision', label: `${selfName} → ${otherName}`, detail: event });
        });

        const componentSub = EventBus.streamTo('component.updated').subscribe((payload: any) => {
            const component = payload?.component || 'Unknown';
            const property = payload?.property || '';
            const raw = payload?.value;
            const detail = raw === null || raw === undefined
                ? 'null'
                : typeof raw === 'object'
                    ? JSON.stringify(raw)
                    : String(raw);
            pushEvent({ category: 'component', label: `${component}`, detail: property ? `${property}: ${detail}` : detail });
        });

        return () => {
            collisionSub.unsubscribe();
            componentSub.unsubscribe();
        };
    }, []);

    const openModal = () => {
        setSearch('');
        setModalOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    const closeModal = () => setModalOpen(false);

    const handleAddComponent = (componentName: ComponentName) => {
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

                <div className="inspector-event-log">
                    <div className="inspector-event-log__header">
                        <span>Component Events</span>
                        <button
                            type="button"
                            className="inspector-event-log__clear"
                            onClick={() => setEventLogs([])}
                        >
                            Clear
                        </button>
                    </div>

                    {eventLogs.length === 0 ? (
                        <div className="inspector-event-log__empty">No events yet.</div>
                    ) : (
                        <div className="inspector-event-log__list">
                            {eventLogs.map((log) => (
                                <div key={log.id} className="inspector-event-log__item">
                                    <span className={`inspector-event-log__badge inspector-event-log__badge--${log.category}`}>
                                        {log.category}
                                    </span>
                                    <div className="inspector-event-log__label">{log.label}</div>
                                    <div className="inspector-event-log__detail">{log.detail}</div>
                                    <div className="inspector-event-log__time">{log.time}</div>
                                </div>
                            ))}
                        </div>
                    )}
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
