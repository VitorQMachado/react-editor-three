import { useMemo } from 'react';

type AnyGameComponent = any;

export const useInputActionHandlers = (gameComponent: AnyGameComponent) => {
    const factoryValuesList = useMemo(() => {
        if (!Array.isArray(gameComponent?.Factory?.valuesList)) {
            return [] as any[];
        }
        return gameComponent.Factory.valuesList;
    }, [gameComponent]);

    const setActionBindingItem = useMemo(
        () => factoryValuesList.find((item) => /^Set Action Binding$/i.test(String(item?.name || ''))),
        [factoryValuesList]
    );

    const setActionCallbackByComponentItem = useMemo(
        () => factoryValuesList.find((item) => /^Set Action Callback By Component$/i.test(String(item?.name || ''))),
        [factoryValuesList]
    );

    const persistActionMaps = (nextActionMaps: any[]) => {
        if (!gameComponent) {
            return;
        }

        gameComponent.ActionMaps = nextActionMaps;

        const manager = gameComponent?.Manager;
        manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
        manager?.emitter?.emit?.('component.updated', {
            component: gameComponent?.NAME,
            property: 'actionMaps',
            value: nextActionMaps,
        });
    };

    return {
        setActionBindingItem,
        setActionCallbackByComponentItem,
        persistActionMaps,
    };
};
