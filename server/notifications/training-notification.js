export function createTrainingNotificationObserver(notifications) {
  return event => {
    const title = event.type === 'training.scheduled' ? 'Capacitación programada' : 'Capacitación modificada';
    const value = event.payload;
    const message = `${value.code} · ${value.title}. Inicio: ${value.start_date}, ${value.start_time}. Fin: ${value.end_date}, ${value.end_time}. Estado: ${value.status}.`;
    for (const user of notifications.recipients(event.training_id)) notifications.insert(event, user.id, title, message);
  };
}
