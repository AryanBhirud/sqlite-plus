const Database = require('better-sqlite3');
const fs = require('fs');

class SQLitePlus {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = this._connectDatabase(dbPath);
    this.maxEntriesPerTable = 8; 
  }

  _connectDatabase(dbPath) {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}. Please ensure the file exists.`);
    }
    return new Database(dbPath);
  }

  checkScaling() {
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
    tables.forEach((table) => {
      const rowCount = this.db.prepare(`SELECT COUNT(*) FROM ${table.name}`).get();
      if (rowCount['COUNT(*)'] > this.maxEntriesPerTable) {
        console.log(`Table ${table.name} has more than ${this.maxEntriesPerTable} rows. Scaling required.`);
        this.scaleTable(table.name);
      }
    });
  }

  scaleTable(tableName) {
    console.log(`Scaling the ${tableName} table...`);
    this.db.prepare(`CREATE TABLE IF NOT EXISTS ${tableName}_scaled AS SELECT * FROM ${tableName} WHERE 1`).run();
  }

  run() {
    this.checkScaling(); 
  }

  getPreparedStatement(query) {
    return this.db.prepare(query);
  }
}

module.exports = SQLitePlus;
