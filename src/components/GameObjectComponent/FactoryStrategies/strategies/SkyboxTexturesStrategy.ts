import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class SkyboxTexturesStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.gameComponent?.NAME === 'SkyboxComponent' && /^Textures$/i.test(String(item?.name || ''));
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        const setSkyboxTextures = (nextTextures: Record<string, string>) => {
            const runtimeTextures = Object.entries(nextTextures || {}).reduce(
                (acc, [key, texturePath]) => {
                    acc[key] = String(texturePath || '');
                    return acc;
                },
                {} as Record<string, string>
            );

            console.log('[skybox] updated textures', {
                gameObject: context.gameComponent?.Parent?.Name,
                runtimeTextures,
                sourceTextures: Object.entries(runtimeTextures).reduce(
                    (acc, [key, texturePath]) => {
                        acc[key] = context.getOriginalPathForBlob(texturePath);
                        return acc;
                    },
                    {} as Record<string, string>
                ),
            });

            if (typeof item.setValue === 'function') {
                item.setValue(runtimeTextures);
            }

            const params = context.gameComponent?.params || {};
            params.options = {
                ...(params.options || {}),
                textures: runtimeTextures,
            };
            if (!params.parentMesh && context.gameComponent?.Manager?.scene) {
                params.parentMesh = context.gameComponent.Manager.scene;
            }

            if (typeof context.gameComponent?.loadSkybox === 'function') {
                context.gameComponent.loadSkybox(params);
            }

            const manager = context.gameComponent?.Manager;
            manager?.emitter?.emit?.('updatedGameObject', context.gameComponent?.Parent);
            manager?.emitter?.emit?.('component.updated', {
                component: context.gameComponent?.NAME,
                property: 'Textures',
                value: Object.entries(runtimeTextures).reduce(
                    (acc, [key, texturePath]) => {
                        acc[key] = context.getOriginalPathForBlob(texturePath);
                        return acc;
                    },
                    {} as Record<string, string>
                ),
            });
        };

        return {
            ...item,
            value: item.value || {},
            setValue: setSkyboxTextures,
        };
    }
}
