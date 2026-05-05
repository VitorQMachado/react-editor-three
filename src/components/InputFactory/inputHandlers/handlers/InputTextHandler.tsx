import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class InputTextHandler implements IInputTypeHandler {
    render({
        value,
        onChange,
        name,
        commonInputProps,
        renderTextureFileButton,
        extractFileName,
        extractTextureReference,
    }: InputHandlerContext): React.ReactElement | null {
        const isTextureField = /\b(texture|textures|map|maps)\b/i.test(name || '');

        if (isTextureField) {
            const buttonLabel = extractTextureReference(value) || extractFileName(value) || 'Add';
            return renderTextureFileButton((fileUrl) => {
                onChange(fileUrl);
            }, buttonLabel);
        }

        return (
            <input
                {...commonInputProps}
                type="text"
                value={value}
                onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            />
        );
    }
}
