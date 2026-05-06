import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class ColliderBoundsStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        const itemName = String(item?.name || '');
        const isColliderBoundField =
            /^Size [XYZ]$/i.test(itemName) || /^Radius$/i.test(itemName) || /^Offset [XYZ]$/i.test(itemName);
        return context.gameComponent?.NAME === 'ColliderComponent' && isColliderBoundField;
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const itemName = String(item?.name || '');
        const autoSizeItem = context.rawList.find((value) => value.name === 'Auto Size');

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
