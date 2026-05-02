import { useEffect, useMemo, useState } from 'react';
import ComponentInputFactory from './ComponentInputFactory';
import { getOriginalPathForBlob } from '../../../services';
import { FollowMode, GameComponent, GameComponentNameEnum, IFactoryValue } from '@vmlibs/unit_three';
import './styles.css';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const INPUT_CALLBACK_REGISTRY_KEY = 'react-editor-three:input-callback-registry';
const DEFAULT_INPUT_CALLBACKS = ['onKeyDown', 'onKeyUp', 'onKeyPress', 'onMouseDown', 'onMouseUp', 'onMouseMove'];
const INPUT_EVENT_OPTIONS = ['mousemove', 'mousedown', 'mouseup', 'keypress', 'keydown', 'keyup'] as const;
type InputEventOption = (typeof INPUT_EVENT_OPTIONS)[number];

const loadCallbackRegistry = () => {
    try {
        const raw = localStorage.getItem(INPUT_CALLBACK_REGISTRY_KEY);
        if (!raw) {
            return [...DEFAULT_INPUT_CALLBACKS];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...DEFAULT_INPUT_CALLBACKS];
        }
        const unique = Array.from(new Set(parsed.map((item) => String(item || '').trim()).filter(Boolean)));
        return unique.length ? unique : [...DEFAULT_INPUT_CALLBACKS];
    } catch (_) {
        return [...DEFAULT_INPUT_CALLBACKS];
    }
};

const isRotationAxisItem = (name: string) => /rotation/i.test(name) && /\s[XYZ]$/i.test(name);

