import LeadingBoardRepo from '../repositories/leadingBoard.repository';
import EventsRepo from '../repositories/events.repository';
import UsersRepo from '../repositories/users.repository';
import { date2String, nowDate } from '../utils/dateUtil';

class LeadingBoardService {
  async getLeadingBoard(validFor: string) {
    return await LeadingBoardRepo.find({ validFor });
  }

  async updateLeadingBoard() {
    const validFor = date2String(new Date(), 'YYYY-MM-DD');

    const session = await UsersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };

      const mostCommissionSingleEventLeadingBoard = await this.getMostCommissionSingleEventLeadingBoard('most_commission_single_event', validFor);
      // console.log(mostCommissionSingleEventLeadingBoard);
      if (mostCommissionSingleEventLeadingBoard) {
        await LeadingBoardRepo.createLeadingBoardEntry(mostCommissionSingleEventLeadingBoard, opts);
      }
      // most_host_event_count
      const mostHostEventCountLeadingBoard = await this.getMostHostEventCountLeadingBoard('most_host_event_count', validFor);
      if (mostHostEventCountLeadingBoard) {
        await LeadingBoardRepo.createLeadingBoardEntry(mostHostEventCountLeadingBoard, opts);
      }
      // most_commission_all_events
      const mostCommissionAllEventLeadingBoard = await this.getMostCommissionAllEventLeadingBoard('most_commission_all_events', validFor);
      // console.log(mostCommissionSingleEventLeadingBoard);
      if (mostCommissionAllEventLeadingBoard) {
        await LeadingBoardRepo.createLeadingBoardEntry(mostCommissionAllEventLeadingBoard, opts);
      }
      // most_join_event_count_male
      const mostJoinEventCountMale = await this.getMostJoinEventCountByGender('most_join_event_count_male', validFor, 'male');
      if (mostJoinEventCountMale) {
        await LeadingBoardRepo.createLeadingBoardEntry(mostJoinEventCountMale, opts);
      }
      // most_join_event_count_female
      const mostJoinEventCountFemale = await this.getMostJoinEventCountByGender('most_join_event_count_female', validFor, 'female');
      if (mostJoinEventCountFemale) {
        await LeadingBoardRepo.createLeadingBoardEntry(mostJoinEventCountFemale, opts);
      }

      await session.commitTransaction();
      await UsersRepo.endSession();
    } catch (err) {
      await session.abortTransaction();
      await UsersRepo.endSession();
      throw err;
    }
  }

  async getMostJoinEventCountByGender(type, validFor, gender): Promise<any> {
    const result = undefined;
    const event = await EventsRepo.getMostJoinEventCountByGender(gender);
    if (event) {
      const { user: userId, count } = event;
      return {
        type,
        validFor,
        user: userId,
        value: count,
        updatedAt: nowDate()
      };
    }
    return result;
  }

  async getMostCommissionAllEventLeadingBoard(type, validFor): Promise<any> {
    const result = undefined;
    const eventCommission = await UsersRepo.getMostCommissionAllEventEntry();
    const { user: userId, totalHostAmount } = eventCommission;
    if (eventCommission) {
      return {
        type,
        validFor,
        user: userId,
        value: totalHostAmount.toFixed(2),
        updatedAt: nowDate()
      };
    }
    return result;
  }

  async getMostHostEventCountLeadingBoard(type, validFor): Promise<any> {
    const result = undefined;
    const event = await EventsRepo.getMostHostEventCount();
    if (event) {
      const { user: userId, count } = event;
      return {
        type,
        validFor,
        user: userId,
        value: count,
        updatedAt: nowDate()
      };
    }
    return result;
  }

  async getMostCommissionSingleEventLeadingBoard(type, validFor): Promise<any> {
    const result = undefined;
    const eventCommission = await UsersRepo.getMostCommissionEntry();
    if (eventCommission) {
      const { commissions } = eventCommission;
      const {
        host: { user: hostUserId }
      } = commissions;
      const totalCommission = this.getTotalCommission(commissions);
      return {
        type,
        validFor,
        user: hostUserId,
        value: totalCommission,
        updatedAt: nowDate()
      };
    }
    return result;
  }

  getTotalCommission(commissions: any): number {
    const {
      host: { user: hostUserId, amount: hostAmount },
      participators
    } = commissions;
    let amount = hostAmount;
    for (let i = 0; i < participators.length; i++) {
      const participator = participators[0];
      const { user: participatorUserId, amount: participatorAmount } = participator;
      if (hostUserId.toString() === participatorUserId.toString()) {
        amount += participatorAmount;
        break;
      }
    }
    return amount.toFixed(2);
  }
}

export default new LeadingBoardService();
