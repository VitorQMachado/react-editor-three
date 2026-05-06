import React, { useMemo, useState } from 'react';
import ComponentInputFactory from './InputFactory';
import { getOriginalPathForBlob } from '../../services';
import {
    buildGroupedFactoryRows,
    isRotationAxisItem,
    type GroupedFactoryRow,
} from '../GameObjectComponent/helpers';
import {
    CAMERA_FOLLOW_MODE_OPTIONS,
    DEG_TO_RAD,
    LIGHT_TYPE_OPTIONS,
    RAD_TO_DEG,
} from '../GameObjectComponent/constants';
import {
    shouldIncludeFactoryItem,
    transformFactoryValue,
} from '../GameObjectComponent/FactoryStrategies/factoryValueStrategies';
import { useInputActionMaps } from '../../hooks/useInputActionMaps';

type GroupedFactoryFieldsProps = {
    gameComponent: any;
};

export const GroupedFactoryFields = ({ gameComponent }: GroupedFactoryFieldsProps): React.ReactElement => {
    const [registeredActionCallbackNames, setRegisteredActionCallbackNames] = useState<string[]>([]);
    const { actionMapNames, currentActionMapName, currentActionNames } = useInputActionMaps(gameComponent);

    const callbackNameOptions = useMemo(() => registeredActionCallbackNames, [registeredActionCallbackNames]);

    const factory = gameComponent?.Factory;
    const rawList = useMemo(
        () =>
            (factory?.valuesList || []).filter((item: any) => {
                const itemName = item.name || '';
                return shouldIncludeFactoryItem(gameComponent.NAME, itemName);
            }),
        [factory?.valuesList, gameComponent.NAME]
    );

    const lightTypeOptions = [...LIGHT_TYPE_OPTIONS];
    const cameraFollowModeOptions = [...CAMERA_FOLLOW_MODE_OPTIONS];

    const valuesList = useMemo(
        () =>
            rawList.map((item) =>
                transformFactoryValue(item, {
                    gameComponent,
                    rawList,
                    currentActionMapName,
                    currentActionNames,
                    actionMapNames,
                    callbackNameOptions,
                    lightTypeOptions,
                    cameraFollowModeOptions,
                    registerActionCallbackName: (callbackName: string) => {
                        setRegisteredActionCallbackNames((prev) =>
                            prev.includes(callbackName) ? prev : [...prev, callbackName]
                        );
                    },
                    getOriginalPathForBlob,
                    isRotationAxisItem,
                    radToDeg: RAD_TO_DEG,
                    degToRad: DEG_TO_RAD,
                })
            ),
        [
            actionMapNames,
            callbackNameOptions,
            cameraFollowModeOptions,
            currentActionMapName,
            currentActionNames,
            gameComponent,
            lightTypeOptions,
            rawList,
        ]
    );

    const groupedRows: GroupedFactoryRow[] = useMemo(() => buildGroupedFactoryRows(valuesList), [valuesList]);

    return (
        <>
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
        </>
    );
};
