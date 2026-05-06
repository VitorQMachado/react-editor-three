import { GameComponentNameEnum } from '@vmlibs/unit_three';
import { ACTION_PHASE_OPTIONS } from '../../constants';
import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class InputSetActionCallbackByComponentStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.gameComponent?.NAME === 'InputComponent' && /^Set Action Callback By Component$/i.test(String(item?.name || ''));
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
                phase: ACTION_PHASE_OPTIONS[1],
                componentName: componentNames[0] || '',
                methodName: '',
            },
            actionMapOptions: context.actionMapNames,
            actionMapOptionLabels: context.actionMapNames,
            actionOptions: context.currentActionNames,
            actionOptionLabels: context.currentActionNames,
            phaseOptions: [...ACTION_PHASE_OPTIONS],
            phaseOptionLabels: [...ACTION_PHASE_OPTIONS],
            componentOptions: componentNames,
            componentOptionLabels: componentNames,
            setValue: setActionCallbackByComponent,
        };
    }
}
