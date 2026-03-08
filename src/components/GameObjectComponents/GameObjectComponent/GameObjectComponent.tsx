import { GameComponent } from '@vmlibs/unit_three'

export const GameObjectComponent = ({ component }: { component: GameComponent }) => {

    return (
        <div key={`game-object-component-${component.NAME}`}>
            <label>{component.NAME}</label>
        </div>
    )
}
