import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const RUNTIME_ONLY_KEYS = new Set(['data', 'auxParams', 'mesh', 'parentMesh', 'scene', 'domElement', 'params']);

const isPlainNumericObject = (value: any, keys: string[]) => {
    return Boolean(value) && keys.every((key) => typeof value?.[key] === 'number');
};

const serializeMathLike = (value: any) => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    if (isPlainNumericObject(value, ['x', 'y', 'z', 'w'])) {
        return { x: value.x, y: value.y, z: value.z, w: value.w };
    }

    if (isPlainNumericObject(value, ['x', 'y', 'z'])) {
        return { x: value.x, y: value.y, z: value.z };
    }

    if (Array.isArray(value?.elements)) {
        return { elements: value.elements.map((item: any) => Number(item) || 0) };
    }

    return null;
};

const serializeValue = (value: any, seen = new WeakSet()): any => {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'function' || typeof value === 'symbol') {
        return undefined;
    }

    const mathLike = serializeMathLike(value);
    if (mathLike) {
        return mathLike;
    }

    if (typeof value !== 'object') {
        return undefined;
    }

    if (
        seen.has(value) ||
        value?.isObject3D ||
        value?.isMaterial ||
        value?.isBufferGeometry ||
        value?.isTexture ||
        value?.tagName
    ) {
        return undefined;
    }

    seen.add(value);

    if (Array.isArray(value)) {
        const serializedArray = value
            .map((item) => serializeValue(item, seen))
            .filter((item) => item !== undefined);
        seen.delete(value);
        return serializedArray;
    }

    const serializedObject = Object.entries(value).reduce((acc, [key, currentValue]) => {
        if (RUNTIME_ONLY_KEYS.has(key)) {
            return acc;
        }

        const normalized = serializeValue(currentValue, seen);
        if (normalized !== undefined) {
            acc[key] = normalized;
        }
        return acc;
    }, {} as Record<string, any>);

    seen.delete(value);
    return serializedObject;
};

const serializeComponent = (component: any) => ({
    name: component?.name || '',
    options: serializeValue(component?.options) || {}
});

const serializeGameObject = (gameObject: any) => ({
    id: Number(gameObject?.id) || 0,
    name: String(gameObject?.name || ''),
    components: Object.entries(gameObject?.components || {}).reduce((acc, [key, component]) => {
        acc[key] = serializeComponent(component);
        return acc;
    }, {} as Record<string, any>),
    parent: { name: gameObject?.parent?.name || undefined },
    active: Boolean(gameObject?.active),
    destroyed: Boolean(gameObject?.destroyed),
    position: serializeMathLike(gameObject?.position) || { x: 0, y: 0, z: 0 },
    rotation: serializeMathLike(gameObject?.rotation) || { x: 0, y: 0, z: 0, w: 1 },
    transform: serializeMathLike(gameObject?.transform) || { elements: [] },
    worldTransform: serializeMathLike(gameObject?.worldTransform) || { elements: [] }
});

export const prepareGameObjectsForSave = (gameObjects: any) => {
    return Object.entries(gameObjects || {}).reduce((acc, [key, gameObject]) => {
        acc[key] = serializeGameObject(gameObject);
        return acc;
    }, {} as Record<string, any>);
};

export const stringifyGameObjectsForSave = (gameObjects: any) => JSON.stringify(prepareGameObjectsForSave(gameObjects), null, 2);

export const saveGameObjects = (gameObjects: any, saveName?: string) => {
    const normalizedGameObjects = prepareGameObjectsForSave(gameObjects);
    const headers = { 'Content-Type': 'application/json' };
    return axios.post(`${API_BASE_URL}/save-game-objects`, { gameObjects: normalizedGameObjects, saveName }, { headers })
    .then(function (response) {
        console.log(response);
        return response?.data;
    })
    .catch(function (error) {
        console.log(error);
    });
}

export const loadeGameObjects = (saveName?: string) => {console.log("API URL:", process.env.REACT_APP_API_BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    return axios.post(`${API_BASE_URL}/load-game-objects`, { saveName }, { headers })
    .then(function (response) {
        console.log(response);
        return response?.data;
    })
    .catch(function (error) {
        console.log(error);
    });
}

/*
export const getGameComponent = (gameComponent?: GameComponent) => {
    switch (gameComponent?.NAME as GameComponentName) {
        case 'MeshComponent':
            return GameComponentMeshComponent;

        case 'GrassComponent':
            return GameComponentMeshComponent;

        case 'LightComponent':
            return GameComponentLightComponent;

        case 'SkyboxComponent':
            return GameComponentSkyboxComponent;

        default:
            return;
    }
}
*/
