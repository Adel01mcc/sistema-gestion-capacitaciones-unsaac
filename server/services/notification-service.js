import { HttpError, paginated } from '../errors.js';
import { parseNotificationQuery } from '../validation/notification-validation.js';

export function createNotificationService({ notifications, clock }) {
  return {
    list(userId, query) {
      const { page, pageSize } = parseNotificationQuery(query);
      const { rows, total } = notifications.list(userId, { page, pageSize });
      return paginated(rows, total, page, pageSize);
    },
    markRead(id, userId) {
      if (!notifications.markRead(id, userId, clock())) throw new HttpError(404, 'El aviso no existe o no está disponible para su cuenta.');
      return { message: 'Aviso marcado como leído.' };
    },
  };
}
