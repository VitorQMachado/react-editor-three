import { GameComponent } from '@vmlibs/unit_three'
import ComponentInputFactory from './ComponentInputFactory';
import "./styles.css";

export const GameObjectComponent = ({ gameComponent }: { gameComponent: GameComponent }) => {
    const factory = gameComponent?.Factory;

    return (
        <div key={`game-object-component-${gameComponent.NAME}`}>
            <label>{gameComponent.NAME}</label>
            {factory?.valuesList?.map((item) => {
                return (
                    <ComponentInputFactory key={item.name} item={item} />
                );
            })}
        </div>
    )
}
