import * as mongoose from 'mongoose';
mongoose.set('useFindAndModify', false);

export class CommonRepo {
  session;
  async getSession(domain) {
    if (!this.session) {
      this.session = await domain.startSession();
    }
    return this.session;
  }

  async endSession() {
    if (!this.session) {
      this.session.endSession();
    }
  }
}
