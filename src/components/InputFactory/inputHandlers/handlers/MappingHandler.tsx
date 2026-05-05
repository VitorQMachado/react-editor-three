import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class MappingHandler implements IInputTypeHandler {
    render({ value, onChange, item, commonInputProps }: InputHandlerContext) {
        const options = item.options as string[] | undefined;
        const optionLabels = item.optionLabels as string[] | undefined;
        const callbackOptions = item.callbackOptions as string[] | undefined;
        const callbackOptionLabels = item.callbackOptionLabels as string[] | undefined;

        return (
            <div className="inspector-vector-inputs">
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">event</label>
                    <select
                        className="inspector-input inspector-select"
                        value={String(value?.event || '')}
                        disabled={commonInputProps.disabled}
                        onChange={(e) => onChange({ ...value, event: e.target.value })}
                    >
                        {(options || []).map((opt, idx) => (
                            <option key={opt} value={opt}>
                                {optionLabels?.[idx] ?? opt}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="inspector-vector-inputs__axis">
                    {!!(callbackOptions && callbackOptions.length) && (
                        <>
                            <label className="inspector-vector-inputs__label">saved callbacks</label>
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
                    <label className="inspector-vector-inputs__label">callbackName</label>
                    <input
                        {...commonInputProps}
                        type="text"
                        value={String(value?.callbackName || '')}
                        onChange={(e) => onChange({ ...value, callbackName: (e.target as HTMLInputElement).value })}
                    />
                </div>
            </div>
        );
    }
}
