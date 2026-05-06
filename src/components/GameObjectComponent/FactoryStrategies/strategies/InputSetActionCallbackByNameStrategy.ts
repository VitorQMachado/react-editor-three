import { ACTION_PHASE_OPTIONS } from '../../constants';
import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class InputSetActionCallbackByNameStrategy implements IFactoryValueStrategy {
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
                phase: ACTION_PHASE_OPTIONS[1],
                callbackName: context.callbackNameOptions[0] || '',
            },
            actionMapOptions: context.actionMapNames,
            actionMapOptionLabels: context.actionMapNames,
            actionOptions: context.currentActionNames,
            actionOptionLabels: context.currentActionNames,
            phaseOptions: [...ACTION_PHASE_OPTIONS],
            phaseOptionLabels: [...ACTION_PHASE_OPTIONS],
            callbackOptions: context.callbackNameOptions,
            callbackOptionLabels: context.callbackNameOptions,
            setValue: setActionCallbackByName,
        };
    }
}
