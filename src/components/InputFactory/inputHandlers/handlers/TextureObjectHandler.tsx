import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class TextureObjectHandler implements IInputTypeHandler {
    render({ value, onChange, name, renderTextureFileButton, extractFileName, selectedTextureNamesByKey, setSelectedTextureNamesByKey }: InputHandlerContext) {
        return (
            <div className="inspector-texture-map-inputs">
                {Object.keys(value).map((key) => (
                    <div key={key} className="inspector-texture-map-inputs__item">
                        <label className="inspector-vector-inputs__label">{key}</label>
                        {renderTextureFileButton(
                            (fileUrl, fileName) => {
                                if (/^Textures$/i.test(name || '')) {
                                    console.log('[skybox] selected texture', {
                                        skyboxFace: key,
                                    });
                                }
                                setSelectedTextureNamesByKey((prev) => ({ ...prev, [key]: fileName }));
                                onChange({ ...value, [key]: fileUrl });
                            },
                            selectedTextureNamesByKey[key] || extractFileName(value[key]) || 'Add'
                        )}
                    </div>
                ))}
            </div>
        );
    }
}
