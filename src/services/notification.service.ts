import NotificationsRepo from '../repositories/notifications.repository';

class NotificationService {
  async getNotifications(params) {
    const { offset, limit, audience, eventType, message } = params;
    const result = await NotificationsRepo.find({
      offset,
      limit,
      audience,
      eventType,
      message
    });

    return result;
  }
}

export default new NotificationService();
