import { useEffect, useMemo, useState } from 'react';
import { getOriginalPathForBlob } from '../../../services';
import { GameComponent, IFactoryValue } from '@vmlibs/unit_three';
import { GroupedFactoryFields } from './GroupedFactoryFields';
import { InputActionsModal } from './InputActionsModal';
import {
    CAMERA_FOLLOW_MODE_OPTIONS,
    DEFAULT_INPUT_ACTIONS,
    DEG_TO_RAD,
    LIGHT_TYPE_OPTIONS,
    RAD_TO_DEG,
} from './constants';
import { buildGroupedFactoryRows, isRotationAxisItem } from './helpers';
import { shouldIncludeFactoryItem, transformFactoryValue } from './factoryValueStrategies';
import './styles.css';

export const GameObjectComponent = ({ gameComponent: gameComponentProp }: { gameComponent: GameComponent }) => {
    const gameComponent = gameComponentProp as any;
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [registeredActionCallbackNames, setRegisteredActionCallbackNames] = useState<string[]>([]);
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [inputEventLogs, setInputEventLogs] = useState<
        Array<{ id: string; label: string; detail: string; time: string }>
    >([]);
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
            if (
                !/dispatchRegisteredEvent|actionCallbackByName|actionCallbackByComponent|actionBinding/i.test(property)
            ) {
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
    const actionMapNames = useMemo(
        () => actionMaps.map((map) => String(map?.name || '')).filter(Boolean),
        [actionMaps]
    );
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
        const existingActionNames = new Set(
            currentActionNames.map((name) =>
                String(name || '')
                    .trim()
                    .toLowerCase()
            )
        );
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
        return shouldIncludeFactoryItem(gameComponent.NAME, itemName);
    });
    const lightTypeOptions = [...LIGHT_TYPE_OPTIONS];
    const cameraFollowModeOptions = [...CAMERA_FOLLOW_MODE_OPTIONS];

    const valuesList = rawList.map((item) =>
        transformFactoryValue(item, {
            gameComponent,
            rawList,
            currentActionMapName,
            currentActionNames,
            actionMapNames,
            callbackNameOptions,
            lightTypeOptions,
            cameraFollowModeOptions,
            registerActionCallbackName: (callbackName: string) => {
                setRegisteredActionCallbackNames((prev) =>
                    prev.includes(callbackName) ? prev : [...prev, callbackName]
                );
            },
            getOriginalPathForBlob,
            isRotationAxisItem,
            radToDeg: RAD_TO_DEG,
            degToRad: DEG_TO_RAD,
        })
    );

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
                .filter(
                    (name) =>
                        ![
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
                        ].includes(name.toLowerCase())
                )
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
                                        &lt;Mouse&gt;/leftButton, &lt;Gamepad&gt;/buttonSouth,
                                        &lt;Gamepad&gt;/leftStick/x.
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
                                    <div className="inspector-input-event-log__empty">
                                        No dispatched input events yet.
                                    </div>
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
