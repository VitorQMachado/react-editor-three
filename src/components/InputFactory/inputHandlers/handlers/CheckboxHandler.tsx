import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class CheckboxHandler implements IInputTypeHandler {
    render({ value, onChange, commonInputProps }: InputHandlerContext): React.ReactElement | null {
        return (
            <label className="inspector-checkbox">
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={commonInputProps.disabled}
                />
                <span>{Boolean(value) ? 'On' : 'Off'}</span>
            </label>
        );
    }
}
