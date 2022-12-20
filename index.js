const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
} = require("apollo-server")
const { default: mongoose } = require("mongoose")
const Movie = require("./models/movieModel")
const User = require("./models/userModel")
const Comment = require("./models/commentModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
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

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    comments: [Comment]
  }

  type Comment {
    id: ID!
    user: User!
    movie: Movie!
    content: String!
    stars: Int
    upvotes: Int!
  }

  type Movie {
    id: ID!
    title: String!
    comments: [Comment]
    image: String!
  }

  type Token {
    value: String!
  }

  type Query {
    movies: [Movie!]!
    movie(id: ID): Movie
    comments: [Comment!]!
    comment(id: ID): Comment
    users: [User!]!
    user(id: ID!): User
    me: User
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
    updateUser(id: ID!, name: String, email: String): User!
    deleteUser(id: ID!): Boolean!
    login(name: String!, password: String!): Token
    createComment(
      movie: String!
      content: String!
      title: String
      stars: Int
    ): Comment!
    updateComment(id: ID!, content: String, stars: Int): Comment!
    deleteComment(id: ID!): Boolean!
    upvoteComment(id: ID!): Comment!
    createMovie(title: String!, image: String!): Movie!
    updateMovie(id: ID!, title: String, image: String!): Movie!
    deleteMovie(id: ID!): Boolean!
  }
`

const resolvers = {
  Query: {
    movies: async () => await Movie.find({}),
    movie: async (_, args) => await Movie.find({ name: args.name }),
    comments: async () => await Comment.find({}),
    comment: async (_, args) => await Comment.find({ _id: args.id }),
    users: async () => await User.find({}),
    user: async (_, args) => await User.find({ _id: user.id }),
    me: (root, args, context) => context.currentUser,
  },
  User: {
    comments: async (root) => {
      return await Comment.find({ user: root._id })
    },
  },
  Comment: {
    movie: async (root) => {
      return await Movie.find({ _id: root.movie })
    },
    user: async (root) => {
      return await User.find({ _id: root.user })
    },
    upvotes: async (root) => {
      console.log(root)
      return await root.upvotes.length
    },
  },
  Movie: {
    comments: async (root) => {
      return await Comment.find({ movie: root._id })
    },
  },
  Mutation: {
    createUser: async (_, args) => {
      if (await User.findOne({ name: args.name })) {
        throw new UserInputError("name must be unique", {
          invalidArgs: args.name,
        })
      }
      const password = await bcrypt.hash(args.password, 10)
      const user = new User({ ...args, password })
      return await user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      })
    },
    updateUser: async (_, args) => {
      return await User.findOneAndUpdate({ _id: args.id }, args, { new: true })
    },
    deleteUser: async (_, args) => {
      const result = await User.deleteOne({ _id: args.id })
      console.log(result)
      return result.deletedCount === 1
    },
    login: async (_, args) => {
      const user = await User.findOne({ name: args.name })
      if (!user) {
        throw new UserInputError("user not found")
      }
      const passwordCorrect = await bcrypt.compare(args.password, user.password)
      if (!passwordCorrect) {
        throw new UserInputError("invalid credentials")
      }
      const userForToken = {
        user: user.name,
        id: user._id,
      }
      const token = jwt.sign(userForToken, process.env.JWT_SECRET)
      return { value: token }
    },
    createComment: async (_, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      const foundComment = await Comment.findOne({
        user: context.currentUser,
        movie: args.movie,
      })
      if (foundComment) {
        throw new UserInputError("cannot review movie multiple times", {
          invalidArgs: args.title,
        })
      }
      const comment = new Comment({
        ...args,
        user: context.currentUser,
        upvotes: [],
      })
      return await comment.save()
    },
    updateComment: async (_, args) => {
      return await Comment.findOneAndUpdate({ _id: args.id }, args, {
        new: true,
      })
    },
    deleteComment: async (_, args) => {
      const result = await Comment.deleteOne({ _id: args.id })
      return result.deletedCount === 1
    },
    upvoteComment: async (_, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      const comment = await Comment.findOne({ _id: args.id })
      const upvotes = comment.upvotes
      if (upvotes.includes(context.currentUser._id)) {
        throw new UserInputError("cannot upvote comment multiple times", {
          invalidArgs: context.currentUser,
        })
      }

      if (context.currentUser._id === comment.user) {
        throw new UserInputError("cannot upvote own comment", {
          invalidArgs: context.currentUser,
        })
      }
      const result = Comment.findOneAndUpdate(
        { _id: args.id },
        { $push: { upvotes: context.currentUser } }
      )

      return result
    },
    createMovie: async (_, args) => {
      if (Movie.find({ title: args.title })) {
        throw new UserInputError("movie already in database", {
          invalidArgs: args.title,
        })
      }
      const movie = new Movie(args)
      return await movie.save()
    },
    updateMovie: async (_, args) => {
      return await Movie.findOneAndUpdate({ _id: args.id }, args, { new: true })
    },
    deleteMovie: async (_, args) => {
      const result = await Movie.deleteOne({ _id: args.id })
      return result.deletedCount === 1
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null

    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
