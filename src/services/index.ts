

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
        if (typeof value === 'string' && value.startsWith('blob:')) {
            return blobToOriginalPath.get(value) ?? value;
        }
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

const normalizeLoadedGameObjects = (payload: any) => {
    // Accept both the new direct map format and legacy { gameObjects: ... } payloads.
    if (payload && typeof payload === 'object' && payload.gameObjects && typeof payload.gameObjects === 'object') {
        return payload.gameObjects;
    }

    return payload;
};

const safeNumber = (value: any, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeVector3 = (value: any) => ({
    x: safeNumber(value?.x, 0),
    y: safeNumber(value?.y, 0),
    z: safeNumber(value?.z, 0)
});

const normalizeVector4 = (value: any) => ({
    x: safeNumber(value?.x, 0),
    y: safeNumber(value?.y, 0),
    z: safeNumber(value?.z, 0),
    w: safeNumber(value?.w, 1)
});

const normalizeMatrixLike = (value: any) => {
    const elements = Array.isArray(value?.elements)
        ? value.elements.map((item: any) => safeNumber(item, 0))
        : [];
    return { elements };
};

const sanitizeLoadedGameObjects = (payload: any) => {
    if (!payload || typeof payload !== 'object') {
        return {};
    }

    return Object.entries(payload).reduce((acc, [key, rawObject], index) => {
        const source = (rawObject && typeof rawObject === 'object') ? rawObject as Record<string, any> : {};

        acc[key] = {
            ...source,
            id: safeNumber(source.id, index + 1),
            name: String(source.name || key),
            components: (source.components && typeof source.components === 'object') ? source.components : {},
            parent: {
                name: source.parent?.name ? String(source.parent.name) : undefined
            },
            active: source.active !== undefined ? Boolean(source.active) : true,
            destroyed: Boolean(source.destroyed),
            position: normalizeVector3(source.position),
            rotation: normalizeVector4(source.rotation),
            transform: normalizeMatrixLike(source.transform),
            worldTransform: normalizeMatrixLike(source.worldTransform)
        };

        return acc;
    }, {} as Record<string, any>);
};

export const parseLoadedGameObjectsText = (text: string) => {
    const parsed = JSON.parse(text);
    const normalized = normalizeLoadedGameObjects(parsed);
    return sanitizeLoadedGameObjects(normalized);
};

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg']);
const blobToOriginalPath = new Map<string, string>();

export const fileToBlobUrl = (file: File, originalPath?: string) => {
    const blobUrl = URL.createObjectURL(file);
    const normalizedOriginalPath = String(originalPath || file.name || '').trim();
    if (normalizedOriginalPath) {
        blobToOriginalPath.set(blobUrl, normalizedOriginalPath);
    }
    return blobUrl;
};

export const registerBlobOriginalPath = (blobUrl: string, originalPath: string) => {
    blobToOriginalPath.set(blobUrl, originalPath);
};

export const getOriginalPathForBlob = (value: string) => {
    if (typeof value !== 'string' || !value.startsWith('blob:')) {
        return value;
    }
    return blobToOriginalPath.get(value) || value;
};
const SAVED_FOLDER_DB = 'react-editor-three-fs';
const SAVED_FOLDER_STORE = 'handles';
const SAVED_FOLDER_KEY = 'last-load-directory';
const LAST_LOAD_JSON_NAME_KEY = 'react-editor-three:last-load-json-name';

type LoadGameObjectsOptions = {
    forcePickFolder?: boolean;
    forcePickJson?: boolean;
    useStoredOnly?: boolean;
};

const normalizePath = (pathValue: string) => pathValue.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();

const getFileExtension = (filePath: string) => {
    const normalized = normalizePath(filePath);
    const parts = normalized.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
};

const isImagePath = (value: string) => IMAGE_EXTENSIONS.has(getFileExtension(value));

const stripCommonPrefixes = (pathValue: string) => {
    const normalized = normalizePath(pathValue);
    return [
        normalized,
        normalized.replace(/^assets\//, ''),
        normalized.replace(/^img\//, ''),
        normalized.replace(/^assets\/img\//, ''),
        normalized.replace(/^public\//, ''),
        normalized.replace(/^public\/assets\//, ''),
        normalized.replace(/^public\/assets\/img\//, '')
    ];
};

const findImageUrlForPath = async (
    originalPath: string,
    imageFileMap: Map<string, FileSystemFileHandle>,
    propertyPath: Array<string | number> = []
) => {
    const candidates = stripCommonPrefixes(originalPath);
    const fileName = normalizePath(originalPath).split('/').pop();
    if (fileName) {
        candidates.push(fileName);
    }

    for (const candidate of candidates) {
        const fileHandle = imageFileMap.get(candidate);
        if (!fileHandle) {
            continue;
        }
        const file = await fileHandle.getFile();
        console.log('[load-texture] resolved', {
            requestedPath: originalPath,
            matchedCandidate: candidate,
            resolvedFileName: file.name
        });
        return fileToBlobUrl(file, originalPath);
    }

    console.warn('[load-texture] missing', {
        requestedPath: originalPath,
        attemptedCandidates: candidates
    });
    return originalPath;
};

const remapTexturePaths = async (
    payload: any,
    imageFileMap: Map<string, FileSystemFileHandle>,
    propertyPath: Array<string | number> = []
): Promise<any> => {
    if (payload === null || payload === undefined) {
        return payload;
    }

    if (typeof payload === 'string') {
        if (isImagePath(payload)) {
            return findImageUrlForPath(payload, imageFileMap, propertyPath);
        }
        return payload;
    }

    if (typeof payload !== 'object') {
        return payload;
    }

    if (Array.isArray(payload)) {
        const remappedArray = await Promise.all(
            payload.map((item, index) => remapTexturePaths(item, imageFileMap, [...propertyPath, index]))
        );
        return remappedArray;
    }

    const remappedObject: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
        remappedObject[key] = await remapTexturePaths(value, imageFileMap, [...propertyPath, key]);
    }

    return remappedObject;
};

const openFolderDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(SAVED_FOLDER_DB, 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(SAVED_FOLDER_STORE)) {
                db.createObjectStore(SAVED_FOLDER_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const clearStoredDirectoryHandle = async () => {
    try {
        const db = await openFolderDb();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(SAVED_FOLDER_STORE, 'readwrite');
            const store = transaction.objectStore(SAVED_FOLDER_STORE);
            store.delete(SAVED_FOLDER_KEY);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
        db.close();
    } catch {
        // best-effort, non-critical
    }
};

const storeHandleByKey = async (key: string, handle: FileSystemDirectoryHandle) => {
    const db = await openFolderDb();
    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(SAVED_FOLDER_STORE, 'readwrite');
        const store = transaction.objectStore(SAVED_FOLDER_STORE);
        store.put(handle, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
    db.close();
};

const getGrantedHandleByKey = async (key: string): Promise<FileSystemDirectoryHandle | undefined> => {
    try {
        const db = await openFolderDb();
        const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
            const transaction = db.transaction(SAVED_FOLDER_STORE, 'readonly');
            const store = transaction.objectStore(SAVED_FOLDER_STORE);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result as FileSystemDirectoryHandle | undefined);
            request.onerror = () => reject(request.error);
        });
        db.close();

        if (!handle) return undefined;

        const mode = { mode: 'read' as const };
        const perm = await (handle as any).queryPermission?.(mode);
        if (perm === 'granted') return handle;
        if (perm === 'prompt') {
            const req = await (handle as any).requestPermission?.(mode);
            if (req === 'granted') return handle;
        }
    } catch {
        return undefined;
    }
    return undefined;
};

const pickDirectoryHandle = async () => {
    const picked = await (window as any).showDirectoryPicker({ mode: 'read' });
    await storeHandleByKey(SAVED_FOLDER_KEY, picked as FileSystemDirectoryHandle);
    try {
        localStorage.setItem('react-editor-three:last-load-folder-name', (picked as FileSystemDirectoryHandle).name);
    } catch {
        // non-critical if localStorage is unavailable
    }
    return picked as FileSystemDirectoryHandle;
};

const getDirectoryHandleForLoad = async (forcePickFolder = false, useStoredOnly = false) => {
    if (forcePickFolder) {
        return pickDirectoryHandle();
    }

    const reusable = await getGrantedHandleByKey(SAVED_FOLDER_KEY);
    if (reusable) {
        return reusable;
    }

    if (useStoredOnly) {
        return undefined;
    }

    return pickDirectoryHandle();
};

const listDirectoryEntries = async (directoryHandle: FileSystemDirectoryHandle): Promise<FileSystemHandle[]> => {
    const dirAny = directoryHandle as any;

    if (typeof dirAny.values === 'function') {
        const entries: FileSystemHandle[] = [];
        for await (const entryHandle of dirAny.values()) {
            entries.push(entryHandle as FileSystemHandle);
        }
        return entries;
    }

    if (typeof dirAny.entries === 'function') {
        const entries: FileSystemHandle[] = [];
        for await (const [, entryHandle] of dirAny.entries()) {
            entries.push(entryHandle as FileSystemHandle);
        }
        return entries;
    }

    throw new Error('Directory listing is not supported by this browser.');
};

const collectFilesFromDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
    currentPath = ''
): Promise<Array<{ path: string; handle: FileSystemFileHandle }>> => {
    const files: Array<{ path: string; handle: FileSystemFileHandle }> = [];

    const entries = await listDirectoryEntries(directoryHandle);
    for (const entryHandle of entries) {
        const entryName = entryHandle.name;
        const entryPath = currentPath ? `${currentPath}/${entryName}` : entryName;
        if (entryHandle.kind === 'file') {
            files.push({ path: normalizePath(entryPath), handle: entryHandle as FileSystemFileHandle });
        } else {
            const nestedFiles = await collectFilesFromDirectory(entryHandle as FileSystemDirectoryHandle, entryPath);
            files.push(...nestedFiles);
        }
    }

    return files;
};

const buildImageFileMap = (
    files: Array<{ path: string; handle: FileSystemFileHandle }>,
    rootPath = ''
) => {
    const imageFileMap = new Map<string, FileSystemFileHandle>();
    files.forEach((entry) => {
        if (!IMAGE_EXTENSIONS.has(getFileExtension(entry.path))) {
            return;
        }
        const localPath = rootPath && entry.path.startsWith(`${rootPath}/`)
            ? entry.path.slice(rootPath.length + 1)
            : entry.path;

        imageFileMap.set(localPath, entry.handle);
        stripCommonPrefixes(localPath).forEach((candidate) => imageFileMap.set(candidate, entry.handle));
        const fileName = localPath.split('/').pop();
        if (fileName) {
            imageFileMap.set(fileName, entry.handle);
        }
    });
    return imageFileMap;
};

const findJsonEntry = (
    files: Array<{ path: string; handle: FileSystemFileHandle }>,
    jsonFileName?: string
) => {
    const normalizedJsonFileName = jsonFileName ? normalizePath(jsonFileName) : undefined;
    return normalizedJsonFileName
        ? (files.find((entry) => entry.path.endsWith(normalizedJsonFileName)) || undefined)
        : undefined;
};

const getFilesForDirectoryHandle = async (directoryHandle: FileSystemDirectoryHandle) => {
    const allFiles = await collectFilesFromDirectory(directoryHandle);
    console.log('[load-json] scanned directory', {
        directoryName: directoryHandle.name,
        totalFiles: allFiles.length,
        jsonFiles: allFiles.filter((entry) => getFileExtension(entry.path) === 'json').map((entry) => entry.path)
    });
    return allFiles;
};

const resolveDirectoryFilesForJson = async (jsonFileName: string) => {
    const reusable = await getGrantedHandleByKey(SAVED_FOLDER_KEY);
    if (reusable) {
        const reusableFiles = await getFilesForDirectoryHandle(reusable);
        const existingJson = findJsonEntry(reusableFiles, jsonFileName);
        if (existingJson) {
            console.log('[load-json] using stored folder handle', {
                folderName: reusable.name,
                matchedJson: existingJson.path
            });
            return { directoryHandle: reusable, allFiles: reusableFiles, selectedJson: existingJson };
        }
        console.warn('[load-json] stored folder does not contain selected json', {
            folderName: reusable.name,
            requestedJson: jsonFileName
        });
    }

    const pickedDirectory = await pickDirectoryHandle();
    const pickedFiles = await getFilesForDirectoryHandle(pickedDirectory);
    const pickedJson = findJsonEntry(pickedFiles, jsonFileName);
    if (!pickedJson) {
        throw new Error(`Selected folder does not contain ${jsonFileName}.`);
    }

    console.log('[load-json] using repicked folder handle', {
        folderName: pickedDirectory.name,
        matchedJson: pickedJson.path
    });
    return { directoryHandle: pickedDirectory, allFiles: pickedFiles, selectedJson: pickedJson };
};

const loadGameObjectsFromDirectory = async (jsonFileName?: string, options?: LoadGameObjectsOptions) => {
    const directoryHandle = await getDirectoryHandleForLoad(Boolean(options?.forcePickFolder), Boolean(options?.useStoredOnly));
    if (!directoryHandle) {
        throw new Error('No stored load folder available.');
    }

    const allFiles = await getFilesForDirectoryHandle(directoryHandle);
    const jsonCandidates = allFiles.filter((entry) => getFileExtension(entry.path) === 'json');

    if (jsonCandidates.length === 0) {
        await clearStoredDirectoryHandle();
        throw new Error('No JSON save file found in selected folder.');
    }

    const selectedJson = findJsonEntry(jsonCandidates, jsonFileName) || jsonCandidates[0];
    const jsonFolderPath = selectedJson.path.includes('/')
        ? selectedJson.path.slice(0, selectedJson.path.lastIndexOf('/'))
        : '';

    const saveFile = await selectedJson.handle.getFile();
    const saveText = await saveFile.text();
    const parsed = parseLoadedGameObjectsText(saveText);

    // Only use files from the selected JSON folder as the texture root.
    const imageFileMap = buildImageFileMap(allFiles, jsonFolderPath);
    console.log('[load-json] prepared image map from folder load', {
        selectedJson: selectedJson.path,
        jsonFolderPath,
        imageEntries: imageFileMap.size
    });

    return remapTexturePaths(parsed, imageFileMap);
};

const loadGameObjectsFromPickedJson = async () => {
    const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        multiple: false
    });

    const file = await fileHandle.getFile();
    const text = await file.text();
    const parsed = parseLoadedGameObjectsText(text);

    try {
        localStorage.setItem(LAST_LOAD_JSON_NAME_KEY, file.name);
    } catch {
        // non-critical if localStorage is unavailable
    }

    console.log('[load-json] picked json file', { fileName: file.name });

    const { allFiles, selectedJson } = await resolveDirectoryFilesForJson(file.name);

    const jsonFolderPath = selectedJson.path.includes('/')
        ? selectedJson.path.slice(0, selectedJson.path.lastIndexOf('/'))
        : '';
    const imageFileMap = buildImageFileMap(allFiles, jsonFolderPath);
    console.log('[load-json] prepared image map from picked json', {
        selectedJson: selectedJson.path,
        jsonFolderPath,
        imageEntries: imageFileMap.size
    });

    return remapTexturePaths(parsed, imageFileMap);
};

export const getStoredLoadJsonName = () => {
    try {
        return localStorage.getItem(LAST_LOAD_JSON_NAME_KEY) || undefined;
    } catch {
        return undefined;
    }
};

export const pickProjectFolder = async (): Promise<string> => {
    const picked = await (window as any).showDirectoryPicker({ mode: 'read' });
    await storeHandleByKey(SAVED_FOLDER_KEY, picked as FileSystemDirectoryHandle);
    try {
        localStorage.setItem('react-editor-three:last-load-folder-name', (picked as FileSystemDirectoryHandle).name);
    } catch {
        // non-critical if localStorage is unavailable
    }
    return (picked as FileSystemDirectoryHandle).name;
};

export const saveGameObjects = async (gameObjects: any, saveName?: string): Promise<{ success: boolean } | undefined> => {
    const json = stringifyGameObjectsForSave(gameObjects);
    const blob = new Blob([json], { type: 'application/json' });

    if ('showSaveFilePicker' in window) {
        try {
            const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: `${saveName || 'save'}.json`,
                types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return { success: true };
        } catch (err: any) {
            if (err.name === 'AbortError') return undefined;
            throw err;
        }
    }

    return undefined;
};

export const loadeGameObjects = async (jsonFileName?: string, options?: LoadGameObjectsOptions): Promise<any> => {
    if (options?.forcePickJson && 'showOpenFilePicker' in window) {
        try {
            return await loadGameObjectsFromPickedJson();
        } catch (err: any) {
            if (err?.name === 'AbortError') return undefined;
            throw err;
        }
    }

    if ('showDirectoryPicker' in window) {
        try {
            return await loadGameObjectsFromDirectory(jsonFileName, options);
        } catch (err: any) {
            if (err?.name === 'AbortError') return undefined;
            if (String(err?.message).includes('No stored load folder available')) {
                return undefined;
            }
            // Stored folder had no JSON — auto-retry by opening folder picker immediately
            if (String(err?.message).includes('No JSON save file found') && !options?.forcePickFolder) {
                return loadGameObjectsFromDirectory(jsonFileName, { forcePickFolder: true });
            }
            throw err;
        }
    }

    if ('showOpenFilePicker' in window) {
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
                multiple: false
            });
            const file = await fileHandle.getFile();
            const text = await file.text();
            return parseLoadedGameObjectsText(text);
        } catch (err: any) {
            if (err.name === 'AbortError') return undefined;
            throw err;
        }
    }

    return undefined;
};

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
