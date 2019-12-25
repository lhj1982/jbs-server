import TagsRepo from '../repositories/tags.repository';

class TagService {
  async getTags() {
    return await TagsRepo.find({});
  }
}

export default new TagService();
