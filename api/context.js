const jwt = require("jsonwebtoken")
const User = require("../models/userModel")

const createContext = async ({ req }) => {
    const currentUser = null

    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
        const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
        currentUser = await User.findById(decodedToken.id)
    }

    return currentUser
}

module.exports = createContext