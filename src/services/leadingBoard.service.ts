import LeadingBoardRepo from '../repositories/leadingBoard.repository';

class LeadingBoardService {
  async getLeadingBoard() {
    return await LeadingBoardRepo.find({});
  }
}

export default new LeadingBoardService();
