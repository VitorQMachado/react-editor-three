import React, { useEffect, useState } from 'react';
import { IFactoryValue } from '@vmlibs/unit_three';

export const ComponentInputFactory = ({ item }: { item: IFactoryValue }) => {
    const { value, setValue } = item;
    const [local, setLocal] = useState<any>(value);

    useEffect(() => {
        setLocal(value);
    }, [value]);

    const onChange = (newValue: any) => {
        setLocal(newValue);
        if (typeof setValue === 'function') {
            setValue(newValue);
        }
    };

    const commonInputProps = {
        className: 'inspector-input',
        disabled: typeof setValue !== 'function'
    };

    const kind = (() => {
        if (typeof local === 'number') return 'number';
        if (typeof local === 'string') return 'string';
        if (Array.isArray(local)) return 'array';
        if (local && typeof local === 'object' && ['x', 'y', 'z'].every((k) => typeof local[k] === 'number')) return 'vector';
        return 'unknown';
    })();

    switch (kind) {
        case 'number':
            return (
                <input
                    {...commonInputProps}
                    type="number"
                    value={local}
                    onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
                />
            );

        case 'string':
            return (
                <input
                    {...commonInputProps}
                    type="text"
                    value={local}
                    onChange={(e) => onChange((e.target as HTMLInputElement).value)}
                />
            );

        case 'array':
            return (
                <div className="inspector-array-inputs">
                    {(local as any[]).map((v: any, idx: number) => (
                        <input
                            {...commonInputProps}
                            key={idx}
                            type="number"
                            value={v}
                            onChange={(e) => {
                                const next = [...(local as any[])];
                                next[idx] = Number((e.target as HTMLInputElement).value);
                                onChange(next);
                            }}
                        />
                    ))}
                </div>
            );

        case 'vector':
            return (
                <div className="inspector-vector-inputs">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                        <div key={axis} className="inspector-vector-inputs__axis">
                            <label className="inspector-vector-inputs__label">{axis}</label>
                            <input
                                {...commonInputProps}
                                type="number"
                                value={local[axis]}
                                onChange={(e) => onChange({ ...local, [axis]: Number((e.target as HTMLInputElement).value) })}
                            />
                        </div>
                    ))}
                </div>
            );

        default:
            return <pre className="inspector-fallback">{JSON.stringify(local)}</pre>;
    }
};

export default ComponentInputFactory;
