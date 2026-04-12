import ComponentInputFactory from './ComponentInputFactory';
import './styles.css';

export const GameObjectComponent = ({ gameComponent }: { gameComponent: any }) => {
    const factory = gameComponent?.Factory;
    const rawList: any[] = factory?.valuesList || [];

    const valuesList = rawList.map((item) => {
        const itemName = item.name || '';
        const isColliderBoundField = /^Size [XYZ]$/i.test(itemName) || /^Radius$/i.test(itemName) || /^Offset [XYZ]$/i.test(itemName);
        if (
            gameComponent.NAME === 'ColliderComponent' &&
            isColliderBoundField
        ) {
            const autoSizeItem = rawList.find((v) => v.name === 'Auto Size');
            return {
                ...item,
                setValue: (value: any) => {
                    if (/^Size [XYZ]$/i.test(itemName) || /^Radius$/i.test(itemName)) {
                        autoSizeItem?.setValue?.(false);
                    }
                    item.setValue?.(value);
                    const manager = gameComponent?.Manager;
                    manager?.emitter?.emit?.('transformControl-change');
                    manager?.emitter?.emit?.('updatedGameObject', gameComponent?.Parent);
                }
            };
        }
        return item;
    });

    const groupedRows: Array<
        | { type: 'single'; item: any }
        | { type: 'xyz'; label: string; x: any; y: any; z: any }
    > = [];

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
                z: valuesList[byAxis.Z]
            });
            usedIndices.add(byAxis.X);
            usedIndices.add(byAxis.Y);
            usedIndices.add(byAxis.Z);
            return;
        }

        groupedRows.push({ type: 'single', item });
        usedIndices.add(index);
    });

    return (
        <div key={`game-object-component-${gameComponent.NAME}`} className="inspector-component">
            <div className="inspector-component__title">{gameComponent.NAME}</div>
            <div className="inspector-component__fields">
                {groupedRows.map((row) => {
                    if (row.type === 'single') {
                        return (
                            <div key={row.item.name} className="inspector-component__field">
                                <label className="inspector-component__field-label">{row.item.name}</label>
                                <ComponentInputFactory item={row.item} />
                            </div>
                        );
                    }

                    return (
                        <div key={row.label} className="inspector-component__field inspector-component__field--xyz">
                            <label className="inspector-component__field-label">{row.label}</label>
                            <div className="inspector-component__xyz-inputs">
                                <div className="inspector-component__xyz-input">
                                    <label className="inspector-vector-inputs__label">X</label>
                                    <ComponentInputFactory item={row.x} />
                                </div>
                                <div className="inspector-component__xyz-input">
                                    <label className="inspector-vector-inputs__label">Y</label>
                                    <ComponentInputFactory item={row.y} />
                                </div>
                                <div className="inspector-component__xyz-input">
                                    <label className="inspector-vector-inputs__label">Z</label>
                                    <ComponentInputFactory item={row.z} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
