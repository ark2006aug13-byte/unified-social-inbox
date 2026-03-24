import { BaseIntegration } from "./baseIntegration.js";

export class GmailIntegration extends BaseIntegration {
  constructor(meta, syncMessagesFn, getConnectUrlFn) {
    super(meta);
    this.syncMessagesFn = syncMessagesFn;
    this.getConnectUrlFn = getConnectUrlFn;
  }

  async getConnectionUrl(userId) {
    return this.getConnectUrlFn(userId);
  }

  async syncMessages(userId, options) {
    return this.syncMessagesFn(userId, options);
  }
}
