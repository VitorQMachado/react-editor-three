import { GameComponent } from '@vmlibs/unit_three'
import ComponentInputFactory from './ComponentInputFactory';
import './styles.css';

export const GameObjectComponent = ({ gameComponent }: { gameComponent: GameComponent }) => {
    const factory = gameComponent?.Factory;

    return (
        <div key={`game-object-component-${gameComponent.NAME}`} className="inspector-component">
            <div className="inspector-component__title">{gameComponent.NAME}</div>
            <div className="inspector-component__fields">
                {factory?.valuesList?.map((item) => {
                    return (
                        <div key={item.name} className="inspector-component__field">
                            <label className="inspector-component__field-label">{item.name}</label>
                            <ComponentInputFactory item={item} />
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
