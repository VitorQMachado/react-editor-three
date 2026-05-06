import React from 'react';
import ComponentInputFactory from './InputFactory';
import type { GroupedFactoryRow } from '../GameObjectComponent/helpers';

type GroupedFactoryFieldsProps = {
    rows: GroupedFactoryRow[];
};

export const GroupedFactoryFields = ({ rows }: GroupedFactoryFieldsProps): React.ReactElement => {
    return (
        <>
            {rows.map((row) => {
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
