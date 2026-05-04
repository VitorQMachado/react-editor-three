import { useEffect, useMemo, useState } from 'react';
import ComponentInputFactory from './ComponentInputFactory';
import { getOriginalPathForBlob } from '../../../services';
import { FollowMode, GameComponent, GameComponentNameEnum, IFactoryValue } from '@vmlibs/unit_three';
import './styles.css';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const ACTION_PHASE_OPTIONS = ['started', 'performed', 'canceled'] as const;
const DEFAULT_INPUT_ACTIONS = ['move left', 'move right', 'MoveUp', 'MoveDown', 'fire', 'jump'] as const;
const MOUSE_BINDING_OPTIONS = [
    '<Mouse>/leftButton',
    '<Mouse>/rightButton',
    '<Mouse>/middleButton',
    '<Mouse>/scroll/x',
    '<Mouse>/scroll/y',
    '<Mouse>/delta/x',
    '<Mouse>/delta/y',
] as const;
const COMPONENT_METHOD_BLACKLIST = new Set([
    'constructor',
    'dispose',
    'destroy',
    'update',
    'init',
    'initialize',
    'start',
    'awake',
    'onenable',
    'ondisable',
    'ondestroy',
]);

const isRotationAxisItem = (name: string) => /rotation/i.test(name) && /\s[XYZ]$/i.test(name);

