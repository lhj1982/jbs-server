import OrdersRepo from '../repositories/orders.repository';
import EventsRepo from '../repositories/events.repository';

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

  async getEvents(shopName: string, fromDate: string, toDate: string, limit: number, offset: number) {
    return await EventsRepo.getEvents({
      limit,
      offset,
      shopName,
      fromDate,
      toDate,
      statuses: ['ready', 'completed', 'cancelled']
    });
  }
}

export default new ReportService();
