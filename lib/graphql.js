const { ApolloServer, gql } = require('apollo-server');
const SQLitePlus = require('./database');

const createSchema = () => gql`
  type Query {
    allData(tableName: String!, columns: [String]): [String]
    userData(tableName: String!, id: Int!, columns: [String]): String
  }
`;

const createResolvers = (db) => ({
  Query: {
    allData: (_, { tableName, columns }) => {
      try {
        const selectedColumns = columns && columns.length > 0 ? columns.join(", ") : '*';
        const stmt = db.getPreparedStatement(`SELECT ${selectedColumns} FROM ${tableName}`);
        const rows = stmt.all();
        return rows.map(row => JSON.stringify(row));
      } catch (error) {
        console.error(`Error fetching data from table ${tableName}:`, error);
        return null;
      }
    },
    userData: (_, { tableName, id, columns }) => {
      try {
        const selectedColumns = columns && columns.length > 0 ? columns.join(", ") : '*';
        const stmt = db.getPreparedStatement(`SELECT ${selectedColumns} FROM ${tableName} WHERE id = ?`);
        const result = stmt.get(id);
        return result ? JSON.stringify(result) : null;
      } catch (error) {
        console.error(`Error fetching user with id ${id} from table ${tableName}:`, error);
        return null;
      }
    }
  }
});

const setupGraphQLServer = (dbPath) => {
  const db = new SQLitePlus(dbPath);
  const typeDefs = createSchema();
  const resolvers = createResolvers(db);

  const server = new ApolloServer({ typeDefs, resolvers });

  server.listen().then(({ url }) => {
    console.log(`Apollo Server is running at ${url}`);
  });
};

module.exports = setupGraphQLServer;