const extractBindingPathFromAction = (action: any): string => {
    if (!action || typeof action !== 'object') {
        return '';
    }

    if (typeof action.path === 'string' && action.path.trim()) {
        return action.path.trim();
    }

    const candidates = [action.bindings, action.Bindings, action.binding, action.Binding];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const first = candidate.find((entry: any) => typeof entry?.path === 'string' && entry.path.trim());
            if (first?.path) {
                return String(first.path).trim();
            }
        }

        if (candidate && typeof candidate === 'object' && typeof (candidate as any).path === 'string') {
            const nestedPath = String((candidate as any).path || '').trim();
            if (nestedPath) {
                return nestedPath;
            }
        }
    }

    return '';
};

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

    const [selectedActionName, setSelectedActionName] = useState<string>(DEFAULT_INPUT_ACTIONS[0]);
    const [bindingPathInput, setBindingPathInput] = useState<string>('<Keyboard>/space');
    const [actionBindingDraftByName, setActionBindingDraftByName] = useState<Record<string, string>>({});
    const [selectedMouseBinding, setSelectedMouseBinding] = useState<string>(MOUSE_BINDING_OPTIONS[0]);
    const [isListeningBindingKey, setIsListeningBindingKey] = useState(false);
    const [selectedCallbackPhase, setSelectedCallbackPhase] = useState<string>(ACTION_PHASE_OPTIONS[1]);
    const [selectedCallbackComponent, setSelectedCallbackComponent] = useState<string>('');
    const [selectedCallbackMethod, setSelectedCallbackMethod] = useState<string>('');

    useEffect(() => {
        if (!currentActionNames.length) {
            return;
        }

        if (!currentActionNames.includes(selectedActionName)) {
            setSelectedActionName(currentActionNames[0]);
        }
    }, [currentActionNames, selectedActionName]);

    useEffect(() => {
        setActionBindingDraftByName({});
    }, [currentActionMapName]);

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

    const callbackComponentNames = useMemo(() => Array.from(componentMethodOptions.keys()), [componentMethodOptions]);
    const callbackMethodNames = useMemo(
        () => componentMethodOptions.get(selectedCallbackComponent) || [],
        [componentMethodOptions, selectedCallbackComponent]
    );

    useEffect(() => {
        if (!callbackComponentNames.length) {
            if (selectedCallbackComponent) {
                setSelectedCallbackComponent('');
            }
            return;
        }

        if (!callbackComponentNames.includes(selectedCallbackComponent)) {
            setSelectedCallbackComponent(callbackComponentNames[0]);
        }
    }, [callbackComponentNames, selectedCallbackComponent]);

    useEffect(() => {
        if (!callbackMethodNames.length) {
            if (selectedCallbackMethod) {
                setSelectedCallbackMethod('');
            }
            return;
        }

        if (!callbackMethodNames.includes(selectedCallbackMethod)) {
            setSelectedCallbackMethod(callbackMethodNames[0]);
        }
    }, [callbackMethodNames, selectedCallbackMethod]);

    const selectedActionBindingPath = useMemo(() => {
        const actionName = String(selectedActionName || '').trim();
        if (!actionName) {
            return '<Keyboard>/space';
        }

        const draftPath = actionBindingDraftByName[actionName];
        if (draftPath) {
            return draftPath;
        }

        const actions = Array.isArray(currentActionMap?.actions) ? currentActionMap.actions : [];
        const selectedAction = actions.find((action: any) => String(action?.name || '').trim() === actionName);
        const resolvedPath = extractBindingPathFromAction(selectedAction);
        return resolvedPath || '<Keyboard>/space';
    }, [actionBindingDraftByName, currentActionMap, selectedActionName]);

    useEffect(() => {
        setBindingPathInput(selectedActionBindingPath);
    }, [selectedActionBindingPath]);

    const applyActionBinding = (path: string) => {
        const normalizedPath = String(path || '').trim();
        const actionName = String(selectedActionName || '').trim();
        if (!normalizedPath || !actionName || !setActionBindingItem?.setValue) {
            return;
        }

        setActionBindingDraftByName((prev) => ({
            ...prev,
            [actionName]: normalizedPath,
        }));
        setBindingPathInput(normalizedPath);

        updateCurrentActionMapActions([...currentActionNames, actionName]);
        (setActionBindingItem as any).setValue?.({
            mapName: currentActionMapName,
            actionName,
            path: normalizedPath,
        });
    };

    const handleListenForBindingKey = () => {
        if (isListeningBindingKey) {
            return;
        }

        setIsListeningBindingKey(true);
        const onKeyDown = (event: KeyboardEvent) => {
            event.preventDefault();
            const key = String(event.key || '').toLowerCase();
            if (!key) {
                setIsListeningBindingKey(false);
                return;
            }

            const normalizedKey = key === ' ' ? 'space' : key;
            const keyPath = `<Keyboard>/${normalizedKey}`;
            setBindingPathInput(keyPath);
            applyActionBinding(keyPath);
            setIsListeningBindingKey(false);
        };

        window.addEventListener('keydown', onKeyDown, { once: true });
    };

    const handleAddComponentFunctionCallback = () => {
        const actionName = String(selectedActionName || '').trim();
        const componentName = String(selectedCallbackComponent || '').trim();
        const methodName = String(selectedCallbackMethod || '').trim();
        if (!actionName || !componentName || !methodName || !setActionCallbackByComponentItem?.setValue) {
            return;
        }

        updateCurrentActionMapActions([...currentActionNames, actionName]);
        (setActionCallbackByComponentItem as any).setValue?.({
            mapName: currentActionMapName,
            actionName,
            phase: selectedCallbackPhase,
            componentName,
            methodName,
        });
    };

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

    const renderGroupedRows = (rows: typeof groupedRows) => {
        return rows.map((row) => {
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
        });
    };

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
                        {!isInputComponent && renderGroupedRows(groupedRows)}
                    </div>
                </>
            )}

            {isInputComponent && isInputModalOpen && (
                <div className="inspector-modal-overlay" onClick={() => setIsInputModalOpen(false)}>
                    <div className="inspector-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="inspector-modal__header">
                            <div className="inspector-modal__title">Input Action Configuration</div>
                            <button
                                type="button"
                                className="inspector-modal__close"
                                onClick={() => setIsInputModalOpen(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="inspector-modal__body inspector-input-modal-layout">
                            <div className="inspector-input-modal-column inspector-input-modal-column--left">
                                <div className="inspector-input-actions-list">
                                    <div className="inspector-input-actions-list__title">Actions</div>
                                    <div className="inspector-input-actions-list__items inspector-input-actions-list__items--stacked">
                                        {currentActionNames.map((actionName) => {
                                            const isSelected = actionName === selectedActionName;
                                            return (
                                                <button
                                                    key={actionName}
                                                    type="button"
                                                    className={`inspector-input-actions-list__item-button ${
                                                        isSelected ? 'is-selected' : ''
                                                    }`}
                                                    onClick={() => setSelectedActionName(actionName)}
                                                >
                                                    {actionName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        className="inspector-callback-registry__add inspector-input-actions-list__add"
                                        onClick={handleAddInputAction}
                                    >
                                        Add Action
                                    </button>
                                </div>
                            </div>

                            <div className="inspector-input-modal-column inspector-input-modal-column--right">
                                <div className="inspector-input-panel">
                                    <div className="inspector-input-panel__title">Selected Action</div>
                                    <div className="inspector-input-panel__value">{selectedActionName || '-'}</div>
                                </div>

                                <div className="inspector-input-panel">
                                    <div className="inspector-input-panel__title">Add Key Binding</div>
                                    <div className="inspector-input-panel__row">
                                        <input
                                            className="inspector-input"
                                            type="text"
                                            value={bindingPathInput}
                                            onChange={(e) => setBindingPathInput((e.target as HTMLInputElement).value)}
                                            placeholder="&lt;Keyboard&gt;/space"
                                        />
                                    </div>
                                    <div className="inspector-input-panel__row inspector-input-panel__row--actions">
                                        <button
                                            type="button"
                                            className="inspector-callback-registry__add"
                                            onClick={handleListenForBindingKey}
                                            disabled={isListeningBindingKey}
                                        >
                                            {isListeningBindingKey ? 'Listening...' : 'Listen Key'}
                                        </button>
                                        <button
                                            type="button"
                                            className="inspector-callback-registry__add"
                                            onClick={() => applyActionBinding(bindingPathInput)}
                                        >
                                            Add Key
                                        </button>
                                    </div>
                                </div>

                                <div className="inspector-input-panel">
                                    <div className="inspector-input-panel__title">Add Mouse Binding</div>
                                    <div className="inspector-input-panel__row">
                                        <select
                                            className="inspector-input inspector-select"
                                            value={selectedMouseBinding}
                                            onChange={(e) => setSelectedMouseBinding(e.target.value)}
                                        >
                                            {MOUSE_BINDING_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="inspector-input-panel__row inspector-input-panel__row--actions">
                                        <button
                                            type="button"
                                            className="inspector-callback-registry__add"
                                            onClick={() => applyActionBinding(selectedMouseBinding)}
                                        >
                                            Add Mouse
                                        </button>
                                    </div>
                                </div>

                                <div className="inspector-input-panel">
                                    <div className="inspector-input-panel__title">Call Component Function</div>
                                    <div className="inspector-input-panel__grid">
                                        <div>
                                            <label className="inspector-vector-inputs__label">Phase</label>
                                            <select
                                                className="inspector-input inspector-select"
                                                value={selectedCallbackPhase}
                                                onChange={(e) => setSelectedCallbackPhase(e.target.value)}
                                            >
                                                {ACTION_PHASE_OPTIONS.map((phase) => (
                                                    <option key={phase} value={phase}>
                                                        {phase}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="inspector-vector-inputs__label">Component</label>
                                            <select
                                                className="inspector-input inspector-select"
                                                value={selectedCallbackComponent}
                                                onChange={(e) => setSelectedCallbackComponent(e.target.value)}
                                                disabled={!callbackComponentNames.length}
                                            >
                                                {callbackComponentNames.map((componentName) => (
                                                    <option key={componentName} value={componentName}>
                                                        {componentName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="inspector-vector-inputs__label">Function</label>
                                            <select
                                                className="inspector-input inspector-select"
                                                value={selectedCallbackMethod}
                                                onChange={(e) => setSelectedCallbackMethod(e.target.value)}
                                                disabled={!callbackMethodNames.length}
                                            >
                                                {callbackMethodNames.map((methodName) => (
                                                    <option key={methodName} value={methodName}>
                                                        {methodName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="inspector-input-panel__row inspector-input-panel__row--actions">
                                        <button
                                            type="button"
                                            className="inspector-callback-registry__add"
                                            onClick={handleAddComponentFunctionCallback}
                                            disabled={!selectedCallbackComponent || !selectedCallbackMethod}
                                        >
                                            Add Function Call
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
