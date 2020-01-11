import OrdersRepo from '../repositories/orders.repository';
import EventsRepo from '../repositories/events.repository';
import { AccessDeniedException } from '../exceptions/custom.exceptions';

class ReportService {
  async getOrders(shopName: string, fromDate: string, toDate: string, limit: number, offset: number) {
    return await OrdersRepo.getOrders({
      limit,
      offset,
      shopName,
      fromDate,
      toDate,
      statuses: ['ready', 'completed', 'cancelled']
    });
  }

  async getEvents(shopName: string, fromDate: string, toDate: string, limit: number, offset: number, scope: any = { user: undefined }) {
    const { user } = scope;
    if (!user) {
      throw new AccessDeniedException('N/A');
    }
    const { shops, roles } = user;

    return await EventsRepo.getEvents({
      limit,
      offset,
      shopName,
      fromDate,
      toDate,
      statuses: ['ready', 'completed', 'cancelled'],
      scope
    });
  }
}

export default new ReportService();
