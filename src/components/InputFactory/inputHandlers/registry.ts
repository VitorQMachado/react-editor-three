import { IInputTypeHandler, InputKindEnum, type InputKind } from './types';
import {
    SelectHandler,
    NumberHandler,
    InputTextHandler,
    CheckboxHandler,
    ArrayHandler,
    VectorHandler,
    ActionBindingHandler,
    ActionDispatchHandler,
    ActionCallbackByNameHandler,
    ActionCallbackByComponentHandler,
    ComponentMappingHandler,
    MappingHandler,
    TextureObjectHandler,
    UnknownHandler,
} from './handlers';

/**
 * Input Type Registry
 * Uses InputKindEnum keys to avoid magic strings in the registry map.
 */
const inputHandlerRegistry = new Map<InputKind, IInputTypeHandler>([
    [InputKindEnum.Select, new SelectHandler()],
    [InputKindEnum.Number, new NumberHandler()],
    [InputKindEnum.String, new InputTextHandler()],
    [InputKindEnum.Boolean, new CheckboxHandler()],
    [InputKindEnum.Array, new ArrayHandler()],
    [InputKindEnum.Vector, new VectorHandler()],
    [InputKindEnum.ActionBinding, new ActionBindingHandler()],
    [InputKindEnum.ActionDispatch, new ActionDispatchHandler()],
    [InputKindEnum.ActionCallbackByName, new ActionCallbackByNameHandler()],
    [InputKindEnum.ActionCallbackByComponent, new ActionCallbackByComponentHandler()],
    [InputKindEnum.ComponentMapping, new ComponentMappingHandler()],
    [InputKindEnum.Mapping, new MappingHandler()],
    [InputKindEnum.TextureObject, new TextureObjectHandler()],
]);

/**
 * Get a handler for a specific input type
 * Returns UnknownHandler if type is not registered (safe fallback)
 */
export function getInputHandler(kind: InputKind): IInputTypeHandler {
    return inputHandlerRegistry.get(kind) ?? new UnknownHandler();
}
