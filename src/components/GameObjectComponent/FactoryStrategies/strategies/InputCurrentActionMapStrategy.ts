import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class InputCurrentActionMapStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.gameComponent?.NAME === 'InputComponent' && /^Current Action Map$/i.test(String(item?.name || ''));
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
