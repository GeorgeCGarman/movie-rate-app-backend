const resolvers = {
    Query: {
      movies: async () => await Movie.find({}),
      movie: async (_, args) => await Movie.findOne({ _id: args.id }),
      movie: async (_, args) => await Movie.findOne({ name: args.name }),
      comments: async () => await Comment.find({}),
      comment: async (_, args) => await Comment.findOne({ _id: args.id }),
      comment: async (_, args) => await Comment.findOne({ _id: args.id }),
      users: async () => await User.find({}),
      user: async (_, args) => await User.findOne({ _id: args.id }),
      me: (root, args, context) => {
        return context.currentUser
      },
    },
    User: {
      comments: async (root) => {
        return await Comment.find({ user: root._id })
      },
    },
    Comment: {
      movie: async (root) => {
        return await Movie.findOne({ _id: root.movie })
      },
      user: async (root) => {
        result = await User.findOne({ _id: root.user })
        return result
      },
      upvotes: async (root) => {
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
        return { id: user._id, name: user.name, value: token }
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
          await Comment.findOneAndUpdate(
            { _id: args.id },
            { $pull: { upvotes: context.currentUser._id } }
          )
          return false
        }
  
        if (context.currentUser._id === comment.user) {
          throw new UserInputError("cannot upvote own comment", {
            invalidArgs: context.currentUser,
          })
        }
        await Comment.findOneAndUpdate(
          { _id: args.id },
          { $push: { upvotes: context.currentUser } }
        )
  
        return true
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

  module.exports = resolvers