export const GameObjectComponent = ({ gameComponent: gameComponentProp }: { gameComponent: GameComponent }) => {
    const gameComponent = gameComponentProp as any;
    const [callbackRegistry, setCallbackRegistry] = useState<string[]>(() => loadCallbackRegistry());
    const [newCallbackName, setNewCallbackName] = useState('');
    const isInputComponent = gameComponent?.NAME === 'InputComponent';

    useEffect(() => {
        if (!isInputComponent) {
            return;
        }
        try {
            localStorage.setItem(INPUT_CALLBACK_REGISTRY_KEY, JSON.stringify(callbackRegistry));
        } catch (_) {
            // ignore local storage errors
        }
    }, [isInputComponent, callbackRegistry]);

    const callbackNameOptions = useMemo(() => callbackRegistry, [callbackRegistry]);

    const addCallbackToRegistry = () => {
        const normalized = newCallbackName.trim();
        if (!normalized) {
            return;
        }
        setCallbackRegistry((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
        setNewCallbackName('');
    };
    const factory = gameComponent?.Factory;
    const rawList: IFactoryValue[] = (factory?.valuesList || []).filter((item: IFactoryValue) => {
        const itemName = item.name || '';
        if (gameComponent.NAME !== 'CameraComponent') {
            if (gameComponent.NAME === 'InputComponent' && /^set\s*mapping$/i.test(itemName)) {
                // "Set Mapping" expects a runtime function reference and cannot be edited directly via inspector input.
                return false;
            }
            return true;
        }

        // Keep camera runtime toggles out of the inspector to avoid conflicting with play/editor flow.
        return !/^is\s*(alive|preview)$/i.test(itemName);
    });
    const lightTypeOptions = [
        'DirectionalLight',
        'PointLight',
        'SpotLight',
        'AmbientLight',
        'HemisphereLight',
        'RectAreaLight',
    ];
    const cameraFollowModeOptions: FollowMode[] = ['lookAt', 'follow'];

    const valuesList = rawList.map((item) => {
        const itemName = item.name || '';
        if (gameComponent.NAME === 'LightComponent' && /^Type$/i.test(itemName)) {
            const setLightType = (nextType: string) => {
                let updated = false;

                if (typeof item.setValue === 'function') {
                    item.setValue(nextType);
                    updated = true;
                }

                // Fallback for LightComponent implementations that expose mutable options but no setValue.
                const optionTargets = [
                    gameComponent?.options,
                    gameComponent?.Options,
                    gameComponent?.params,
                    gameComponent?.Params,
                    gameComponent?.data?.options,
                    gameComponent?.Data?.options,
                ];

                optionTargets.forEach((target) => {
                    if (target && typeof target === 'object' && 'type' in target) {
                        (target as any).type = nextType;
                        updated = true;
                    }
                });

                if (!updated) {
                    console.warn('[inspector-light] unable to set Light type: no writable setter/target found', {
                        itemName,
                        nextType,
                    });
                    return;
                }

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('transformControl-change');
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'type',
                    value: nextType,
                });
            };

            return {
                ...item,
                options: lightTypeOptions,
                optionLabels: lightTypeOptions,
                setValue: setLightType,
            };
        }

        if (gameComponent.NAME === 'CameraComponent' && /^follow\s*mode$/i.test(itemName)) {
            return {
                ...item,
                options: cameraFollowModeOptions,
                optionLabels: cameraFollowModeOptions,
                setValue: (nextMode: string) => {
                    item.setValue?.(nextMode);
                    const manager = gameComponent?.Manager;
                    manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                    manager?.emitter?.emit?.('component.updated', {
                        component: gameComponent?.NAME,
                        property: 'followMode',
                        value: nextMode,
                    });
                },
            };
        }

        if (gameComponent.NAME === 'SkyboxComponent' && /^Textures$/i.test(itemName)) {
            const setSkyboxTextures = (nextTextures: Record<string, string>) => {
                const runtimeTextures = Object.entries(nextTextures || {}).reduce(
                    (acc, [key, texturePath]) => {
                        acc[key] = String(texturePath || '');
                        return acc;
                    },
                    {} as Record<string, string>
                );

                console.log('[skybox] updated textures', {
                    gameObject: gameComponent?.Parent?.Name,
                    runtimeTextures,
                    sourceTextures: Object.entries(runtimeTextures).reduce(
                        (acc, [key, texturePath]) => {
                            acc[key] = getOriginalPathForBlob(texturePath);
                            return acc;
                        },
                        {} as Record<string, string>
                    ),
                });

                if (typeof item.setValue === 'function') {
                    item.setValue(runtimeTextures);
                }

                const params = gameComponent?.params || {};
                params.options = {
                    ...(params.options || {}),
                    textures: runtimeTextures,
                };
                if (!params.parentMesh && gameComponent?.Manager?.scene) {
                    params.parentMesh = gameComponent.Manager.scene;
                }

                if (typeof gameComponent?.loadSkybox === 'function') {
                    gameComponent.loadSkybox(params);
                }

                const manager = gameComponent?.Manager;
                // Do NOT emit 'transformControl-change' here: loadSkybox replaces the mesh,
                // so the old object is detached from the scene and TransformControls would
                // throw "The attached 3D object must be a part of the scene graph".
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'Textures',
                    value: Object.entries(runtimeTextures).reduce(
                        (acc, [key, texturePath]) => {
                            acc[key] = getOriginalPathForBlob(texturePath);
                            return acc;
                        },
                        {} as Record<string, string>
                    ),
                });
            };

            return {
                ...item,
                value: item.value || {},
                setValue: setSkyboxTextures,
            };
        }

        if (gameComponent.NAME === 'InputComponent' && /^Set Mapping By Name$/i.test(itemName)) {
            const setInputMappingByName = (nextMapping: any) => {
                const nextEvent = String(nextMapping?.event || 'keydown') as InputEventOption;
                const callbackName = String(nextMapping?.callbackName || callbackNameOptions[0] || '').trim();

                if (!callbackName) {
                    return;
                }

                setCallbackRegistry((prev) => (prev.includes(callbackName) ? prev : [...prev, callbackName]));

                item.setValue?.({
                    event: nextEvent,
                    callbackName,
                });

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'mappingByName',
                    value: { event: nextEvent, callbackName },
                });
            };

            return {
                ...item,
                value: item.value || { event: 'keydown', callbackName: callbackNameOptions[0] || '' },
                options: [...INPUT_EVENT_OPTIONS],
                optionLabels: [...INPUT_EVENT_OPTIONS],
                callbackOptions: callbackNameOptions,
                callbackOptionLabels: callbackNameOptions,
                setValue: setInputMappingByName,
            };
        }

        if (gameComponent.NAME === 'InputComponent' && /^Set Mapping By Component$/i.test(itemName)) {
            const componentNames = Object.values(GameComponentNameEnum).filter(
                (n) => n !== GameComponentNameEnum.InputComponent
            );

            const setInputMappingByComponent = (nextMapping: any) => {
                const nextEvent = String(nextMapping?.event || 'keydown') as InputEventOption;
                const componentName = String(nextMapping?.componentName || '').trim();
                const methodName = String(nextMapping?.methodName || '').trim();

                if (!componentName || !methodName) {
                    return;
                }

                item.setValue?.({ event: nextEvent, componentName, methodName });

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'mappingByComponent',
                    value: { event: nextEvent, componentName, methodName },
                });
            };

            return {
                ...item,
                value: item.value || { event: 'keydown', componentName: componentNames[0] || '', methodName: '' },
                options: [...INPUT_EVENT_OPTIONS],
                optionLabels: [...INPUT_EVENT_OPTIONS],
                componentOptions: componentNames,
                componentOptionLabels: componentNames,
                setValue: setInputMappingByComponent,
            };
        }

        const isColliderBoundField =
            /^Size [XYZ]$/i.test(itemName) || /^Radius$/i.test(itemName) || /^Offset [XYZ]$/i.test(itemName);
        if (gameComponent.NAME === 'ColliderComponent' && isColliderBoundField) {
            const autoSizeItem = rawList.find((v) => v.name === 'Auto Size');
            return {
                ...item,
                setValue: (value: any) => {
                    if (/^Size [XYZ]$/i.test(itemName) || /^Radius$/i.test(itemName)) {
                        autoSizeItem?.setValue?.(false);
                    }
                    item.setValue?.(value);
                    const manager = gameComponent?.Manager;
                    manager?.emitter?.emit?.('transformControl-change');
                    manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                },
            };
        }

        if (isRotationAxisItem(itemName)) {
            return {
                ...item,
                value: typeof item.value === 'number' ? item.value * RAD_TO_DEG : item.value,
                setValue:
                    typeof item.setValue === 'function' ? (deg: number) => item.setValue!(deg * DEG_TO_RAD) : undefined,
            };
        }

        return item;
    });

    const groupedRows: Array<{ type: 'single'; item: any } | { type: 'xyz'; label: string; x: any; y: any; z: any }> =
        [];

    const usedIndices = new Set<number>();

    valuesList.forEach((item, index) => {
        if (usedIndices.has(index)) {
            return;
        }

        const match = item.name?.match(/^(.*)\s([XYZ])$/i);
        if (!match) {
            groupedRows.push({ type: 'single', item });
            usedIndices.add(index);
            return;
        }

        const baseName = match[1].trim();
        const byAxis = { X: -1, Y: -1, Z: -1 };

        valuesList.forEach((candidate, candidateIndex) => {
            const axisMatch = candidate.name?.match(/^(.*)\s([XYZ])$/i);
            if (!axisMatch) return;

            const candidateBase = axisMatch[1].trim();
            const axis = axisMatch[2].toUpperCase() as 'X' | 'Y' | 'Z';

            if (candidateBase === baseName) {
                byAxis[axis] = candidateIndex;
            }
        });

        if (byAxis.X >= 0 && byAxis.Y >= 0 && byAxis.Z >= 0) {
            groupedRows.push({
                type: 'xyz',
                label: baseName,
                x: valuesList[byAxis.X],
                y: valuesList[byAxis.Y],
                z: valuesList[byAxis.Z],
            });
            usedIndices.add(byAxis.X);
            usedIndices.add(byAxis.Y);
            usedIndices.add(byAxis.Z);
            return;
        }

        groupedRows.push({ type: 'single', item });
        usedIndices.add(index);
    });

    return (
        <div key={`game-object-component-${gameComponent.NAME}`} className="inspector-component">
            <div className="inspector-component__title">{gameComponent.NAME}</div>
            {isInputComponent && (
                <div className="inspector-callback-registry">
                    <div className="inspector-callback-registry__title">Callback Registry</div>
                    <div className="inspector-callback-registry__controls">
                        <input
                            className="inspector-input"
                            type="text"
                            placeholder="callback name (example: onPlayerMove)"
                            value={newCallbackName}
                            onChange={(e) => setNewCallbackName(e.target.value)}
                        />
                        <button
                            className="inspector-callback-registry__add"
                            type="button"
                            onClick={addCallbackToRegistry}
                        >
                            Add
                        </button>
                    </div>
                    <div className="inspector-callback-registry__list">
                        {callbackNameOptions.map((name) => (
                            <span key={name} className="inspector-callback-registry__item">
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <div className="inspector-component__fields">
                {groupedRows.map((row) => {
                    if (row.type === 'single') {
                        return (
                            <div key={row.item.name} className="inspector-component__field">
                                <label className="inspector-component__field-label">{row.item.name}</label>
                                <ComponentInputFactory item={row.item} />
                            </div>
                        );
                    }

                    return (
                        <div key={row.label} className="inspector-component__field inspector-component__field--xyz">
                            <label className="inspector-component__field-label">{row.label}</label>
                            <div className="inspector-component__xyz-inputs">
                                <div className="inspector-component__xyz-input">
                                    <label className="inspector-vector-inputs__label">X</label>
                                    <ComponentInputFactory item={row.x} />
                                </div>
                                <div className="inspector-component__xyz-input">
                                    <label className="inspector-vector-inputs__label">Y</label>
                                    <ComponentInputFactory item={row.y} />
                                </div>
                                <div className="inspector-component__xyz-input">
                                    <label className="inspector-vector-inputs__label">Z</label>
                                    <ComponentInputFactory item={row.z} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
