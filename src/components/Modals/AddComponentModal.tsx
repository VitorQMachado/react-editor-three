import {
    GameComponentName,
    GameComponentNameEnum,
    GameManager,
    GameObject,
    IGameCameraComponent,
} from '@vmlibs/unit_three';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type ComponentName = GameComponentName | '';

const ALL_COMPONENTS: { name: GameComponentName; label: string; description: string }[] = [
    { name: GameComponentNameEnum.MeshComponent, label: 'Mesh', description: 'Renders a 3D mesh in the scene' },
    { name: GameComponentNameEnum.LightComponent, label: 'Light', description: 'Adds a light source to the scene' },
    {
        name: GameComponentNameEnum.InputComponent,
        label: 'Input',
        description: 'Maps keyboard and mouse events to gameplay callbacks',
    },
    { name: GameComponentNameEnum.SkyboxComponent, label: 'Skybox', description: 'Applies a skybox environment' },
    { name: GameComponentNameEnum.GrassComponent, label: 'Grass', description: 'Renders procedural grass geometry' },
    {
        name: GameComponentNameEnum.RigidBodyComponent,
        label: 'RigidBody',
        description: 'Adds physics body properties like velocity and gravity',
    },
    {
        name: GameComponentNameEnum.ColliderComponent,
        label: 'Collider',
        description: 'Adds collision shape for physics interaction',
    },
    {
        name: GameComponentNameEnum.CameraComponent,
        label: 'Game Camera',
        description: 'Controls runtime scene view and play mode camera behavior',
    },
];

type AddComponentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    gameManager: GameManager;
};

export const AddComponentModal = ({
    isOpen,
    onClose,
    gameManager,
}: AddComponentModalProps): React.ReactElement | null => {
    const [search, setSearch] = useState('');
    const [selectedGameObject, setSelectedGameObject] = useState<GameObject | undefined>();
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!gameManager) {
            return;
        }

        const onSelectedGameObject = (gameObject: GameObject) => {
            setSelectedGameObject(gameObject);
        };

        gameManager.emitter.on('selectedGameObject', onSelectedGameObject);
        return () => {
            gameManager.emitter.off?.('selectedGameObject', onSelectedGameObject);
        };
    }, [gameManager]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setSearch('');
        const timer = window.setTimeout(() => searchRef.current?.focus(), 50);
        return () => window.clearTimeout(timer);
    }, [isOpen]);

    const filteredComponents = useMemo(
        () =>
            ALL_COMPONENTS.filter(
                (c) =>
                    c.label.toLowerCase().includes(search.toLowerCase()) ||
                    c.description.toLowerCase().includes(search.toLowerCase())
            ),
        [search]
    );

    const handleAddComponent = (componentName: ComponentName) => {
        if (!selectedGameObject) {
            return;
        }

        const defaultOptionsByComponent: Partial<
            Record<ComponentName, Partial<IGameCameraComponent> | Record<string, unknown>>
        > = {
            SkyboxComponent: {
                texture: '',
                size: 150,
                position: { x: 0, y: 0, z: 0 },
            },
            CameraComponent: {
                isAlive: false,
                isPreview: true,
                followMode: 'lookAt',
                lookAtTarget: '',
                options: {
                    cameraTargetDistance: 10,
                    position: { x: 0, y: 0, z: 10 },
                },
            } as Partial<IGameCameraComponent>,
        };

        const componentData = defaultOptionsByComponent[componentName] || {};
        gameManager.AddGameComponent(componentName, componentData, selectedGameObject);

        if (componentName === 'CameraComponent') {
            const targetCamera = selectedGameObject.GetComponent('CameraComponent');
            const allCameras = gameManager.CameraComponents || [];
            allCameras.forEach((cameraComp) => {
                if (cameraComp === targetCamera) {
                    cameraComp?.setPreview?.(true);
                } else {
                    cameraComp?.setPreview?.(false);
                }
            });
        }

        gameManager.SelectGameObjectByName(selectedGameObject.Name);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="add-component-overlay" onClick={onClose}>
            <div
                className="add-component-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Add Component"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="add-component-modal__header">
                    <span className="add-component-modal__title">Add Component</span>
                    <button type="button" className="add-component-modal__close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="add-component-modal__search-wrap">
                    <input
                        ref={searchRef}
                        className="add-component-modal__search"
                        type="text"
                        placeholder="Search components..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <ul className="add-component-modal__list">
                    {filteredComponents.length === 0 && (
                        <li className="add-component-modal__empty">No components found.</li>
                    )}
                    {filteredComponents.map((item) => (
                        <li key={item.name}>
                            <button
                                type="button"
                                className="add-component-modal__item"
                                onClick={() => handleAddComponent(item.name)}
                            >
                                <span className="add-component-modal__item-label">{item.label}</span>
                                <span className="add-component-modal__item-desc">{item.description}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
