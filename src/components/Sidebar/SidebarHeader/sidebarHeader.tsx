import { GameManager } from '@vmlibs/unit_three'
import React, { useEffect, useState } from 'react'
import './styles.css'

type TransformMode = 'translate' | 'rotate' | 'scale'

export const SidebarHeader = ({ gameManager }: { gameManager: GameManager }) => {
  const [transformMode, setTransformMode] = useState<TransformMode>('translate')

  useEffect(() => {
    const currentMode = gameManager?.transformControls?.getMode?.()
    if (currentMode === 'translate' || currentMode === 'rotate' || currentMode === 'scale') {
      setTransformMode(currentMode)
    }
  }, [gameManager])

  const handleAddGameObject = () => {
    const gameObjectName = `GameObject-${Date.now()}`
    gameManager.AddNewGameObject(gameObjectName)
    gameManager.SelectGameObjectByName(gameObjectName)
  }

  const handleSelectTransformMode = (mode: TransformMode) => {
    setTransformMode(mode)
    gameManager.transformControls?.setMode(mode)
  }

  return (
    <div className="sidebar-header">
      <button type="button" className="sidebar-header__add-button" onClick={handleAddGameObject}>
        Add GameObject
      </button>

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
    </div>
  )
}
