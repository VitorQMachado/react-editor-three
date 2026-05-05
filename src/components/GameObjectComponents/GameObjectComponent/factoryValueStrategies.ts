import { FollowMode, GameComponentNameEnum, IFactoryValue } from '@vmlibs/unit_three';

type ExtendedFactoryValue = IFactoryValue & Record<string, any>;

export type FactoryValueStrategyContext = {
    gameComponent: any;
    rawList: ExtendedFactoryValue[];
    currentActionMapName: string;
    currentActionNames: string[];
    actionMapNames: string[];
    callbackNameOptions: string[];
    lightTypeOptions: string[];
    cameraFollowModeOptions: FollowMode[];
    registerActionCallbackName: (name: string) => void;
    getOriginalPathForBlob: (path: string) => string;
    isRotationAxisItem: (name: string) => boolean;
    radToDeg: number;
    degToRad: number;
};

interface IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean;
    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue;
}

class LightTypeStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.gameComponent?.NAME === 'LightComponent' && /^Type$/i.test(String(item?.name || ''));
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const setLightType = (nextType: string) => {
            let updated = false;

            if (typeof item.setValue === 'function') {
                item.setValue(nextType);
                updated = true;
            }

            const optionTargets = [
                context.gameComponent?.options,
                context.gameComponent?.Options,
                context.gameComponent?.params,
                context.gameComponent?.Params,
                context.gameComponent?.data?.options,
                context.gameComponent?.Data?.options,
            ];

            optionTargets.forEach((target) => {
                if (target && typeof target === 'object' && 'type' in target) {
                    (target as any).type = nextType;
                    updated = true;
                }
            });

            if (!updated) {
                console.warn('[inspector-light] unable to set Light type: no writable setter/target found', {
                    itemName: item.name,
                    nextType,
                });
                return;
            }

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('transformControl-change');
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'type',
                value: nextType,
            });
        };

        return {
            ...item,
            options: context.lightTypeOptions,
            optionLabels: context.lightTypeOptions,
            setValue: setLightType,
        };
    }
}

class CameraFollowModeStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.gameComponent?.NAME === 'CameraComponent' && /^follow\s*mode$/i.test(String(item?.name || ''));
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        return {
            ...item,
            options: context.cameraFollowModeOptions,
            optionLabels: context.cameraFollowModeOptions,
            setValue: (nextMode: string) => {
                item.setValue?.(nextMode);
                const manager = context.gameComponent?.Manager;
                manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
                manager?.emitter?.emit?.('component.updated', {
                    component: context.gameComponent?.NAME,
                    property: 'followMode',
                    value: nextMode,
                });
            },
        };
    }
}

class SkyboxTexturesStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.gameComponent?.NAME === 'SkyboxComponent' && /^Textures$/i.test(String(item?.name || ''));
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const setSkyboxTextures = (nextTextures: Record<string, string>) => {
            const runtimeTextures = Object.entries(nextTextures || {}).reduce(
                (acc, [key, texturePath]) => {
                    acc[key] = String(texturePath || '');
                    return acc;
                },
                {} as Record<string, string>
            );

            console.log('[skybox] updated textures', {
                gameObject: context.gameComponent?.Parent?.Name,
                runtimeTextures,
                sourceTextures: Object.entries(runtimeTextures).reduce(
                    (acc, [key, texturePath]) => {
                        acc[key] = context.getOriginalPathForBlob(texturePath);
                        return acc;
                    },
                    {} as Record<string, string>
                ),
            });

            if (typeof item.setValue === 'function') {
                item.setValue(runtimeTextures);
            }

            const params = context.gameComponent?.params || {};
            params.options = {
                ...(params.options || {}),
                textures: runtimeTextures,
            };
            if (!params.parentMesh && context.gameComponent?.Manager?.scene) {
                params.parentMesh = context.gameComponent.Manager.scene;
            }

            if (typeof context.gameComponent?.loadSkybox === 'function') {
                context.gameComponent.loadSkybox(params);
            }

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'Textures',
                value: Object.entries(runtimeTextures).reduce(
                    (acc, [key, texturePath]) => {
                        acc[key] = context.getOriginalPathForBlob(texturePath);
                        return acc;
                    },
                    {} as Record<string, string>
                ),
            });
        };

        return {
            ...item,
            value: item.value || {},
            setValue: setSkyboxTextures,
        };
    }
}

class InputCurrentActionMapStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return (
            context.gameComponent?.NAME === 'InputComponent' && /^Current Action Map$/i.test(String(item?.name || ''))
        );
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const setCurrentActionMap = (nextMapName: string) => {
            const mapName = String(nextMapName || '').trim();
            if (!mapName) {
                return;
            }

            item.setValue?.(mapName);

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'currentActionMap',
                value: mapName,
            });
        };

        return {
            ...item,
            value: item.value || context.currentActionMapName,
            options: context.actionMapNames,
            optionLabels: context.actionMapNames,
            setValue: setCurrentActionMap,
        };
    }
}

class InputSetActionBindingStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return (
            context.gameComponent?.NAME === 'InputComponent' && /^Set Action Binding$/i.test(String(item?.name || ''))
        );
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const setActionBinding = (nextValue: any) => {
            const mapName = String(nextValue?.mapName || context.currentActionMapName || '').trim();
            const actionName = String(nextValue?.actionName || '').trim();
            const path = String(nextValue?.path || '').trim();

            if (!mapName || !actionName || !path) {
                return;
            }

            item.setValue?.({ mapName, actionName, path });

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'actionBinding',
                value: { mapName, actionName, path },
            });
        };

        return {
            ...item,
            value: item.value || {
                mapName: context.currentActionMapName,
                actionName: context.currentActionNames[0] || '',
                path: '<Keyboard>/space',
            },
            actionMapOptions: context.actionMapNames,
            actionMapOptionLabels: context.actionMapNames,
            actionOptions: context.currentActionNames,
            actionOptionLabels: context.currentActionNames,
            setValue: setActionBinding,
        };
    }
}

class InputSetActionCallbackByNameStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return (
            context.gameComponent?.NAME === 'InputComponent' &&
            /^Set Action Callback By Name$/i.test(String(item?.name || ''))
        );
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const setActionCallbackByName = (nextValue: any) => {
            const mapName = String(nextValue?.mapName || context.currentActionMapName || '').trim();
            const actionName = String(nextValue?.actionName || '').trim();
            const phase = String(nextValue?.phase || 'performed').trim();
            const callbackName = String(nextValue?.callbackName || context.callbackNameOptions[0] || '').trim();

            if (!mapName || !actionName || !phase || !callbackName) {
                return;
            }

            context.registerActionCallbackName(callbackName);
            item.setValue?.({ mapName, actionName, phase, callbackName });

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'actionCallbackByName',
                value: { mapName, actionName, phase, callbackName },
            });
        };

        return {
            ...item,
            value: item.value || {
                mapName: context.currentActionMapName,
                actionName: context.currentActionNames[0] || '',
                phase: 'performed',
                callbackName: context.callbackNameOptions[0] || '',
            },
            actionMapOptions: context.actionMapNames,
            actionMapOptionLabels: context.actionMapNames,
            actionOptions: context.currentActionNames,
            actionOptionLabels: context.currentActionNames,
            phaseOptions: ['started', 'performed', 'canceled'],
            phaseOptionLabels: ['started', 'performed', 'canceled'],
            callbackOptions: context.callbackNameOptions,
            callbackOptionLabels: context.callbackNameOptions,
            setValue: setActionCallbackByName,
        };
    }
}

class InputDispatchRegisteredEventStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return (
            context.gameComponent?.NAME === 'InputComponent' &&
            /^Dispatch Registered Event$/i.test(String(item?.name || ''))
        );
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const dispatchRegisteredEvent = (nextValue: any) => {
            const callbackName = String(nextValue?.callbackName || context.callbackNameOptions[0] || '').trim();
            if (!callbackName) {
                return;
            }

            item.setValue?.({ callbackName });

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'dispatchRegisteredEvent',
                value: { callbackName },
            });
        };

        return {
            ...item,
            value: item.value || { callbackName: context.callbackNameOptions[0] || '' },
            callbackOptions: context.callbackNameOptions,
            callbackOptionLabels: context.callbackNameOptions,
            setValue: dispatchRegisteredEvent,
        };
    }
}

class InputSetActionCallbackByComponentStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return (
            context.gameComponent?.NAME === 'InputComponent' &&
            /^Set Action Callback By Component$/i.test(String(item?.name || ''))
        );
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const componentNames = Object.values(GameComponentNameEnum).filter(
            (name) => name !== GameComponentNameEnum.InputComponent
        );

        const setActionCallbackByComponent = (nextValue: any) => {
            const mapName = String(nextValue?.mapName || context.currentActionMapName || '').trim();
            const actionName = String(nextValue?.actionName || '').trim();
            const phase = String(nextValue?.phase || 'performed').trim();
            const componentName = String(nextValue?.componentName || '').trim();
            const methodName = String(nextValue?.methodName || '').trim();

            if (!mapName || !actionName || !phase || !componentName || !methodName) {
                return;
            }

            item.setValue?.({ mapName, actionName, phase, componentName, methodName });

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'actionCallbackByComponent',
                value: { mapName, actionName, phase, componentName, methodName },
            });
        };

        return {
            ...item,
            value: item.value || {
                mapName: context.currentActionMapName,
                actionName: context.currentActionNames[0] || '',
                phase: 'performed',
                componentName: componentNames[0] || '',
                methodName: '',
            },
            actionMapOptions: context.actionMapNames,
            actionMapOptionLabels: context.actionMapNames,
            actionOptions: context.currentActionNames,
            actionOptionLabels: context.currentActionNames,
            phaseOptions: ['started', 'performed', 'canceled'],
            phaseOptionLabels: ['started', 'performed', 'canceled'],
            componentOptions: componentNames,
            componentOptionLabels: componentNames,
            setValue: setActionCallbackByComponent,
        };
    }
}

class ColliderBoundsStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        const itemName = String(item?.name || '');
        const isColliderBoundField =
            /^Size [XYZ]$/i.test(itemName) || /^Radius$/i.test(itemName) || /^Offset [XYZ]$/i.test(itemName);
        return context.gameComponent?.NAME === 'ColliderComponent' && isColliderBoundField;
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const itemName = String(item?.name || '');
        const autoSizeItem = context.rawList.find((v) => v.name === 'Auto Size');

        return {
            ...item,
            setValue: (value: any) => {
                if (/^Size [XYZ]$/i.test(itemName) || /^Radius$/i.test(itemName)) {
                    autoSizeItem?.setValue?.(false);
                }
                item.setValue?.(value);
                const manager = context.gameComponent?.Manager;
                manager?.emitter?.emit?.('transformControl-change');
                manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            },
        };
    }
}

class RotationAxisStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        const itemName = String(item?.name || '');
        return context.isRotationAxisItem(itemName);
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        return {
            ...item,
            value: typeof item.value === 'number' ? item.value * context.radToDeg : item.value,
            setValue:
                typeof item.setValue === 'function'
                    ? (deg: number) => item.setValue!(deg * context.degToRad)
                    : undefined,
        };
    }
}

const factoryValueStrategies: IFactoryValueStrategy[] = [
    LightTypeStrategy,
    CameraFollowModeStrategy,
    SkyboxTexturesStrategy,
    InputCurrentActionMapStrategy,
    InputSetActionBindingStrategy,
    InputSetActionCallbackByNameStrategy,
    InputDispatchRegisteredEventStrategy,
    InputSetActionCallbackByComponentStrategy,
    ColliderBoundsStrategy,
    RotationAxisStrategy,
].map((Strategy) => new Strategy());

export const transformFactoryValue = (
    item: ExtendedFactoryValue,
    context: FactoryValueStrategyContext
): ExtendedFactoryValue => {
    const matchingStrategy = factoryValueStrategies.find((strategy) => strategy.canHandle(item, context));
    if (!matchingStrategy) {
        return item;
    }

    return matchingStrategy.transform(item, context);
};

export const shouldIncludeFactoryItem = (componentName: string, itemName: string): boolean => {
    if (componentName !== 'CameraComponent') {
        if (
            componentName === 'InputComponent' &&
            (/^set\s*mapping$/i.test(itemName) ||
                /^set\s*mapping\s*by\s*name$/i.test(itemName) ||
                /^set\s*mapping\s*by\s*component$/i.test(itemName) ||
                /^auto\s*bind$/i.test(itemName) ||
                /^binding\s*events$/i.test(itemName))
        ) {
            return false;
        }
        return true;
    }

    return !/^is\s*(alive|preview)$/i.test(itemName);
};
