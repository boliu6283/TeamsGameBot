const User = require('../models/user');

const getUser = async (args) => {
  return await User.findOne({ aad: args.aad });
}

const signupUser = async (args) => {
  const { aad, email, name } = args;
  const newUser = new User({
    aad,
    email,
    name
  });

  const user = await newUser.save();
  if (!user) throw new Error ('Failed to save new record in User collection');
  console.log(`${user._id} added to User collection successfully`);

  return user;
}

module.exports = {
  getUser,
  signupUser
};
