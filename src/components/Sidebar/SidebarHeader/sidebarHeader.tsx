import { THREE } from '@vmlibs/unit_three'
import React, { useEffect, useRef, useState } from 'react'
import { loadeGameObjects, parseLoadedGameObjectsText, pickProjectFolder, saveGameObjects, stringifyGameObjectsForSave } from '../../../services'
import './styles.css'

type GameManagerLike = any
type TransformMode = 'translate' | 'rotate' | 'scale'
type CreatePreset = 'default' | 'sphere' | 'cube' | 'plane' | 'skybox'
const DEFAULT_SAVE_NAME = 'wargame'
const PROJECT_NAME_KEY = 'react-editor-three:project-name'

export const SidebarHeader = ({ gameManager }: { gameManager: GameManagerLike }) => {
  const [transformMode, setTransformMode] = useState<TransformMode>('translate')
  const [isFpsVisible, setIsFpsVisible] = useState(false)
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [saveLabel, setSaveLabel] = useState('')
  const [projectName, setProjectName] = useState(() => {
    try {
      return localStorage.getItem(PROJECT_NAME_KEY) || DEFAULT_SAVE_NAME
    } catch {
      return DEFAULT_SAVE_NAME
    }
  })
  const loadFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const currentMode = gameManager?.transformControls?.getMode?.()
    if (currentMode === 'translate' || currentMode === 'rotate' || currentMode === 'scale') {
      setTransformMode(currentMode)
    }
  }, [gameManager])

  const createWithPreset = (preset: CreatePreset) => {
    const suffix = preset === 'default' ? 'GameObject' : preset[0].toUpperCase() + preset.slice(1)
    const gameObjectName = `${suffix}-${Date.now()}`
    gameManager.AddNewGameObject(gameObjectName)

    if (preset === 'skybox') {
      const created = gameManager.GetGameObjectByName(gameObjectName)
      if (created) {
        gameManager.AddGameComponent('SkyboxComponent', {
          options: {
            size: 150,
            position: { x: 0, y: 0, z: 0 }
          }
        }, created)
      }

      gameManager.SelectGameObjectByName(gameObjectName)
      setIsAddMenuOpen(false)
      return
    }

    if (preset !== 'default') {
      const created = gameManager.GetGameObjectByName(gameObjectName)
      if (created) {
        gameManager.AddGameComponent('MeshComponent', {
          options: {
            width: 1,
            height: 1,
            position: { x: 0, y: 0.5, z: 0 }
          }
        }, created)

        const mesh = created?.GetComponent?.('MeshComponent')?.Mesh
        if (mesh) {
          if (preset === 'sphere') {
            mesh.geometry.dispose()
            mesh.geometry = new THREE.SphereGeometry(0.6, 24, 16)
          } else if (preset === 'cube') {
            mesh.geometry.dispose()
            mesh.geometry = new THREE.BoxGeometry(1, 1, 1)
          } else if (preset === 'plane') {
            mesh.geometry.dispose()
            mesh.geometry = new THREE.PlaneGeometry(2, 2, 20, 20)
          }
          mesh.material.needsUpdate = true
        }
      }
    }

    gameManager.SelectGameObjectByName(gameObjectName)
    setIsAddMenuOpen(false)
  }

  const downloadSaveFile = (gameObjects: any) => {
    const blob = new Blob([stringifyGameObjectsForSave(gameObjects)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${projectName}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleNewProject = async () => {
    const enteredName = window.prompt('Project name', projectName || DEFAULT_SAVE_NAME)
    const trimmedName = (enteredName || '').trim()

    if (!trimmedName) {
      setSaveLabel('Project creation cancelled')
      setIsFileMenuOpen(false)
      window.setTimeout(() => setSaveLabel(''), 1800)
      return
    }

    try {
      const folderName = await pickProjectFolder()

      try {
        localStorage.setItem(PROJECT_NAME_KEY, trimmedName)
      } catch {
        // non-critical if localStorage is unavailable
      }

      setProjectName(trimmedName)

      const lightObjectName = 'Directional Light'

      gameManager.LoadGameObjectsMap({
        [trimmedName]: {
          id: 1,
          name: trimmedName,
          components: {},
          parent: {},
          active: true,
          destroyed: false,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          transform: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
          worldTransform: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }
        },
        [lightObjectName]: {
          id: 2,
          name: lightObjectName,
          components: {
            LightComponent: {
              name: 'LightComponent',
              options: {
                type: 'DirectionalLight',
                intensity: 1,
                distance: 0,
                texture: '',
                position: { x: 5, y: 5, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
              }
            }
          },
          parent: { name: trimmedName },
          active: true,
          destroyed: false,
          position: { x: 5, y: 5, z: 5 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          transform: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 5, 5, 1] },
          worldTransform: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 5, 5, 1] }
        }
      })
      gameManager.SelectGameObjectByName(trimmedName)

      setSaveLabel(`Project: ${trimmedName} (${folderName})`)
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setSaveLabel('Project creation cancelled')
      } else {
        console.error('New project failed:', error)
        setSaveLabel('New project failed')
      }
    }

    setIsFileMenuOpen(false)
    window.setTimeout(() => setSaveLabel(''), 2200)
  }

  const handleSave = async () => {
    const gameObjects = gameManager.SaveGameObject()
    try {
      const result = await saveGameObjects(gameObjects, projectName)
      if (result) {
        setSaveLabel('Saved')
      } else {
        downloadSaveFile(gameObjects)
        setSaveLabel('Downloaded')
      }
    } catch {
      downloadSaveFile(gameObjects)
      setSaveLabel('Downloaded')
    }
    setIsFileMenuOpen(false)
    window.setTimeout(() => setSaveLabel(''), 1800)
  }

  const handleLoad = async () => {
    try {
      const data = await loadeGameObjects(undefined, { forcePickJson: true })
      if (data) {
        gameManager.LoadGameObjectsMap(data)
        setSaveLabel('Loaded')
      } else {
        setSaveLabel('Load cancelled')
      }
    } catch (error: any) {
      console.error('Load failed:', error)
      setSaveLabel('Load failed')
    }
    setIsFileMenuOpen(false)
    window.setTimeout(() => setSaveLabel(''), 1800)
  }

  const handleLoadFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const data = parseLoadedGameObjectsText(text)
      gameManager.LoadGameObjectsMap(data)
      setSaveLabel('Loaded')
    } catch (error) {
      console.error('Load from file failed:', error)
      setSaveLabel('Invalid save file')
    }

    event.target.value = ''
    window.setTimeout(() => setSaveLabel(''), 1800)
  }

  const handleSelectTransformMode = (mode: TransformMode) => {
    setTransformMode(mode)
    gameManager.transformControls?.setMode(mode)
  }

  const handleToggleFps = () => {
    const nextVisible = !isFpsVisible
    setIsFpsVisible(nextVisible)
    ;(gameManager as any)?.setFpsVisible?.(nextVisible)
  }

  return (
    <div className="sidebar-header">
      <input
        ref={loadFileInputRef}
        type="file"
        accept="application/json"
        className="sidebar-header__hidden-input"
        onChange={handleLoadFromFile}
      />

      <div className="sidebar-header__menu-row">
        <div className="sidebar-header__menu-wrap">
          <button
            type="button"
            className="sidebar-header__menu-button"
            onClick={() => {
              setIsFileMenuOpen((v) => !v)
              setIsAddMenuOpen(false)
            }}
            aria-haspopup="menu"
            aria-expanded={isFileMenuOpen}
          >
            File
          </button>

          {isFileMenuOpen && (
            <div className="sidebar-header__menu-panel" role="menu" aria-label="File menu">
              <button type="button" className="sidebar-header__menu-item" onClick={handleNewProject}>
                New Project
              </button>
              <button type="button" className="sidebar-header__menu-item" onClick={handleLoad}>
                Load Project
              </button>
              <button type="button" className="sidebar-header__menu-item" onClick={handleSave}>
                Save Project
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-header__add-wrap">
        <button
          type="button"
          className="sidebar-header__add-button"
          onClick={() => {
            setIsAddMenuOpen((v) => !v)
            setIsFileMenuOpen(false)
          }}
          aria-haspopup="menu"
          aria-expanded={isAddMenuOpen}
        >
          Add GameObject
        </button>

        {isAddMenuOpen && (
          <div className="sidebar-header__add-menu" role="menu" aria-label="Add GameObject presets">
            <button type="button" className="sidebar-header__menu-item" onClick={() => createWithPreset('default')}>
              Default
            </button>
            <button type="button" className="sidebar-header__menu-item" onClick={() => createWithPreset('sphere')}>
              Sphere
            </button>
            <button type="button" className="sidebar-header__menu-item" onClick={() => createWithPreset('cube')}>
              Cube
            </button>
            <button type="button" className="sidebar-header__menu-item" onClick={() => createWithPreset('plane')}>
              Plane
            </button>
            <button type="button" className="sidebar-header__menu-item" onClick={() => createWithPreset('skybox')}>
              Skybox
            </button>
          </div>
        )}
        </div>
      </div>

      {saveLabel && <div className="sidebar-header__save-status">{saveLabel}</div>}

      <div className="sidebar-header__mode-group" role="group" aria-label="Transform controls mode">
        <button
          type="button"
          className={`sidebar-header__mode-button ${transformMode === 'translate' ? 'active' : ''}`}
          onClick={() => handleSelectTransformMode('translate')}
        >
          Move
        </button>
        <button
          type="button"
          className={`sidebar-header__mode-button ${transformMode === 'rotate' ? 'active' : ''}`}
          onClick={() => handleSelectTransformMode('rotate')}
        >
          Rotate
        </button>
        <button
          type="button"
          className={`sidebar-header__mode-button ${transformMode === 'scale' ? 'active' : ''}`}
          onClick={() => handleSelectTransformMode('scale')}
        >
          Scale
        </button>
      </div>

      <button
        type="button"
        className={`sidebar-header__fps-button ${isFpsVisible ? 'active' : ''}`}
        onClick={handleToggleFps}
      >
        FPS: {isFpsVisible ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
