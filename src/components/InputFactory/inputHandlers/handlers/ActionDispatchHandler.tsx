import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class ActionDispatchHandler implements IInputTypeHandler {
    render({ value, onChange, item, commonInputProps }: InputHandlerContext) {
        const callbackOptions = item.callbackOptions as string[] | undefined;
        const callbackOptionLabels = item.callbackOptionLabels as string[] | undefined;

        return (
            <div className="inspector-vector-inputs">
                <div className="inspector-vector-inputs__axis">
                    {!!(callbackOptions && callbackOptions.length) && (
                        <>
                            <label className="inspector-vector-inputs__label">registered names</label>
                            <select
                                className="inspector-input inspector-select"
                                value={String(value?.callbackName || '')}
                                disabled={commonInputProps.disabled}
                                onChange={(e) => onChange({ ...value, callbackName: e.target.value })}
                            >
                                {callbackOptions.map((opt, idx) => (
                                    <option key={opt} value={opt}>
                                        {callbackOptionLabels?.[idx] ?? opt}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                    <label className="inspector-vector-inputs__label">event name</label>
                    <input
                        {...commonInputProps}
                        type="text"
                        placeholder="onCustomAction"
                        value={String(value?.callbackName || '')}
                        onChange={(e) => onChange({ ...value, callbackName: (e.target as HTMLInputElement).value })}
                    />
                </div>
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">dispatch</label>
                    <button
                        type="button"
                        className="inspector-callback-registry__add inspector-inline-action-button"
                        disabled={commonInputProps.disabled}
                        onClick={() => {
                            if (typeof item.setValue === 'function') {
                                item.setValue(value);
                            }
                        }}
                    >
                        Dispatch
                    </button>
                </div>
            </div>
        );
    }
}
