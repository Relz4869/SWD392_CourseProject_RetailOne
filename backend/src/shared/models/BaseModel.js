class BaseModel {
  constructor(props = {}) {
    const cols = this.constructor.COLUMNS || {};
    for (const key of Object.keys(cols)) {
      if (props[key] !== undefined) {
        this[key] = props[key];
      }
    }
  }

  static fromRow(row) {
    if (!row) return null;
    const instance = new this();
    const cols = this.COLUMNS || {};
    for (const [key, meta] of Object.entries(cols)) {
      const val = row[key];
      if (val === undefined || val === null) {
        instance[key] = null;
      } else if (meta.bigint) {
        instance[key] = Number(val);
      } else {
        instance[key] = val;
      }
    }
    return instance;
  }

  static insertableColumns() {
    const cols = this.COLUMNS || {};
    return Object.entries(cols)
      .filter(([, meta]) => !meta.identity && !meta.computed)
      .map(([key]) => key);
  }

  toPersistence() {
    const insertable = this.constructor.insertableColumns();
    const res = {};
    for (const key of insertable) {
      res[key] = this[key] !== undefined ? this[key] : null;
    }
    return res;
  }

  toJSON() {
    const cols = this.constructor.COLUMNS || {};
    const res = {};
    for (const [key, meta] of Object.entries(cols)) {
      if (!meta.sensitive) {
        res[key] = this[key] !== undefined ? this[key] : null;
      }
    }
    return res;
  }
}

module.exports = BaseModel;
