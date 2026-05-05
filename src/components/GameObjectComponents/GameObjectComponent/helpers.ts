import { IFactoryValue } from '@vmlibs/unit_three';

export type GroupedFactoryRow =
    | { type: 'single'; item: IFactoryValue }
    | { type: 'xyz'; label: string; x: IFactoryValue; y: IFactoryValue; z: IFactoryValue };

export const isRotationAxisItem = (name: string) => /rotation/i.test(name) && /\s[XYZ]$/i.test(name);

export const extractBindingPathFromAction = (action: any): string => {
    if (!action || typeof action !== 'object') {
        return '';
    }

    if (typeof action.path === 'string' && action.path.trim()) {
        return action.path.trim();
    }

    const candidates = [action.bindings, action.Bindings, action.binding, action.Binding];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const first = candidate.find((entry: any) => typeof entry?.path === 'string' && entry.path.trim());
            if (first?.path) {
                return String(first.path).trim();
            }
        }

        if (candidate && typeof candidate === 'object' && typeof (candidate as any).path === 'string') {
            const nestedPath = String((candidate as any).path || '').trim();
            if (nestedPath) {
                return nestedPath;
            }
        }
    }

    return '';
};

export const buildGroupedFactoryRows = (valuesList: IFactoryValue[]): GroupedFactoryRow[] => {
    const groupedRows: GroupedFactoryRow[] = [];
    const usedIndices = new Set<number>();

    valuesList.forEach((item, index) => {
        if (usedIndices.has(index)) {
            return;
        }

        const match = item.name?.match(/^(.*)\s([XYZ])$/i);
        if (!match) {
            groupedRows.push({ type: 'single', item });
            usedIndices.add(index);
            return;
        }

        const baseName = match[1].trim();
        const byAxis = { X: -1, Y: -1, Z: -1 };

        valuesList.forEach((candidate, candidateIndex) => {
            const axisMatch = candidate.name?.match(/^(.*)\s([XYZ])$/i);
            if (!axisMatch) return;

            const candidateBase = axisMatch[1].trim();
            const axis = axisMatch[2].toUpperCase() as 'X' | 'Y' | 'Z';

            if (candidateBase === baseName) {
                byAxis[axis] = candidateIndex;
            }
        });

        if (byAxis.X >= 0 && byAxis.Y >= 0 && byAxis.Z >= 0) {
            groupedRows.push({
                type: 'xyz',
                label: baseName,
                x: valuesList[byAxis.X],
                y: valuesList[byAxis.Y],
                z: valuesList[byAxis.Z],
            });
            usedIndices.add(byAxis.X);
            usedIndices.add(byAxis.Y);
            usedIndices.add(byAxis.Z);
            return;
        }

        groupedRows.push({ type: 'single', item });
        usedIndices.add(index);
    });

    return groupedRows;
};
