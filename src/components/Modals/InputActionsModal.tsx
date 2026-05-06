import React, { useEffect, useMemo, useState } from 'react';
import { GameComponent } from '@vmlibs/unit_three';
import { ACTION_PHASE_OPTIONS, DEFAULT_INPUT_ACTIONS, MOUSE_BINDING_OPTIONS } from '../GameObjectComponent/constants';
import { extractBindingPathFromAction } from '../GameObjectComponent/helpers';
import { useInputActionMaps } from '../../hooks/useInputActionMaps';
import { useInputActionHandlers } from '../../hooks/useInputActionHandlers';
import { useComponentMethodOptions } from '../../hooks/useComponentMethodOptions';

type InputActionsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    gameComponent: GameComponent | null;
};

export const InputActionsModal = ({
    isOpen,
    onClose,
    gameComponent,
}: InputActionsModalProps): React.ReactElement | null => {
    const { setActionBindingItem, setActionCallbackByComponentItem, persistActionMaps } = useInputActionHandlers(
        gameComponent as any
    );
    const { actionMaps, currentActionMapName, currentActionMap, currentActionNames } =
        useInputActionMaps(gameComponent);
    const componentMethodOptions = useComponentMethodOptions(gameComponent as any);
    const [selectedActionName, setSelectedActionName] = useState<string>(DEFAULT_INPUT_ACTIONS[0]);
    const [bindingPathInput, setBindingPathInput] = useState<string>('<Keyboard>/space');
    const [actionBindingDraftByName, setActionBindingDraftByName] = useState<Record<string, string>>({});
    const [selectedMouseBinding, setSelectedMouseBinding] = useState<string>(MOUSE_BINDING_OPTIONS[0]);
    const [isListeningBindingKey, setIsListeningBindingKey] = useState(false);
    const [selectedCallbackPhase, setSelectedCallbackPhase] = useState<string>(ACTION_PHASE_OPTIONS[1]);
    const [selectedCallbackComponent, setSelectedCallbackComponent] = useState<string>('');
    const [selectedCallbackMethod, setSelectedCallbackMethod] = useState<string>('');

    const callbackComponentNames = useMemo(() => Array.from(componentMethodOptions.keys()), [componentMethodOptions]);
    const callbackMethodNames = useMemo(
        () => componentMethodOptions.get(selectedCallbackComponent) || [],
        [componentMethodOptions, selectedCallbackComponent]
    );

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
    }, [currentActionMap]);

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
        setActionBindingItem.setValue?.({
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
        const phase = String(selectedCallbackPhase || '').trim();
        const componentName = String(selectedCallbackComponent || '').trim();
        const methodName = String(selectedCallbackMethod || '').trim();
        if (!actionName || !phase || !componentName || !methodName || !setActionCallbackByComponentItem?.setValue) {
            return;
        }

        updateCurrentActionMapActions([...currentActionNames, actionName]);
        setActionCallbackByComponentItem.setValue?.({
            mapName: currentActionMapName,
            actionName,
            phase,
            componentName,
            methodName,
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="inspector-modal-overlay" onClick={onClose}>
            <div className="inspector-modal" onClick={(e) => e.stopPropagation()}>
                <div className="inspector-modal__header">
                    <div className="inspector-modal__title">Input Action Configuration</div>
                    <button type="button" className="inspector-modal__close" onClick={onClose}>
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
    );
};
