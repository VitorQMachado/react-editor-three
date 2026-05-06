import { useEffect, useState } from 'react';
import { GameComponent } from '@vmlibs/unit_three';
import { GroupedFactoryFields } from '../InputFactory/GroupedFactoryFields';
import { InputActionsModal } from '../InputFactory/InputActionsModal';
import './styles.css';

export const GameObjectComponent = ({ gameComponent: gameComponentProp }: { gameComponent: GameComponent }) => {
    const gameComponent = gameComponentProp as any;
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [inputEventLogs, setInputEventLogs] = useState<
        Array<{ id: string; label: string; detail: string; time: string }>
    >([]);
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
                        {!isInputComponent && <GroupedFactoryFields gameComponent={gameComponent} />}
                    </div>
                </>
            )}

            <InputActionsModal
                isOpen={isInputComponent && isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                gameComponent={gameComponent}
            />
        </div>
    );
};
