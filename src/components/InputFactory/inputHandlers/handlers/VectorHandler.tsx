import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class VectorHandler implements IInputTypeHandler {
    render({ value, onChange, commonInputProps }: InputHandlerContext) {
        return (
            <div className="inspector-vector-inputs">
                {(['x', 'y', 'z'] as const).map((axis) => (
                    <div key={axis} className="inspector-vector-inputs__axis">
                        <label className="inspector-vector-inputs__label">{axis}</label>
                        <input
                            {...commonInputProps}
                            type="number"
                            value={value[axis]}
                            onChange={(e) =>
                                onChange({ ...value, [axis]: Number((e.target as HTMLInputElement).value) })
                            }
                        />
                    </div>
                ))}
            </div>
        );
    }
}
