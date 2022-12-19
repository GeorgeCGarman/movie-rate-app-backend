const { ApolloServer, gql, UserInputError } = require("apollo-server")
const { v1: uuid } = require("uuid")

let movies = [
  {
    id: "1",
    title: "Top Gun: Maverick",
    image:
      "https://m.media-amazon.com/images/M/MV5BZWYzOGEwNTgtNWU3NS00ZTQ0LWJkODUtMmVhMjIwMjA1ZmQwXkEyXkFqcGdeQXVyMjkwOTAyMDU@._V1_.jpg",
  },
  {
    id: "2",
    title: "Black Panther: Wakanda Forever",
    image:
      "https://m.media-amazon.com/images/M/MV5BNTM4NjIxNmEtYWE5NS00NDczLTkyNWQtYThhNmQyZGQzMjM0XkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg",
  },
  {
    id: "3",
    title: "Doctor Strange in the Multiverse of Madness",
    image:
      "https://m.media-amazon.com/images/M/MV5BNWM0ZGJlMzMtZmYwMi00NzI3LTgzMzMtNjMzNjliNDRmZmFlXkEyXkFqcGdeQXVyMTM1MTE1NDMx._V1_.jpg",
  },
]

let users = [
  {
    id: "1",
    name: "George",
    email: "george@gmail.com",
  },
  {
    id: "3",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    comments: ["1", "2"],
  },
  {
    id: "4",
    name: "John Smith",
    email: "john.smith@example.com",
    comments: ["3"],
  },
]

let comments = [
  {
    id: "1",
    user: "1",
    movie: "1",
    title: "Brilliant!",
    content: "A great sequel to a great movie",
    stars: 5,
  },
  {
    id: "2",
    user: "2",
    movie: "2",
    content: "I didn't like this movie at all.",
    stars: 2,
  },
  {
    id: "1",
    user: "1",
    movie: "3",
    content: "I thought the acting was superb",
    stars: 4,
  },
  {
    id: "1",
    user: "1",
    movie: "2",
    content: "Another great Black Panther movie",
    stars: 4,
  },
]

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
  }

  type Movie {
    id: ID!
    title: String!
    comments: [Comment]
    image: String!
  }

  type Query {
    movies: [Movie!]!
    movie(id: ID): Movie
    comments: [Comment!]!
    comment(id: ID): Comment
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    updateUser(id: ID!, name: String!, email: String!): User!
    deleteUser(id: ID!): Boolean!
    createComment(
      user: String!
      movie: String!
      content: String!
      title: String
      stars: Int
    ): Comment!
    updateComment(
      id: ID!
      user: String!
      content: String!
      title: String
      stars: Int
    ): Comment!
    deleteComment(id: ID!): Boolean!
    createMovie(title: String!): Movie!
    updateMovie(id: ID!, title: String!): Movie!
    deleteMovie(id: ID!): Boolean!
  }
`

const resolvers = {
  Query: {
    movies: () => movies,
    movie: (_, args) => movies.find((m) => m.name === args.name),
    comments: () => comments,
    comment: (_, args) => comments.find((c) => c.id === args.id),
    users: () => users,
    user: (_, args) => users.find((u) => u.id === args.id),
  },
  User: {
    comments: (root) => {
      return comments.filter((c) => c.user === root.id)
    },
  },
  Comment: {
    movie: (root) => {
      return movies.find((m) => m.id === root.movie)
    },
    user: (root) => {
      return users.find((u) => u.id === root.user)
    },
  },
  Movie: {
    comments: (root) => {
      return comments.filter((c) => c.movie === root.id)
    },
  },
  Mutation: {
    createUser: (root, args) => {
      if (users.find((p) => p.name === args.name)) {
        throw new UserInputError("Name must be unique", {
          invalidArgs: args.name,
        })
      }
      const user = { ...args, id: uuid(), comments: [] }
      users.push(user)
      return user
    },
    updateUser: (root, args) => {
      console.log(users)
      const user = users.find((u) => u.id === args.id)
      console.log(user)
      if (!user) {
        return null
      }

      const updatedUser = { ...user, ...args }
      users = users.map((u) => (u.id === args.id ? updatedUser : u))
      return updatedUser
    },
    deleteUser: (root, args) => {
      console.log(users)
      const user = users.find((u) => u.id === args.id)
      if (!user) {
        return false
      }

      users = users.filter((u) => u.id !== args.id)
      return true
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
