import { EventStream } from '@vmlibs/unit_three';
import { useEffect, useState } from 'react';

type ComponentEventLog = {
    id: string;
    category: 'collision' | 'component';
    label: string;
    detail: string;
    time: string;
};

export const ComponentEventLogSection = (): React.ReactElement => {
    const [eventLogs, setEventLogs] = useState<ComponentEventLog[]>([]);

    useEffect(() => {
        const pushEvent = (entry: Omit<ComponentEventLog, 'id' | 'time'>) => {
            setEventLogs((prev) =>
                [
                    {
                        ...entry,
                        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                        time: new Date().toLocaleTimeString(),
                    },
                    ...prev,
                ].slice(0, 50)
            );
        };

        const collisionSub = EventStream.streamTo('collision').subscribe((payload: any) => {
            const event = payload?.event || 'collision';
            const selfName = payload?.self?.Name || 'Unknown';
            const otherName = payload?.gameObject?.Name || payload?.other?.Parent?.Name || 'Unknown';
            pushEvent({ category: 'collision', label: `${selfName} → ${otherName}`, detail: event });
        });

        const componentSub = EventStream.streamTo('component.updated').subscribe((payload: any) => {
            const component = payload?.component || 'Unknown';
            const property = payload?.property || '';
            const raw = payload?.value;
            const detail =
                raw === null || raw === undefined
                    ? 'null'
                    : typeof raw === 'object'
                      ? JSON.stringify(raw)
                      : String(raw);
            pushEvent({
                category: 'component',
                label: `${component}`,
                detail: property ? `${property}: ${detail}` : detail,
            });
        });

        return () => {
            collisionSub.unsubscribe();
            componentSub.unsubscribe();
        };
    }, []);

    return (
        <div className="inspector-event-log">
            <div className="inspector-event-log__header">
                <span>Component Events</span>
                <button type="button" className="inspector-event-log__clear" onClick={() => setEventLogs([])}>
                    Clear
                </button>
            </div>

            {eventLogs.length === 0 ? (
                <div className="inspector-event-log__empty">No events yet.</div>
            ) : (
                <div className="inspector-event-log__list">
                    {eventLogs.map((log) => (
                        <div key={log.id} className="inspector-event-log__item">
                            <span className={`inspector-event-log__badge inspector-event-log__badge--${log.category}`}>
                                {log.category}
                            </span>
                            <div className="inspector-event-log__label">{log.label}</div>
                            <div className="inspector-event-log__detail">{log.detail}</div>
                            <div className="inspector-event-log__time">{log.time}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
