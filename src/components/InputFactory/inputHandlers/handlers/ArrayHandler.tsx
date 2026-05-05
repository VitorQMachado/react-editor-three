import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class ArrayHandler implements IInputTypeHandler {
    render({ value, onChange, commonInputProps }: InputHandlerContext) {
        return (
            <div className="inspector-array-inputs">
                {(value as any[]).map((v: any, idx: number) => (
                    <input
                        {...commonInputProps}
                        key={idx}
                        type="number"
                        value={v}
                        onChange={(e) => {
                            const next = [...(value as any[])];
                            next[idx] = Number((e.target as HTMLInputElement).value);
                            onChange(next);
                        }}
                    />
                ))}
            </div>
        );
    }
}
