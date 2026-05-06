import React, { useEffect, useState } from 'react';
import { InputActionsModal } from '../Modals/InputActionsModal';

type InputConfigurationSectionProps = {
    gameComponent: any;
};

type InputEventLog = {
    id: string;
    label: string;
    detail: string;
    time: string;
};

export const InputConfigurationSection = ({ gameComponent }: InputConfigurationSectionProps): React.ReactElement => {
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [inputEventLogs, setInputEventLogs] = useState<InputEventLog[]>([]);

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
    }, [gameComponent]);

    return (
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

            <InputActionsModal
                isOpen={isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                gameComponent={gameComponent}
            />
        </>
    );
};
