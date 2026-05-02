import { useCallback, useEffect, useRef, useState } from 'react';
import { GameManager } from '@vmlibs/unit_three';
import SidebarComponent from '../Sidebar/sidebar';
import './styles.css';
import { GameScreenComponent } from '../GameScreen/game-screen';

const getFirstPreviewCamera = (gameManager: GameManager) => {
    return gameManager.CameraComponents.find((cameraComp) => cameraComp.IsPreview);
};

const setPreviewCamera = (gameManager: GameManager, target: any) => {
    for (const cam of gameManager.CameraComponents) {
        if (cam === target) {
            if (!cam.IsPreview) cam.setPreview(true);
        } else if (cam.IsPreview) {
            cam.setPreview(false);
        }
    }
};

const ensurePreviewCamera = (gameManager: GameManager) => {
    if (gameManager.CameraComponents.some((c) => c.IsPreview)) return;
    const first = gameManager.CameraComponents[0];
    if (first) first.setPreview(true);
};

const setEditorScreenCameras = (gameManager: GameManager) => {
    const defaultCamera = gameManager.DefaultCameraComponent;
    const previewCamera = getFirstPreviewCamera(gameManager);

    defaultCamera?.setAlive(true);

    if (previewCamera) {
        previewCamera.setPreview(true);
    }
};

const setGameScreenCameras = (gameManager: GameManager) => {
    const defaultCamera = gameManager.DefaultCameraComponent;
    const gameCamera = getFirstPreviewCamera(gameManager);

    if (!gameCamera) {
        // Fallback: keep editor/default camera alive if no gameplay camera is configured yet.
        defaultCamera?.setAlive(true);
        return;
    }

    defaultCamera?.setAlive(false);
    gameCamera.setAlive(true);
};

const restoreEditorControlsAndGizmos = (gameManager: GameManager) => {
    gameManager.orbitControls.enabled = true;

    const helper = gameManager.transformControls?.getHelper?.();
    if (helper && helper.parent !== gameManager.scene) {
        gameManager.scene.add(helper);
    }
};

export const Editor = () => {
    const [gameManager, setGameManager] = useState<GameManager>();
    const [isPlaying, setIsPlaying] = useState(false);
    const isPlayingRef = useRef(false);
    const selectedGameObjectNameRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const handleOnGameLoad = useCallback((gameManager: GameManager) => {
        setGameManager(gameManager);
    }, []);

    useEffect(() => {
        if (!gameManager) {
            return;
        }

        const trackSelection = (gameObject: any) => {
            selectedGameObjectNameRef.current = gameObject?.Name;

            if (!isPlayingRef.current) {
                const cameraComp = gameObject?.GetComponent?.('CameraComponent');
                if (cameraComp) {
                    setPreviewCamera(gameManager, cameraComp);
                }
            }
        };

        gameManager.emitter.on('selectedGameObject', trackSelection);

        return () => {
            gameManager.emitter.off('selectedGameObject', trackSelection);
        };
    }, [gameManager]);

    useEffect(() => {
        if (!gameManager) {
            return;
        }

        if (!isPlaying) {
            ensurePreviewCamera(gameManager);
            setEditorScreenCameras(gameManager);
            restoreEditorControlsAndGizmos(gameManager);

            const selectedName = selectedGameObjectNameRef.current;
            if (selectedName) {
                gameManager.SelectGameObjectByName(selectedName);
            }

            const syncEditorOnUpdate = () => {
                ensurePreviewCamera(gameManager);
                setEditorScreenCameras(gameManager);
            };
            gameManager.emitter.on('updatedGameObject', syncEditorOnUpdate);

            return () => {
                gameManager.emitter.off('updatedGameObject', syncEditorOnUpdate);
            };
        }

        gameManager.transformControls?.detach();
        gameManager.RemoveAllGizmosAndHelpers();
        gameManager.orbitControls.enabled = false;
        setGameScreenCameras(gameManager);

        const syncGameplayCamera = () => setGameScreenCameras(gameManager);
        gameManager.emitter.on('updatedGameObject', syncGameplayCamera);

        return () => {
            gameManager.emitter.off('updatedGameObject', syncGameplayCamera);
        };
    }, [gameManager, isPlaying]);

    const handleTogglePlay = () => {
        if (!gameManager) {
            return;
        }

        setIsPlaying((prev) => !prev);
    };

    return (
        <div className="editor-container">
            <SidebarComponent gameManager={gameManager} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} />
            <div className={`editor-workspace ${isPlaying ? 'editor-workspace--playing' : ''}`}>
                <GameScreenComponent
                    mode={isPlaying ? 'runtime' : 'editor'}
                    title={isPlaying ? 'Game View' : 'Editor View'}
                    subtitle={isPlaying ? 'Playing in Editor Window — CameraComponent active' : 'Scene editing camera'}
                    onGameLoad={handleOnGameLoad}
                />
            </div>
        </div>
    );
};
