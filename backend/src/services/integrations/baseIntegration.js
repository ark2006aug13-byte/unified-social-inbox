export class BaseIntegration {
  constructor(meta) {
    this.meta = meta;
  }

  getMetadata() {
    return this.meta;
  }

  async getConnectionUrl() {
    return null;
  }

  async syncMessages() {
    return [];
  }
}
