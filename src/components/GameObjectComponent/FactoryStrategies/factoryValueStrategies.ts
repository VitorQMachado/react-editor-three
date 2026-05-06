import {
    CameraFollowModeStrategy,
    ColliderBoundsStrategy,
    FactoryValueContext,
    InputCurrentActionMapStrategy,
    InputDispatchRegisteredEventStrategy,
    InputSetActionBindingStrategy,
    InputSetActionCallbackByComponentStrategy,
    InputSetActionCallbackByNameStrategy,
    LightTypeStrategy,
    RotationAxisStrategy,
    SkyboxTexturesStrategy,
    type ExtendedFactoryValue,
    type FactoryValueStrategyContext,
    type IFactoryValueStrategy,
} from './strategies';

const factoryValueStrategies: IFactoryValueStrategy[] = [
    LightTypeStrategy,
    CameraFollowModeStrategy,
    SkyboxTexturesStrategy,
    InputCurrentActionMapStrategy,
    InputSetActionBindingStrategy,
    InputSetActionCallbackByNameStrategy,
    InputDispatchRegisteredEventStrategy,
    InputSetActionCallbackByComponentStrategy,
    ColliderBoundsStrategy,
    RotationAxisStrategy,
].map((Strategy) => new Strategy());

export const transformFactoryValue = (
    item: ExtendedFactoryValue,
    context: FactoryValueStrategyContext
): ExtendedFactoryValue => {
    const matchingStrategy = factoryValueStrategies.find((strategy) => strategy.canHandle(item, context));
    if (!matchingStrategy) {
        return item;
    }

    const ctx = new FactoryValueContext(matchingStrategy);
    return ctx.transform(item, context);
};

export const shouldIncludeFactoryItem = (componentName: string, itemName: string): boolean => {
    if (componentName !== 'CameraComponent') {
        if (
            componentName === 'InputComponent' &&
            (/^set\s*mapping$/i.test(itemName) ||
                /^set\s*mapping\s*by\s*name$/i.test(itemName) ||
                /^set\s*mapping\s*by\s*component$/i.test(itemName) ||
                /^auto\s*bind$/i.test(itemName) ||
                /^binding\s*events$/i.test(itemName))
        ) {
            return false;
        }
        return true;
    }

    return !/^is\s*(alive|preview)$/i.test(itemName);
};
