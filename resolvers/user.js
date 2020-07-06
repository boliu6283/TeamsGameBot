const User = require('../models/user');
const { findOne } = require('../models/user');

const getUser = async (args) => {
  return await User.findOne({ aad: args.aad });
}

const getAllUsersScore = async () => {
  return await User.find({}, 'name score').sort('-score');
}

const signupUser = async (args) => {
  const { aad, email, name, givenName } = args;
  const newUser = new User({
    aad,
    email,
    name,
    givenName
  });

  const user = await newUser.save();
  if (!user) throw new Error ('Failed to save new record in User collection');
  console.log(`${user._id} added to User collection successfully`);

  return user;
}

const updateUserScore = async (args) => {
  const { aad, earnedScore } = args;
  const user = await User.findOneAndUpdate({ aad: aad }, { $inc: { score: earnedScore } }, { new: true });
  
  if (!user) throw new Error ('Failed to save new record in User collection');
  console.log(`${user._id} added to User collection successfully`);
}

module.exports = {
  getUser,
  getAllUsersScore,
  signupUser,
  updateUserScore
};
