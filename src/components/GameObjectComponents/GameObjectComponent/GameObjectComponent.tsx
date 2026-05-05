import { useEffect, useMemo, useState } from 'react';
import { getOriginalPathForBlob } from '../../../services';
import { FollowMode, GameComponent, GameComponentNameEnum, IFactoryValue } from '@vmlibs/unit_three';
import { GroupedFactoryFields } from './GroupedFactoryFields';
import { InputActionsModal } from './InputActionsModal';
import {
    ACTION_PHASE_OPTIONS,
    CAMERA_FOLLOW_MODE_OPTIONS,
    COMPONENT_METHOD_BLACKLIST,
    DEFAULT_INPUT_ACTIONS,
    DEG_TO_RAD,
    LIGHT_TYPE_OPTIONS,
    RAD_TO_DEG,
} from './constants';
import { buildGroupedFactoryRows, isRotationAxisItem } from './helpers';
import './styles.css';

export const GameObjectComponent = ({ gameComponent: gameComponentProp }: { gameComponent: GameComponent }) => {
    const gameComponent = gameComponentProp as any;
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [registeredActionCallbackNames, setRegisteredActionCallbackNames] = useState<string[]>([]);
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [inputEventLogs, setInputEventLogs] = useState<Array<{ id: string; label: string; detail: string; time: string }>>(
        []
    );
    const [actionMapsState, setActionMapsState] = useState<any[]>(() => {
        if (!Array.isArray(gameComponent?.ActionMaps)) {
            return [];
        }
        return gameComponent.ActionMaps;
    });
    const isInputComponent = gameComponent?.NAME === 'InputComponent';

    const pushInputEventLog = (label: string, detail: string) => {
        setInputEventLogs((prev) =>
            [
                {
                    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                    label,
                    detail,
                    time: new Date().toLocaleTimeString(),
                },
                ...prev,
            ].slice(0, 30)
        );
    };

    useEffect(() => {
        if (!Array.isArray(gameComponent?.ActionMaps)) {
            setActionMapsState([]);
            return;
        }
        setActionMapsState(gameComponent.ActionMaps);
    }, [gameComponent]);

    useEffect(() => {
        if (!isInputComponent) {
            return;
        }

        const emitter = gameComponent?.Manager?.emitter;
        if (!emitter?.on) {
            return;
        }

        const onComponentUpdated = (payload: any) => {
            if (payload?.component !== 'InputComponent') {
                return;
            }

            const property = String(payload?.property || 'updated');
            if (!/dispatchRegisteredEvent|actionCallbackByName|actionCallbackByComponent|actionBinding/i.test(property)) {
                return;
            }

            const detail =
                payload?.value === null || payload?.value === undefined
                    ? 'null'
                    : typeof payload?.value === 'object'
                      ? JSON.stringify(payload.value)
                      : String(payload.value);

            pushInputEventLog(property, detail);
        };

        emitter.on('component.updated', onComponentUpdated);
        return () => {
            emitter.off?.('component.updated', onComponentUpdated);
        };
    }, [gameComponent, isInputComponent]);

    const actionMaps = useMemo(() => {
        if (!Array.isArray(actionMapsState)) {
            return [] as any[];
        }
        return actionMapsState;
    }, [actionMapsState]);
    const actionMapNames = useMemo(() => actionMaps.map((map) => String(map?.name || '')).filter(Boolean), [actionMaps]);
    const currentActionMapName =
        String(gameComponent?.CurrentActionMap || actionMapNames[0] || 'Gameplay').trim() || 'Gameplay';
    const currentActionMap = useMemo(
        () => actionMaps.find((map) => String(map?.name || '') === currentActionMapName),
        [actionMaps, currentActionMapName]
    );

    const persistActionMaps = (nextActionMaps: any[]) => {
        setActionMapsState(nextActionMaps);

        const manager = gameComponent?.Manager;
        manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
        manager?.emitter?.emit?.('component.updated', {
            component: gameComponent?.NAME,
            property: 'actionMaps',
            value: nextActionMaps,
        });
    };

    const updateCurrentActionMapActions = (nextActionNames: string[]) => {
        const sanitizedActionNames = nextActionNames.map((name) => String(name || '').trim()).filter(Boolean);
        const uniqueActionNames = Array.from(new Set(sanitizedActionNames));
        if (!uniqueActionNames.length) {
            return;
        }

        const existingEntriesByName = new Map<string, any>();
        const existingActions = Array.isArray(currentActionMap?.actions) ? currentActionMap.actions : [];
        existingActions.forEach((action: any) => {
            const actionName = String(action?.name || '').trim();
            if (actionName) {
                existingEntriesByName.set(actionName, action);
            }
        });

        const nextActions = uniqueActionNames.map((actionName) => {
            const existing = existingEntriesByName.get(actionName);
            if (existing && typeof existing === 'object') {
                return { ...existing, name: actionName };
            }
            return { name: actionName };
        });

        const sourceMaps = actionMaps.length ? actionMaps : [{ name: currentActionMapName, actions: [] }];
        let hasCurrentMap = false;
        const nextMaps = sourceMaps.map((map) => {
            if (String(map?.name || '') !== currentActionMapName) {
                return map;
            }

            hasCurrentMap = true;
            return { ...map, actions: nextActions };
        });

        if (!hasCurrentMap) {
            nextMaps.push({ name: currentActionMapName, actions: nextActions });
        }

        persistActionMaps(nextMaps);
    };

    const handleAddInputAction = () => {
        const existingActionNames = new Set(currentActionNames.map((name) => String(name || '').trim().toLowerCase()));
        const baseName = 'new action';
        let suffix = 1;
        let nextActionName = `${baseName} ${suffix}`;

        while (existingActionNames.has(nextActionName.toLowerCase())) {
            suffix += 1;
            nextActionName = `${baseName} ${suffix}`;
        }

        updateCurrentActionMapActions([...currentActionNames, nextActionName]);
    };

    const currentActionNames = useMemo(() => {
        if (!currentActionMap || !Array.isArray(currentActionMap.actions)) {
            return [...DEFAULT_INPUT_ACTIONS];
        }

        const names = currentActionMap.actions.map((action: any) => String(action?.name || '')).filter(Boolean);
        return names.length ? names : [...DEFAULT_INPUT_ACTIONS];
    }, [currentActionMap]);

    const callbackNameOptions = useMemo(() => registeredActionCallbackNames, [registeredActionCallbackNames]);
    const factory = gameComponent?.Factory;
    const rawList: IFactoryValue[] = (factory?.valuesList || []).filter((item: IFactoryValue) => {
        const itemName = item.name || '';
        if (gameComponent.NAME !== 'CameraComponent') {
            if (
                gameComponent.NAME === 'InputComponent' &&
                (/^set\s*mapping$/i.test(itemName) ||
                    /^set\s*mapping\s*by\s*name$/i.test(itemName) ||
                    /^set\s*mapping\s*by\s*component$/i.test(itemName) ||
                    /^auto\s*bind$/i.test(itemName) ||
                    /^binding\s*events$/i.test(itemName))
            ) {
                return false;
            }
            return true;
        }

        // Keep camera runtime toggles out of the inspector to avoid conflicting with play/editor flow.
        return !/^is\s*(alive|preview)$/i.test(itemName);
    });
    const lightTypeOptions = [...LIGHT_TYPE_OPTIONS];
    const cameraFollowModeOptions: FollowMode[] = [...CAMERA_FOLLOW_MODE_OPTIONS];

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

        if (gameComponent.NAME === 'InputComponent' && /^Current Action Map$/i.test(itemName)) {
            const setCurrentActionMap = (nextMapName: string) => {
                const mapName = String(nextMapName || '').trim();
                if (!mapName) {
                    return;
                }

                item.setValue?.(mapName);

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'currentActionMap',
                    value: mapName,
                });
            };

            return {
                ...item,
                value: item.value || currentActionMapName,
                options: actionMapNames,
                optionLabels: actionMapNames,
                setValue: setCurrentActionMap,
            };
        }

        if (gameComponent.NAME === 'InputComponent' && /^Set Action Binding$/i.test(itemName)) {
            const setActionBinding = (nextValue: any) => {
                const mapName = String(nextValue?.mapName || currentActionMapName || '').trim();
                const actionName = String(nextValue?.actionName || '').trim();
                const path = String(nextValue?.path || '').trim();

                if (!mapName || !actionName || !path) {
                    return;
                }

                item.setValue?.({ mapName, actionName, path });

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'actionBinding',
                    value: { mapName, actionName, path },
                });
            };

            return {
                ...item,
                value: item.value || {
                    mapName: currentActionMapName,
                    actionName: currentActionNames[0] || '',
                    path: '<Keyboard>/space',
                },
                actionMapOptions: actionMapNames,
                actionMapOptionLabels: actionMapNames,
                actionOptions: currentActionNames,
                actionOptionLabels: currentActionNames,
                setValue: setActionBinding,
            };
        }

        if (gameComponent.NAME === 'InputComponent' && /^Set Action Callback By Name$/i.test(itemName)) {
            const setActionCallbackByName = (nextValue: any) => {
                const mapName = String(nextValue?.mapName || currentActionMapName || '').trim();
                const actionName = String(nextValue?.actionName || '').trim();
                const phase = String(nextValue?.phase || 'performed').trim();
                const callbackName = String(nextValue?.callbackName || callbackNameOptions[0] || '').trim();

                if (!mapName || !actionName || !phase || !callbackName) {
                    return;
                }

                setRegisteredActionCallbackNames((prev) =>
                    prev.includes(callbackName) ? prev : [...prev, callbackName]
                );
                item.setValue?.({ mapName, actionName, phase, callbackName });

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'actionCallbackByName',
                    value: { mapName, actionName, phase, callbackName },
                });
            };

            return {
                ...item,
                value: item.value || {
                    mapName: currentActionMapName,
                    actionName: currentActionNames[0] || '',
                    phase: ACTION_PHASE_OPTIONS[1],
                    callbackName: callbackNameOptions[0] || '',
                },
                actionMapOptions: actionMapNames,
                actionMapOptionLabels: actionMapNames,
                actionOptions: currentActionNames,
                actionOptionLabels: currentActionNames,
                phaseOptions: [...ACTION_PHASE_OPTIONS],
                phaseOptionLabels: [...ACTION_PHASE_OPTIONS],
                callbackOptions: callbackNameOptions,
                callbackOptionLabels: callbackNameOptions,
                setValue: setActionCallbackByName,
            };
        }

        if (gameComponent.NAME === 'InputComponent' && /^Dispatch Registered Event$/i.test(itemName)) {
            const dispatchRegisteredEvent = (nextValue: any) => {
                const callbackName = String(nextValue?.callbackName || callbackNameOptions[0] || '').trim();
                if (!callbackName) {
                    return;
                }

                item.setValue?.({ callbackName });

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'dispatchRegisteredEvent',
                    value: { callbackName },
                });
            };

            return {
                ...item,
                value: item.value || { callbackName: callbackNameOptions[0] || '' },
                callbackOptions: callbackNameOptions,
                callbackOptionLabels: callbackNameOptions,
                setValue: dispatchRegisteredEvent,
            };
        }

        if (gameComponent.NAME === 'InputComponent' && /^Set Action Callback By Component$/i.test(itemName)) {
            const componentNames = Object.values(GameComponentNameEnum).filter(
                (name) => name !== GameComponentNameEnum.InputComponent
            );

            const setActionCallbackByComponent = (nextValue: any) => {
                const mapName = String(nextValue?.mapName || currentActionMapName || '').trim();
                const actionName = String(nextValue?.actionName || '').trim();
                const phase = String(nextValue?.phase || 'performed').trim();
                const componentName = String(nextValue?.componentName || '').trim();
                const methodName = String(nextValue?.methodName || '').trim();

                if (!mapName || !actionName || !phase || !componentName || !methodName) {
                    return;
                }

                item.setValue?.({ mapName, actionName, phase, componentName, methodName });

                const manager = gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: gameComponent?.NAME,
                    property: 'actionCallbackByComponent',
                    value: { mapName, actionName, phase, componentName, methodName },
                });
            };

            return {
                ...item,
                value: item.value || {
                    mapName: currentActionMapName,
                    actionName: currentActionNames[0] || '',
                    phase: ACTION_PHASE_OPTIONS[1],
                    componentName: componentNames[0] || '',
                    methodName: '',
                },
                actionMapOptions: actionMapNames,
                actionMapOptionLabels: actionMapNames,
                actionOptions: currentActionNames,
                actionOptionLabels: currentActionNames,
                phaseOptions: [...ACTION_PHASE_OPTIONS],
                phaseOptionLabels: [...ACTION_PHASE_OPTIONS],
                componentOptions: componentNames,
                componentOptionLabels: componentNames,
                setValue: setActionCallbackByComponent,
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

    const setActionBindingItem = useMemo(
        () => valuesList.find((item) => /^Set Action Binding$/i.test(String(item?.name || ''))),
        [valuesList]
    );
    const setActionCallbackByComponentItem = useMemo(
        () => valuesList.find((item) => /^Set Action Callback By Component$/i.test(String(item?.name || ''))),
        [valuesList]
    );

    const componentMethodOptions = useMemo(() => {
        const components = Array.isArray(gameComponent?.Parent?.Components) ? gameComponent.Parent.Components : [];
        const byComponent = new Map<string, string[]>();

        components.forEach((component: any) => {
            const componentName = String(component?.NAME || '').trim();
            if (!componentName || componentName === 'InputComponent') {
                return;
            }

            const methods = new Set<string>();
            Object.keys(component || {}).forEach((key) => {
                if (typeof component?.[key] === 'function') {
                    methods.add(key);
                }
            });

            let proto = Object.getPrototypeOf(component);
            while (proto && proto !== Object.prototype) {
                Object.getOwnPropertyNames(proto).forEach((name) => {
                    if (typeof component?.[name] === 'function') {
                        methods.add(name);
                    }
                });
                proto = Object.getPrototypeOf(proto);
            }

            const cleanMethods = Array.from(methods)
                .map((name) => String(name || '').trim())
                .filter(Boolean)
                .filter((name) => !name.startsWith('_'))
                .filter((name) => !COMPONENT_METHOD_BLACKLIST.has(name.toLowerCase()))
                .sort((a, b) => a.localeCompare(b));

            if (cleanMethods.length) {
                byComponent.set(componentName, cleanMethods);
            }
        });

        return byComponent;
    }, [gameComponent]);

    const applyActionBinding = (actionName: string, path: string) => {
        const normalizedPath = String(path || '').trim();
        const normalizedActionName = String(actionName || '').trim();
        if (!normalizedPath || !normalizedActionName || !setActionBindingItem?.setValue) {
            return;
        }

        updateCurrentActionMapActions([...currentActionNames, normalizedActionName]);
        (setActionBindingItem as any).setValue?.({
            mapName: currentActionMapName,
            actionName: normalizedActionName,
            path: normalizedPath,
        });
    };

    const handleAddComponentFunctionCallback = (payload: {
        actionName: string;
        phase: string;
        componentName: string;
        methodName: string;
    }) => {
        const actionName = String(payload?.actionName || '').trim();
        const phase = String(payload?.phase || '').trim();
        const componentName = String(payload?.componentName || '').trim();
        const methodName = String(payload?.methodName || '').trim();
        if (!actionName || !phase || !componentName || !methodName || !setActionCallbackByComponentItem?.setValue) {
            return;
        }

        updateCurrentActionMapActions([...currentActionNames, actionName]);
        (setActionCallbackByComponentItem as any).setValue?.({
            mapName: currentActionMapName,
            actionName,
            phase,
            componentName,
            methodName,
        });
    };

    const groupedRows = useMemo(() => buildGroupedFactoryRows(valuesList), [valuesList]);

    return (
        <div key={`game-object-component-${gameComponent.NAME}`} className="inspector-component">
            <button
                type="button"
                className="inspector-component__toggle"
                onClick={() => setIsCollapsed((prev) => !prev)}
                aria-expanded={!isCollapsed}
            >
                <span className="inspector-component__title">{gameComponent.NAME}</span>
                <span className={`inspector-component__chevron ${isCollapsed ? 'is-collapsed' : ''}`}>▾</span>
            </button>

            {!isCollapsed && (
                <>
                    {isInputComponent && (
                        <>
                            <div className="inspector-input-launcher">
                                <div className="inspector-player-input">
                                    <div className="inspector-player-input__title">PlayerInput (Unity-style)</div>
                                    <div className="inspector-player-input__description">
                                        Configure actions and bindings using paths like &lt;Keyboard&gt;/space,
                                        &lt;Mouse&gt;/leftButton, &lt;Gamepad&gt;/buttonSouth, &lt;Gamepad&gt;/leftStick/x.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="inspector-input-launcher__button"
                                    onClick={() => setIsInputModalOpen(true)}
                                >
                                    Open Input Actions
                                </button>
                            </div>

                            <div className="inspector-input-event-log">
                                <div className="inspector-input-event-log__header">
                                    <span>Input Events Dispatched</span>
                                    <button
                                        type="button"
                                        className="inspector-input-event-log__clear"
                                        onClick={() => setInputEventLogs([])}
                                    >
                                        Clear
                                    </button>
                                </div>

                                {inputEventLogs.length === 0 ? (
                                    <div className="inspector-input-event-log__empty">No dispatched input events yet.</div>
                                ) : (
                                    <div className="inspector-input-event-log__list">
                                        {inputEventLogs.map((log) => (
                                            <div key={log.id} className="inspector-input-event-log__item">
                                                <div className="inspector-input-event-log__label">{log.label}</div>
                                                <div className="inspector-input-event-log__detail">{log.detail}</div>
                                                <div className="inspector-input-event-log__time">{log.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    <div className="inspector-component__fields">
                        {!isInputComponent && <GroupedFactoryFields rows={groupedRows} />}
                    </div>
                </>
            )}

            <InputActionsModal
                isOpen={isInputComponent && isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                currentActionNames={currentActionNames}
                currentActionMap={currentActionMap}
                componentMethodOptions={componentMethodOptions}
                onAddInputAction={handleAddInputAction}
                onApplyActionBinding={applyActionBinding}
                onAddComponentFunctionCallback={handleAddComponentFunctionCallback}
            />
        </div>
    );
};
