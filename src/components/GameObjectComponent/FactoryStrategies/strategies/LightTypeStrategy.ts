import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class LightTypeStrategy implements IFactoryValueStrategy {
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
