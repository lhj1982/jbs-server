import TagsRepo from '../repositories/tags.repository';

class TagService {
  async getTags(): Promise<any> {
    return await TagsRepo.find({});
  }
}

export default new TagService();
