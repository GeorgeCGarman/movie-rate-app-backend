export const typeDefs = gql`
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
upvotes: [ID]!
}

type Movie {
id: ID!
title: String!
comments: [Comment]
image: String!
}

type Token {
id: ID!
name: String!
id: ID!
name: String!
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
createComment(movie: String!, content: String!, stars: Int): Comment!
updateComment(id: ID!, content: String, stars: Int): Comment!
deleteComment(id: ID!): Boolean!
upvoteComment(id: ID!): Boolean!
createMovie(title: String!, image: String!): Movie!
updateMovie(id: ID!, title: String, image: String!): Movie!
deleteMovie(id: ID!): Boolean!
}
`

module.exports = typeDefs
