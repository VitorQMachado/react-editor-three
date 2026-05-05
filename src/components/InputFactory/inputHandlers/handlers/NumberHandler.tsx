import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class NumberHandler implements IInputTypeHandler {
    render({ value, onChange, name, commonInputProps }: InputHandlerContext) {
        const isColliderSizeField = /^Size [XYZ]$/i.test(name || '');
        const isColliderRadiusField = /^Radius$/i.test(name || '');

        return (
            <input
                {...commonInputProps}
                type="number"
                value={Number.isFinite(Number(value)) ? Number(value) : 0}
                onChange={(e) => {
                    const parsed = Number((e.target as HTMLInputElement).value);
                    const safeValue = Number.isFinite(parsed) ? parsed : Number(value) || 0;
                    if (isColliderSizeField || isColliderRadiusField) {
                        onChange(Math.max(0.01, safeValue));
                        return;
                    }
                    onChange(safeValue);
                }}
            />
        );
    }
}
