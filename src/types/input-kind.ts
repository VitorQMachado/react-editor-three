export enum InputKindEnum {
    Select = 'select',
    Number = 'number',
    String = 'string',
    Boolean = 'boolean',
    Array = 'array',
    Vector = 'vector',
    ActionBinding = 'action-binding',
    ActionDispatch = 'action-dispatch',
    ActionCallbackByName = 'action-callback-by-name',
    ActionCallbackByComponent = 'action-callback-by-component',
    ComponentMapping = 'component-mapping',
    Mapping = 'mapping',
    TextureObject = 'texture-object',
    Unknown = 'unknown',
}

export type InputKind = `${InputKindEnum}`;
