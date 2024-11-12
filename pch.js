const sqlite3 = require('sqlite3').verbose();

// Create a new database or open the existing one
const db = new sqlite3.Database('testdbb.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create a users table
const createTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );
`;

db.run(createTable, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Users table created or already exists.');
  }
});

// Function to insert a new user
const insertUser = (name, email) => {
  const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)', (err) => {
    if (err) {
      console.error('Error preparing statement:', err.message);
      return;
    }
  });

  stmt.run(name, email, (err) => {
    if (err) {
      console.error('Error inserting user:', err.message);
    }
  });

  stmt.finalize((err) => {
    if (err) {
      console.error('Error finalizing statement:', err.message);
    }
  });
};

// Populate the table with 50 entries
for (let i = 40; i <= 80; i++) {
  const name = `User${i}`;
  const email = `user${i}@example.com`;
  insertUser(name, email);
}

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing the database:', err.message);
  } else {
    console.log('Closed the database connection.');
  }
});
