import { FactoryValueStrategyContext, IFactoryValueStrategy, ExtendedFactoryValue } from './types';

export class RotationAxisStrategy implements IFactoryValueStrategy {
    canHandle(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): boolean {
        return context.isRotationAxisItem(String(item?.name || ''));
    }

    transform(item: ExtendedFactoryValue, context: FactoryValueStrategyContext): ExtendedFactoryValue {
        return {
            ...item,
            value: typeof item.value === 'number' ? item.value * context.radToDeg : item.value,
            setValue:
                typeof item.setValue === 'function'
                    ? (deg: number) => item.setValue!(deg * context.degToRad)
                    : undefined,
        };
    }
}
