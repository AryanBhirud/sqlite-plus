const { buildSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql');
const SQLitePlus = require('./database');

const createSchema = () => {
  return buildSchema(`
    type Query {
      allData(tableName: String!): [String]
      userData(id: Int!): String
    }
  `);
};

const createRootResolver = (db) => ({
  allData: ({ tableName }) => {
    try {
      const stmt = db.getPreparedStatement(`SELECT * FROM ${tableName}`);
      const rows = stmt.all();
      return rows.map(row => JSON.stringify(row));
    } catch (error) {
      console.error(`Error fetching data from table ${tableName}:`, error);
      return null;
    }
  },
  userData: ({ id }) => {
    try {
      const stmt = db.getPreparedStatement(`SELECT name FROM users WHERE id = ?`);
      const result = stmt.get(id);
      return result ? result.name : null;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      return null;
    }
  }
});

const setupGraphQLServer = (dbPath) => {
  const db = new SQLitePlus(dbPath);
  const schema = createSchema();

  const express = require('express');
  const app = express();

  app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: createRootResolver(db),
    graphiql: true, 
  }));

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`GraphQL server is running at http://localhost:${PORT}/graphql`);
  });
};

module.exports = setupGraphQLServer;
