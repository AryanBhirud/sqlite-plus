const Database = require('better-sqlite3');
const fs = require('fs');

class SQLitePlus {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = this._connectDatabase(dbPath);
    this.maxEntriesPerTable = 30; // Change as needed
    this._createIndexTable();
  }

  _connectDatabase(dbPath) {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}. Please ensure the file exists.`);
    }
    return new Database(dbPath);
  }

  _createIndexTable() {
    // Create an index table to track split tables if not exists
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS table_index (
        base_table TEXT PRIMARY KEY,
        last_table_number INTEGER
      )
    `).run();
  }

  _updateIndexTable(baseTableName, newTableNumber) {
    this.db.prepare(`
      INSERT OR REPLACE INTO table_index (base_table, last_table_number)
      VALUES (?, ?)
    `).run(baseTableName, newTableNumber);
  }

  _getLastTableNumber(baseTableName) {
    const result = this.db.prepare(`
      SELECT last_table_number FROM table_index WHERE base_table = ?
    `).get(baseTableName);
    return result ? result.last_table_number : 0;
  }

  checkScaling() {
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'table_index';").all();
    tables.forEach((table) => {
      const rowCount = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
      if (rowCount > this.maxEntriesPerTable) {
        console.log(`Table ${table.name} has more than ${this.maxEntriesPerTable} rows. Scaling required.`);
        this.scaleTable(table.name, rowCount);
      }
    });
  }

  scaleTable(baseTableName, rowCount) {
    const lastTableNumber = this._getLastTableNumber(baseTableName);
    const newTableNumber = lastTableNumber + 1;
    const newTableName = `${baseTableName}${newTableNumber}`;

    console.log(`Creating table ${newTableName} and moving entries...`);
    
    // Create new table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS ${newTableName} AS SELECT * FROM ${baseTableName} WHERE 1 = 2
    `).run();

    // Move excess rows to new table
    const excessRows = rowCount - this.maxEntriesPerTable;
    this.db.prepare(`
      INSERT INTO ${newTableName} SELECT * FROM ${baseTableName} ORDER BY ROWID DESC LIMIT ?
    `).run(excessRows);

    // Delete moved rows from the original table
    this.db.prepare(`
      DELETE FROM ${baseTableName} WHERE ROWID IN (
        SELECT ROWID FROM ${baseTableName} ORDER BY ROWID DESC LIMIT ?
      )
    `).run(excessRows);

    // Update index table
    this._updateIndexTable(baseTableName, newTableNumber);

    console.log(`Table ${baseTableName} scaled to ${newTableName}.`);
  }

  run() {
    this.checkScaling();
  }

  getPreparedStatement(query) {
    return this.db.prepare(query);
  }
}

module.exports = SQLitePlus;
