import React, { useEffect, useState } from 'react';
import { fileToBlobUrl, getOriginalPathForBlob } from '../../../services';

type FactoryValue = {
    name: string;
    value: any;
    setValue?: (value: any) => void;
    options?: string[];
    optionLabels?: string[];
    callbackOptions?: string[];
    callbackOptionLabels?: string[];
    componentOptions?: string[];
    componentOptionLabels?: string[];
};

export const ComponentInputFactory = ({ item }: { item: FactoryValue }) => {
    const { value, setValue, name } = item;
    const [local, setLocal] = useState<any>(value);
    const [selectedTextureName, setSelectedTextureName] = useState('');
    const [selectedTextureNamesByKey, setSelectedTextureNamesByKey] = useState<Record<string, string>>({});

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
        disabled: typeof setValue !== 'function',
    };

    const isTextureField = /\b(texture|textures|map|maps)\b/i.test(name || '');

    const toTextureValue = (file: File) => {
        return fileToBlobUrl(file, file.name);
    };

    const extractFileName = (textureValue: unknown) => {
        if (typeof textureValue !== 'string') {
            return '';
        }
        const resolvedValue = getOriginalPathForBlob(textureValue);
        const normalized = resolvedValue.split('?')[0].replace(/\\/g, '/');
        const fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
        return fileName === 'blob' ? '' : fileName;
    };

    const extractTextureReference = (textureValue: unknown) => {
        if (typeof textureValue !== 'string') {
            return '';
        }
        const resolvedValue = getOriginalPathForBlob(textureValue);
        return resolvedValue.startsWith('blob:') ? '' : resolvedValue;
    };

    const renderTextureFileButton = (onPick: (fileUrl: string, fileName: string) => void, buttonLabel: string) => {
        const isDisabled = typeof setValue !== 'function';
        return (
            <div className="inspector-file-picker">
                <label className={`inspector-file-picker__button ${isDisabled ? 'is-disabled' : ''}`}>
                    {buttonLabel}
                    <input
                        type="file"
                        accept="image/*"
                        className="inspector-file-picker__input"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (!selectedFile) return;
                            onPick(toTextureValue(selectedFile), selectedFile.name);
                            e.currentTarget.value = '';
                        }}
                        disabled={isDisabled}
                    />
                </label>
            </div>
        );
    };

    const options: string[] | undefined = (item as any).options;
    const optionLabels: string[] | undefined = (item as any).optionLabels;
    const callbackOptions: string[] | undefined = (item as any).callbackOptions;
    const callbackOptionLabels: string[] | undefined = (item as any).callbackOptionLabels;
    const componentOptions: string[] | undefined = (item as any).componentOptions;
    const componentOptionLabels: string[] | undefined = (item as any).componentOptionLabels;
    const isDisplacementScaleField = /^Displacement Scale$/i.test(name || '');

    const kind = (() => {
        if (isDisplacementScaleField) return 'number';
        if (typeof local === 'number') return 'number';
        if (typeof local === 'boolean') return 'boolean';
        if (typeof local === 'string' && Array.isArray(options)) return 'select';
        if (typeof local === 'string') return 'string';
        if (Array.isArray(local)) return 'array';
        if (local && typeof local === 'object' && ['x', 'y', 'z'].every((k) => typeof local[k] === 'number'))
            return 'vector';
        if (local && typeof local === 'object' && 'event' in local && 'componentName' in local && 'methodName' in local)
            return 'component-mapping';
        if (local && typeof local === 'object' && 'event' in local && ('callbackName' in local || 'callback' in local))
            return 'mapping';
        if (local && typeof local === 'object' && isTextureField) return 'texture-object';
        if (local === null || local === undefined) return 'number';
        return 'unknown';
    })();

    const isColliderSizeField = /^Size [XYZ]$/i.test(name || '');
    const isColliderRadiusField = /^Radius$/i.test(name || '');

    switch (kind) {
        case 'select':
            return (
                <select
                    className="inspector-input inspector-select"
                    value={local}
                    disabled={typeof setValue !== 'function'}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options!.map((opt, idx) => (
                        <option key={opt} value={opt}>
                            {optionLabels?.[idx] ?? opt}
                        </option>
                    ))}
                </select>
            );

        case 'number':
            return (
                <input
                    {...commonInputProps}
                    type="number"
                    value={Number.isFinite(Number(local)) ? Number(local) : 0}
                    onChange={(e) => {
                        const parsed = Number((e.target as HTMLInputElement).value);
                        const safeValue = Number.isFinite(parsed) ? parsed : Number(local) || 0;
                        if (isColliderSizeField || isColliderRadiusField) {
                            onChange(Math.max(0.01, safeValue));
                            return;
                        }
                        onChange(safeValue);
                    }}
                />
            );

        case 'string':
            if (isTextureField) {
                const buttonLabel =
                    selectedTextureName || extractTextureReference(local) || extractFileName(local) || 'Add';

                return renderTextureFileButton((fileUrl, fileName) => {
                    setSelectedTextureName(fileName);
                    onChange(fileUrl);
                }, buttonLabel);
            }
            return (
                <input
                    {...commonInputProps}
                    type="text"
                    value={local}
                    onChange={(e) => onChange((e.target as HTMLInputElement).value)}
                />
            );

        case 'boolean':
            return (
                <label className="inspector-checkbox">
                    <input
                        type="checkbox"
                        checked={Boolean(local)}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={typeof setValue !== 'function'}
                    />
                    <span>{Boolean(local) ? 'On' : 'Off'}</span>
                </label>
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
                                onChange={(e) =>
                                    onChange({ ...local, [axis]: Number((e.target as HTMLInputElement).value) })
                                }
                            />
                        </div>
                    ))}
                </div>
            );

        case 'component-mapping':
            return (
                <div className="inspector-vector-inputs">
                    <div className="inspector-vector-inputs__axis">
                        <label className="inspector-vector-inputs__label">event</label>
                        <select
                            className="inspector-input inspector-select"
                            value={String(local?.event || '')}
                            disabled={typeof setValue !== 'function'}
                            onChange={(e) => onChange({ ...local, event: e.target.value })}
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
                                value={String(local?.componentName || '')}
                                disabled={typeof setValue !== 'function'}
                                onChange={(e) => onChange({ ...local, componentName: e.target.value })}
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
                                value={String(local?.componentName || '')}
                                onChange={(e) => onChange({ ...local, componentName: (e.target as HTMLInputElement).value })}
                            />
                        )}
                    </div>
                    <div className="inspector-vector-inputs__axis">
                        <label className="inspector-vector-inputs__label">method</label>
                        <input
                            {...commonInputProps}
                            type="text"
                            placeholder="methodName"
                            value={String(local?.methodName || '')}
                            onChange={(e) => onChange({ ...local, methodName: (e.target as HTMLInputElement).value })}
                        />
                    </div>
                </div>
            );

        case 'mapping':
            return (
                <div className="inspector-vector-inputs">
                    <div className="inspector-vector-inputs__axis">
                        <label className="inspector-vector-inputs__label">event</label>
                        <select
                            className="inspector-input inspector-select"
                            value={String(local?.event || '')}
                            disabled={typeof setValue !== 'function'}
                            onChange={(e) => onChange({ ...local, event: e.target.value })}
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
                                    value={String(local?.callbackName || '')}
                                    disabled={typeof setValue !== 'function'}
                                    onChange={(e) => onChange({ ...local, callbackName: e.target.value })}
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
                            value={String(local?.callbackName || '')}
                            onChange={(e) => onChange({ ...local, callbackName: (e.target as HTMLInputElement).value })}
                        />
                    </div>
                </div>
            );

        case 'texture-object':
            return (
                <div className="inspector-texture-map-inputs">
                    {Object.keys(local).map((key) => (
                        <div key={key} className="inspector-texture-map-inputs__item">
                            <label className="inspector-vector-inputs__label">{key}</label>
                            {renderTextureFileButton(
                                (fileUrl, fileName) => {
                                    if (/^Textures$/i.test(name || '')) {
                                        console.log('[skybox] selected texture', {
                                            skyboxFace: key,
                                            realFileName: fileName,
                                        });
                                    }
                                    setSelectedTextureNamesByKey((prev) => ({ ...prev, [key]: fileName }));
                                    onChange({ ...local, [key]: fileUrl });
                                },
                                selectedTextureNamesByKey[key] || extractFileName(local[key]) || 'Add'
                            )}
                        </div>
                    ))}
                </div>
            );

        default:
            return <pre className="inspector-fallback">{JSON.stringify(local)}</pre>;
    }
};

export default ComponentInputFactory;
