import React from 'react';
import { IInputTypeHandler, InputHandlerContext } from '../types';

export class UnknownHandler implements IInputTypeHandler {
    render({ value }: InputHandlerContext) {
        return <pre className="inspector-fallback">{JSON.stringify(value)}</pre>;
    }
}
