// Observer síncrono: el publicador conoce suscriptores, no canales de aviso.
export function createObserver() {
  const listeners = new Map();
  return {
    subscribe(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
      return () => listeners.get(type)?.delete(listener);
    },
    publish(event) {
      for (const listener of [...(listeners.get(event.type) || [])]) {
        const result = listener(event);
        if (result?.then) {
          result.catch(() => {});
          throw new TypeError('Los observadores transaccionales deben ser síncronos.');
        }
      }
    },
  };
}
