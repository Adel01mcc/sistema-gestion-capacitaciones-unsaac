export function createTrainingEvents({ repository, observer, runInTransaction, clock, newId, reportFailure }) {
  function dispatch(id) {
    try {
      return runInTransaction(() => {
        const event = repository.find(id);
        if (!event) return false;
        observer.publish(Object.freeze({ ...event, payload: Object.freeze(event.payload) }));
        repository.processed(id, clock());
        return true;
      });
    } catch {
      // El evento ya está confirmado. No se responde 500 por una capacitación guardada.
      // Si también falla SQLite, el evento sigue pendiente para una ejecución posterior.
      try { repository.failed(id); } catch { /* El registro pendiente se conserva. */ }
      try { reportFailure(id); } catch { /* Un fallo del registro no cambia el commit. */ }
      return false;
    }
  }
  return {
    record(type, training) {
      const event = { id: newId(), type, training_id: training.id, occurred_at: clock(), payload: {
        title: training.title, code: training.code, start_date: training.start_date,
        end_date: training.end_date, start_time: training.start_time, end_time: training.end_time, status: training.status,
      } };
      repository.insert(event); // Se invoca dentro de la transacción de la capacitación.
      return event.id;
    },
    dispatch,
    retryPending() {
      let processed = 0;
      for (const event of repository.pending()) if (dispatch(event.id)) processed += 1;
      return { processed, pending: repository.countPending() };
    },
  };
}
