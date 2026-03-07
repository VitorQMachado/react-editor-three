import { useEffect, useRef } from 'react';
import { testIsFromPackage, GameManager } from "@vmlibs/unit_three";

export const GameScreenComponent = ({ isEditor = false, onGameLoad }: { isEditor?: boolean; onGameLoad?: (loadeGameObjectsameManager: GameManager) => void }) => {
    const ref = useRef(undefined)
    useEffect(() => {
        if(!ref.current) {
            return;
        }
        console.log(testIsFromPackage(), ref.current);

        const gameManager = new GameManager({
            gameOptions: {
                containerElement: ref.current,
                isEditor
            }
        });
        onGameLoad?.(gameManager);
    }, [ref]);

	return (
        <div>
            <div id="test-editor" ref={ref}></div>
        </div>
    );
}
