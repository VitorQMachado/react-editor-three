import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class ActionCallbackByComponentHandler implements IInputTypeHandler {
    render({ value, onChange, item, commonInputProps }: InputHandlerContext) {
        const actionOptions = item.actionOptions as string[] | undefined;
        const actionOptionLabels = item.actionOptionLabels as string[] | undefined;
        const phaseOptions = item.phaseOptions as string[] | undefined;
        const phaseOptionLabels = item.phaseOptionLabels as string[] | undefined;
        const componentOptions = item.componentOptions as string[] | undefined;
        const componentOptionLabels = item.componentOptionLabels as string[] | undefined;

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
                    <label className="inspector-vector-inputs__label">component</label>
                    {!!(componentOptions && componentOptions.length) ? (
                        <select
                            className="inspector-input inspector-select"
                            value={String(value?.componentName || '')}
                            disabled={commonInputProps.disabled}
                            onChange={(e) => onChange({ ...value, componentName: e.target.value })}
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
                            value={String(value?.componentName || '')}
                            onChange={(e) => onChange({ ...value, componentName: (e.target as HTMLInputElement).value })}
                        />
                    )}
                </div>
                <div className="inspector-vector-inputs__axis">
                    <label className="inspector-vector-inputs__label">method</label>
                    <input
                        {...commonInputProps}
                        type="text"
                        placeholder="methodName"
                        value={String(value?.methodName || '')}
                        onChange={(e) => onChange({ ...value, methodName: (e.target as HTMLInputElement).value })}
                    />
                </div>
            </div>
        );
    }
}
