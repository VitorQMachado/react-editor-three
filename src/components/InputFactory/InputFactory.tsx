import React, { useEffect, useState } from 'react';
import { fileToBlobUrl, getOriginalPathForBlob } from '../../services';
import { getInputHandler } from './inputHandlers';
import { InputKindEnum, type FactoryValue, type InputHandlerContext, type InputKind } from '../../types';

export const ComponentInputFactory = ({ item }: { item: FactoryValue }): React.ReactElement | null => {
    const { value, setValue, name } = item;
    const [local, setLocal] = useState<any>(value);
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
                            const fileName = selectedFile.name;
                            onPick(toTextureValue(selectedFile), fileName);
                            e.currentTarget.value = '';
                        }}
                        disabled={isDisabled}
                    />
                </label>
            </div>
        );
    };

    /**
     * Determines the input type from metadata provided by the Factory.
     * Fallback to unknown when metadata is missing.
     */
    const determineInputKind = (): InputKind => {
        if (item.inputKind) return item.inputKind;
        return InputKindEnum.Unknown;
    };

    const kind = determineInputKind();

    /**
     * Build context for the handler
     * Strategy Pattern: Pass all necessary information to handler
     */
    const handlerContext: InputHandlerContext = {
        value: local,
        onChange,
        setValue,
        name,
        commonInputProps,
        item,
        extractFileName,
        extractTextureReference,
        renderTextureFileButton,
        selectedTextureNamesByKey,
        setSelectedTextureNamesByKey,
    };

    /**
     * Get the appropriate handler and render
     * Open/Closed Principle: Factory is closed for modification, open for extension via handlers
     */
    const handler = getInputHandler(kind);

    return handler.render(handlerContext);
};

export default ComponentInputFactory;
