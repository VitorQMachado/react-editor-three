import { useEffect, useRef } from 'react';
import { GameManager } from '@vmlibs/unit_three';

type GameScreenMode = 'editor' | 'runtime';

type GameScreenComponentProps = {
    mode?: GameScreenMode;
    onGameLoad?: (gameManager: GameManager) => void;
    subtitle?: string;
    title?: string;
};

export const GameScreenComponent = ({ mode = 'editor', onGameLoad, subtitle, title }: GameScreenComponentProps) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const gameManager = new GameManager({
            gameOptions: {
                containerElement: ref.current,
                isEditor: true,
            },
        });

        onGameLoad?.(gameManager);

        return () => {
            gameManager.DestroyGameManager();
        };
    }, [onGameLoad]);

    return (
        <section className={`game-screen-panel game-screen-panel--${mode}`}>
            {(title || subtitle) && (
                <div className="game-screen-panel__header">
                    {title && <h2 className="game-screen-panel__title">{title}</h2>}
                    {subtitle && <div className="game-screen-panel__subtitle">{subtitle}</div>}
                </div>
            )}
            <div className="game-screen-panel__content">
                <div className="game-screen-panel__viewport" ref={ref}></div>
            </div>
        </section>
    );
};
