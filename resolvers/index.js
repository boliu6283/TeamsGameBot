const { getUser, signupUser } = require('./user/auth')

module.exports = {
    user: {
        getUser,
        signupUser
    }
}
