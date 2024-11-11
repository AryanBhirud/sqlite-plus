#!/usr/bin/env node

const readline = require('readline');
const SQLitePlus = require('../lib/database');
const setupGraphQLServer = require('../lib/graphql');

// Set up command line interface to prompt user for database file
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const promptForDatabase = () => {
  return new Promise((resolve) => {
    rl.question('Please enter the path to your SQLite database file: ', (dbPath) => {
      rl.close();
      resolve(dbPath);
    });
  });
};

// Command to start the tool and run the GraphQL server
const runTool = async () => {
  const dbPath = await promptForDatabase();
  
  // Initialize and run SQLite+ tool
  const sqlitePlus = new SQLitePlus(dbPath);
  sqlitePlus.run();

  // Set up the GraphQL server for querying data
  setupGraphQLServer(dbPath);
};

// Handle 'sqlite-plus run db' command
runTool();

