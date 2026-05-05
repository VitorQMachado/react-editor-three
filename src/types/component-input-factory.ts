import { InputKind } from './input-kind';

export type FactoryValue = {
    name: string;
    value: any;
    inputKind?: InputKind;
    setValue?: (value: any) => void;
    options?: string[];
    optionLabels?: string[];
    callbackOptions?: string[];
    callbackOptionLabels?: string[];
    componentOptions?: string[];
    componentOptionLabels?: string[];
    actionMapOptions?: string[];
    actionMapOptionLabels?: string[];
    actionOptions?: string[];
    actionOptionLabels?: string[];
    phaseOptions?: string[];
    phaseOptionLabels?: string[];
};
