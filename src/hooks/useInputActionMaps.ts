import { useMemo } from 'react';
import { DEFAULT_INPUT_ACTIONS } from '../components/GameObjectComponent/constants';

type AnyGameComponent = any;

export const useInputActionMaps = (gameComponent: AnyGameComponent) => {
    const actionMaps = useMemo(() => {
        if (!Array.isArray(gameComponent?.ActionMaps)) {
            return [] as any[];
        }
        return gameComponent.ActionMaps;
    }, [gameComponent?.ActionMaps]);

    const actionMapNames = useMemo(
        () => actionMaps.map((map) => String(map?.name || '')).filter(Boolean),
        [actionMaps]
    );

    const currentActionMapName =
        String(gameComponent?.CurrentActionMap || actionMapNames[0] || 'Gameplay').trim() || 'Gameplay';

    const currentActionMap = useMemo(
        () => actionMaps.find((map) => String(map?.name || '') === currentActionMapName),
        [actionMaps, currentActionMapName]
    );

    const currentActionNames = useMemo(() => {
        if (!currentActionMap || !Array.isArray(currentActionMap.actions)) {
            return [...DEFAULT_INPUT_ACTIONS];
        }

        const names = currentActionMap.actions.map((action: any) => String(action?.name || '')).filter(Boolean);
        return names.length ? names : [...DEFAULT_INPUT_ACTIONS];
    }, [currentActionMap]);

    return {
        actionMaps,
        actionMapNames,
        currentActionMapName,
        currentActionMap,
        currentActionNames,
    };
};
