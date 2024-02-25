const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
} = require("apollo-server")
const { default: mongoose } = require("mongoose")
const resolvers = require("./api/resolvers")
const typeDefs = require(".api/typeDefs")
const context = require(".api/context")
require("dotenv").config()

const MONGODB_URI =
  "mongodb+srv://admin-george:rN63oTvNoUiXGu7t@cluster0.q0p4j.mongodb.net/movie-rate-app-db?retryWrites=true&w=majority"
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((error) => {
    console.log("Error connection to MongoDB:", error.message)
  })

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context
})

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
