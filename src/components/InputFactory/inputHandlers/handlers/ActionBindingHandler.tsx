import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class ActionBindingHandler implements IInputTypeHandler {
    private isListeningKey = false;

    render({ value, onChange, item, commonInputProps }: InputHandlerContext) {
        const actionMapOptions = item.actionMapOptions as string[] | undefined;
        const actionMapOptionLabels = item.actionMapOptionLabels as string[] | undefined;
        const actionOptions = item.actionOptions as string[] | undefined;
        const actionOptionLabels = item.actionOptionLabels as string[] | undefined;

        return (
            <div className="inspector-vector-inputs">
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">map</label>
                    {!!(actionMapOptions && actionMapOptions.length) ? (
                        <select
                            className="inspector-input inspector-select"
                            value={String(value?.mapName || '')}
                            disabled={commonInputProps.disabled}
                            onChange={(e) => onChange({ ...value, mapName: e.target.value })}
                        >
                            {actionMapOptions.map((opt, idx) => (
                                <option key={opt} value={opt}>
                                    {actionMapOptionLabels?.[idx] ?? opt}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            {...commonInputProps}
                            type="text"
                            placeholder="ActionMap"
                            value={String(value?.mapName || '')}
                            onChange={(e) => onChange({ ...value, mapName: (e.target as HTMLInputElement).value })}
                        />
                    )}
                </div>
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">action</label>
                    {!!(actionOptions && actionOptions.length) ? (
                        <select
                            className="inspector-input inspector-select"
                            value={String(value?.actionName || '')}
                            disabled={commonInputProps.disabled}
                            onChange={(e) => onChange({ ...value, actionName: e.target.value })}
                        >
                            {actionOptions.map((opt, idx) => (
                                <option key={opt} value={opt}>
                                    {actionOptionLabels?.[idx] ?? opt}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            {...commonInputProps}
                            type="text"
                            placeholder="ActionName"
                            value={String(value?.actionName || '')}
                            onChange={(e) => onChange({ ...value, actionName: (e.target as HTMLInputElement).value })}
                        />
                    )}
                </div>
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">binding path</label>
                    <input
                        {...commonInputProps}
                        type="text"
                        placeholder="&lt;Keyboard&gt;/space"
                        value={String(value?.path || '')}
                        onChange={(e) => onChange({ ...value, path: (e.target as HTMLInputElement).value })}
                    />
                    <button
                        type="button"
                        className="inspector-callback-registry__add inspector-inline-action-button"
                        disabled={commonInputProps.disabled}
                        onClick={() => {
                            this.isListeningKey = true;

                            const onKeyDown = (event: KeyboardEvent) => {
                                event.preventDefault();
                                const key = String(event.key || '').toLowerCase();
                                if (!key) {
                                    this.isListeningKey = false;
                                    return;
                                }

                                const normalizedKey = key === ' ' ? 'space' : key;
                                onChange({ ...value, path: `<Keyboard>/${normalizedKey}` });
                                this.isListeningKey = false;
                            };

                            window.addEventListener('keydown', onKeyDown, { once: true });
                        }}
                    >
                        {this.isListeningKey ? 'Press key...' : 'Listen Key'}
                    </button>
                </div>
            </div>
        );
    }
}
