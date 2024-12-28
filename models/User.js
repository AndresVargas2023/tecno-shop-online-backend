const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  surname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false, 
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user', 
  },
  address: {
    type: String,
    required: true, 
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date, 
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
