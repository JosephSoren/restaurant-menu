import { useEffect, useState, useRef } from 'react';
import { RealtimeEvent, Order, MenuItem } from '../types';
import { playOrderChime } from '../utils/audio';

interface UseRealtimeOptions {
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onMenuUpdated?: (menu: MenuItem[]) => void;
  enableSoundAlerts?: boolean;
}

export function useRealtime({
  onOrderCreated,
  onOrderUpdated,
  onMenuUpdated,
  enableSoundAlerts = false
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);

  // Keep references to latest callbacks to avoid restarting SSE on callback change
  const callbacksRef = useRef({
    onOrderCreated,
    onOrderUpdated,
    onMenuUpdated,
    enableSoundAlerts
  });

  useEffect(() => {
    callbacksRef.current = {
      onOrderCreated,
      onOrderUpdated,
      onMenuUpdated,
      enableSoundAlerts
    };
  });

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          setLastEventTime(new Date());
          try {
            const data: RealtimeEvent | { type: string } = JSON.parse(e.data);

            if (data.type === 'order:created' && 'order' in data) {
              if (callbacksRef.current.enableSoundAlerts) {
                playOrderChime();
              }
              callbacksRef.current.onOrderCreated?.(data.order);
            } else if (data.type === 'order:updated' && 'order' in data) {
              callbacksRef.current.onOrderUpdated?.(data.order);
            } else if (data.type === 'menu:updated' && 'menu' in data) {
              callbacksRef.current.onMenuUpdated?.(data.menu);
            }
          } catch (err) {
            console.debug('Failed to parse SSE payload:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Schedule reconnect attempt
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return { isConnected, lastEventTime };
}
