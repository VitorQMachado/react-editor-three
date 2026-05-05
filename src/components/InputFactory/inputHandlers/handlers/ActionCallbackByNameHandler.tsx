import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class ActionCallbackByNameHandler implements IInputTypeHandler {
    render({ value, onChange, item, commonInputProps }: InputHandlerContext) {
        const actionOptions = item.actionOptions as string[] | undefined;
        const actionOptionLabels = item.actionOptionLabels as string[] | undefined;
        const phaseOptions = item.phaseOptions as string[] | undefined;
        const phaseOptionLabels = item.phaseOptionLabels as string[] | undefined;
        const callbackOptions = item.callbackOptions as string[] | undefined;
        const callbackOptionLabels = item.callbackOptionLabels as string[] | undefined;

        return (
            <div className="inspector-vector-inputs">
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">action</label>
                    {!!(actionOptions && actionOptions.length) ? (
                        <select
                            className="inspector-input inspector-select"
                            value={String(value?.actionName || '')}
                            disabled={commonInputProps.disabled}
                            onChange={(e) => onChange({ ...value, actionName: e.target.value })}
                        >
                            {actionOptions.map((opt, idx) => (
                                <option key={opt} value={opt}>
                                    {actionOptionLabels?.[idx] ?? opt}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            {...commonInputProps}
                            type="text"
                            placeholder="ActionName"
                            value={String(value?.actionName || '')}
                            onChange={(e) => onChange({ ...value, actionName: (e.target as HTMLInputElement).value })}
                        />
                    )}
                </div>
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">phase</label>
                    {!!(phaseOptions && phaseOptions.length) ? (
                        <select
                            className="inspector-input inspector-select"
                            value={String(value?.phase || '')}
                            disabled={commonInputProps.disabled}
                            onChange={(e) => onChange({ ...value, phase: e.target.value })}
                        >
                            {phaseOptions.map((opt, idx) => (
                                <option key={opt} value={opt}>
                                    {phaseOptionLabels?.[idx] ?? opt}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            {...commonInputProps}
                            type="text"
                            placeholder="performed"
                            value={String(value?.phase || '')}
                            onChange={(e) => onChange({ ...value, phase: (e.target as HTMLInputElement).value })}
                        />
                    )}
                </div>
                <div className="inspector-vector-inputs__axis">
                    {!!(callbackOptions && callbackOptions.length) && (
                        <>
                            <label className="inspector-vector-inputs__label">saved callbacks</label>
                            <select
                                className="inspector-input inspector-select"
                                value={String(value?.callbackName || '')}
                                disabled={commonInputProps.disabled}
                                onChange={(e) => onChange({ ...value, callbackName: e.target.value })}
                            >
                                {callbackOptions.map((opt, idx) => (
                                    <option key={opt} value={opt}>
                                        {callbackOptionLabels?.[idx] ?? opt}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                    <label className="inspector-vector-inputs__label">callback</label>
                    <input
                        {...commonInputProps}
                        type="text"
                        placeholder="onJump"
                        value={String(value?.callbackName || '')}
                        onChange={(e) => onChange({ ...value, callbackName: (e.target as HTMLInputElement).value })}
                    />
                </div>
            </div>
        );
    }
}
