import LeadingBoardRepo from '../repositories/leadingBoard.repository';
import EventsRepo from '../repositories/events.repository';
import { date2String } from '../utils/dateUtil';

class LeadingBoardService {
  async getLeadingBoard() {
    return await LeadingBoardRepo.find({});
  }

  async updateLeadingBoard() {
    const validFor = date2String(new Date(), 'YYYY-MM-DD');

    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };

      const mostCommissionSingleEventLeadingBoard = await this.getMostCommissionSingleEventLeadingBoard('most_commission_single_event', validFor);
      if (mostCommissionSingleEventLeadingBoard) {
        await LeadingBoardRepo.createLeadingBoardEntry(mostCommissionSingleEventLeadingBoard, opts);
      }
      await session.commitTransaction();
      await EventsRepo.endSession();
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      throw err;
    }
  }

  async getMostCommissionSingleEventLeadingBoard(type, validFor): Promise<any> {
    const result = undefined;
    const eventCommission = await EventsRepo.getMostCommissionEntry();
    return result;
  }
}

export default new LeadingBoardService();
