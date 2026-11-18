import { randomUUID } from 'node:crypto';
import { now, transaction } from '../db.js';
import { createObserver } from '../events/observer.js';
import { createEventRepository } from '../repositories/event-repository.js';
import { createNotificationRepository } from '../repositories/notification-repository.js';
import { createTrainingEvents } from '../services/training-events.js';
import { createNotificationService } from '../services/notification-service.js';
import { createTrainingNotificationObserver } from './training-notification.js';

export function createNotificationModule(db, { observers = [], reportFailure = id => console.error(`Evento ${id}: avisos pendientes de reintento.`) } = {}) {
  const observer = createObserver();
  const notifications = createNotificationRepository(db);
  for (const type of ['training.scheduled', 'training.updated']) {
    observer.subscribe(type, createTrainingNotificationObserver(notifications));
    for (const listener of observers) observer.subscribe(type, listener);
  }
  return {
    events: createTrainingEvents({ repository: createEventRepository(db), observer, runInTransaction: operation => transaction(db, operation), clock: now, newId: randomUUID, reportFailure }),
    service: createNotificationService({ notifications, clock: now }),
  };
}
