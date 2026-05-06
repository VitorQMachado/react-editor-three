import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class InputSetActionBindingStrategy implements IFactoryValueStrategy {
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
