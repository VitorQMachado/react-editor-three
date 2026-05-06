import { FollowMode, IFactoryValue } from '@vmlibs/unit_three';

export type ExtendedFactoryValue = IFactoryValue & Record<string, any>;

export type FactoryValueStrategyContext = {
    gameComponent: any;
    rawList: ExtendedFactoryValue[];
    currentActionMapName: string;
    currentActionNames: string[];
    actionMapNames: string[];
    callbackNameOptions: string[];
    lightTypeOptions: string[];
    cameraFollowModeOptions: FollowMode[];
    registerActionCallbackName: (name: string) => void;
    getOriginalPathForBlob: (path: string) => string;
    isRotationAxisItem: (name: string) => boolean;
    radToDeg: number;
    degToRad: number;
};

export interface IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean;
    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue;
}

export class FactoryValueContext {
    private strategy: IFactoryValueStrategy;

    constructor(strategy: IFactoryValueStrategy) {
        this.strategy = strategy;
    }

    public setStrategy(strategy: IFactoryValueStrategy): void {
        this.strategy = strategy;
    }

    public transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        return this.strategy.transform(item, context);
    }
}
