import React, { Dispatch, SetStateAction } from 'react';

export interface InputHandlerContext {
    value: any;
    onChange: (value: any) => void;
    setValue?: (value: any) => void;
    name?: string;
    commonInputProps: {
        className: string;
        disabled: boolean;
    };
    item: any;
    extractFileName: (textureValue: unknown) => string;
    extractTextureReference: (textureValue: unknown) => string;
    renderTextureFileButton: (
        onPick: (fileUrl: string, fileName: string) => void,
        buttonLabel: string
    ) => React.ReactElement | null;
    selectedTextureNamesByKey: Record<string, string>;
    setSelectedTextureNamesByKey: Dispatch<SetStateAction<Record<string, string>>>;
}

export interface IInputTypeHandler {
    render(context: InputHandlerContext): React.ReactElement | null;
}
