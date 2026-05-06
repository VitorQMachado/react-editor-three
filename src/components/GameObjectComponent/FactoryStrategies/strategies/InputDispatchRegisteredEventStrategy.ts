import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class InputDispatchRegisteredEventStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.gameComponent?.NAME === 'InputComponent' && /^Dispatch Registered Event$/i.test(String(item?.name || ''));
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
