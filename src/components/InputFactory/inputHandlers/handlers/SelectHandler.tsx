import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class SelectHandler implements IInputTypeHandler {
    render({ value, onChange, item, commonInputProps }: InputHandlerContext) {
        const options = item.options as string[] | undefined;
        const optionLabels = item.optionLabels as string[] | undefined;

        return (
            <select
                className="inspector-input inspector-select"
                value={value}
                disabled={commonInputProps.disabled}
                onChange={(e) => onChange(e.target.value)}
            >
                {options!.map((opt, idx) => (
                    <option key={opt} value={opt}>
                        {optionLabels?.[idx] ?? opt}
                    </option>
                ))}
            </select>
        );
    }
}
