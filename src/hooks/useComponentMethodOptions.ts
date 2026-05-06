import { useMemo } from 'react';

type AnyGameComponent = any;

const EXCLUDED_METHODS = new Set([
    'constructor',
    'dispose',
    'destroy',
    'update',
    'init',
    'initialize',
    'start',
    'awake',
    'onenable',
    'ondisable',
    'ondestroy',
]);

export const useComponentMethodOptions = (gameComponent: AnyGameComponent) => {
    return useMemo(() => {
        const components = Array.isArray(gameComponent?.Parent?.Components) ? gameComponent.Parent.Components : [];
        const byComponent = new Map<string, string[]>();

        components.forEach((component: any) => {
            const componentName = String(component?.NAME || '').trim();
            if (!componentName || componentName === 'InputComponent') {
                return;
            }

            const methods = new Set<string>();
            Object.keys(component || {}).forEach((key) => {
                if (typeof component?.[key] === 'function') {
                    methods.add(key);
                }
            });

            let proto = Object.getPrototypeOf(component);
            while (proto && proto !== Object.prototype) {
                Object.getOwnPropertyNames(proto).forEach((name) => {
                    if (typeof component?.[name] === 'function') {
                        methods.add(name);
                    }
                });
                proto = Object.getPrototypeOf(proto);
            }

            const cleanMethods = Array.from(methods)
                .map((name) => String(name || '').trim())
                .filter(Boolean)
                .filter((name) => !name.startsWith('_'))
                .filter((name) => !EXCLUDED_METHODS.has(name.toLowerCase()))
                .sort((a, b) => a.localeCompare(b));

            if (cleanMethods.length) {
                byComponent.set(componentName, cleanMethods);
            }
        });

        return byComponent;
    }, [gameComponent]);
};
