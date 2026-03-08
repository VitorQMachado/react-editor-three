import { ComponentMap, GameComponent } from '@vmlibs/unit_three'

const ComponetFactory = (gameComponent: GameComponent) => {
   switch(gameComponent.NAME) {
        case "MeshComponent": return {
            parameters: {
                //...gameComponent.
            }
        };
        default: return null;
   }
}

export const MeshComponent = ({ component }: { component: ComponentMap["MeshComponent"] }) => {
    if(component.NAME !== "MeshComponent") {
        return null;
    }

    return (
        <div key={`game-object-component-${component.NAME}`}>
            <label>{component.NAME}</label>

        </div>
    )
}
