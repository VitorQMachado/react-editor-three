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
        if (typeof setValue === 'function') setValue(newValue);
    };

    const kind = (() => {
        if (typeof local === 'number') return 'number';
        if (typeof local === 'string') return 'string';
        if (Array.isArray(local)) return 'array';
        if (local && typeof local === 'object' && ['x','y','z'].every(k => typeof local[k] === 'number')) return 'vector';
        return 'unknown';
    })();

    switch (kind) {
        case 'number':
            return (
                <input
                    type="number"
                    value={local}
                    onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
                    disabled={typeof setValue !== 'function'}
                />
            );

        case 'string':
            return (
                <input
                    type="text"
                    value={local}
                    onChange={(e) => onChange((e.target as HTMLInputElement).value)}
                    disabled={typeof setValue !== 'function'}
                />
            );

        case 'array':
            return (
                <div style={{ display: 'flex', gap: 8 }}>
                    {(local as any[]).map((v: any, idx: number) => (
                        <input
                            key={idx}
                            type="number"
                            value={v}
                            onChange={(e) => {
                                const next = [...(local as any[])];
                                next[idx] = Number((e.target as HTMLInputElement).value);
                                onChange(next);
                            }}
                            disabled={typeof setValue !== 'function'}
                        />
                    ))}
                </div>
            );

        case 'vector':
            return (
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['x','y','z'] as const).map((axis) => (
                        <div key={axis}>
                            <label style={{ display: 'block', fontSize: 11 }}>{axis}</label>
                            <input
                                type="number"
                                value={local[axis]}
                                onChange={(e) => onChange({ ...local, [axis]: Number((e.target as HTMLInputElement).value) })}
                                disabled={typeof setValue !== 'function'}
                            />
                        </div>
                    ))}
                </div>
            );

        default:
            return <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(local)}</pre>;
    }
};

export default ComponentInputFactory;
