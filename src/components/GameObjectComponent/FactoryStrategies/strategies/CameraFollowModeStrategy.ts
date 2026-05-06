import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class CameraFollowModeStrategy implements IFactoryValueStrategy {
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
