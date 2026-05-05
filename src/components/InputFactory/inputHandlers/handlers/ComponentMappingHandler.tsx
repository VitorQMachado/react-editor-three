import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class ComponentMappingHandler implements IInputTypeHandler {
    render({ value, onChange, item, commonInputProps }: InputHandlerContext) {
        const options = item.options as string[] | undefined;
        const optionLabels = item.optionLabels as string[] | undefined;
        const componentOptions = item.componentOptions as string[] | undefined;
        const componentOptionLabels = item.componentOptionLabels as string[] | undefined;

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
                    <label className="inspector-vector-inputs__label">component</label>
                    {!!(componentOptions && componentOptions.length) ? (
                        <select
                            className="inspector-input inspector-select"
                            value={String(value?.componentName || '')}
                            disabled={commonInputProps.disabled}
                            onChange={(e) => onChange({ ...value, componentName: e.target.value })}
                        >
                            {componentOptions.map((opt, idx) => (
                                <option key={opt} value={opt}>
                                    {componentOptionLabels?.[idx] ?? opt}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            {...commonInputProps}
                            type="text"
                            placeholder="ComponentName"
                            value={String(value?.componentName || '')}
                            onChange={(e) => onChange({ ...value, componentName: (e.target as HTMLInputElement).value })}
                        />
                    )}
                </div>
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">method</label>
                    <input
                        {...commonInputProps}
                        type="text"
                        placeholder="methodName"
                        value={String(value?.methodName || '')}
                        onChange={(e) => onChange({ ...value, methodName: (e.target as HTMLInputElement).value })}
                    />
                </div>
            </div>
        );
    }
}
