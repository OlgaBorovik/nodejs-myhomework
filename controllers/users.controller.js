const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const { Unauthorized, Conflict, NotFound } = require("http-errors");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");

// const JWT_SECRET = process.env;

async function register(req, res, next) {
  const { email, password } = req.body;

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    const avatarUrl = gravatar.url(email);
    const savedUser = await User.create({
      email,
      password: hashedPassword,
      avatarUrl,
    });
    console.log(savedUser);
    res.status(201).json({
      user: {
        email,
        avatarUrl,
      },
    });
  } catch (error) {
    console.log(error.message);
    if (error.message.includes("E11000 duplicate key error")) {
      throw Conflict("Email in use");
    }
    throw error;
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  const storedUser = await User.findOne({ email });

  if (!storedUser) {
    throw Unauthorized("Email or password is not valid");
  }

  const isPasswordValid = await bcrypt.compare(password, storedUser.password);

  if (!isPasswordValid) {
    throw Unauthorized("Email or password is not valid");
  }

  const payload = { id: storedUser._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  await User.findByIdAndUpdate(storedUser._id, { token });
  return res.json({
    token: token,
    user: {
      email: email,
      subscription: "starter",
    },
  });
}

async function logout(req, res, next) {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  return res.status(204).json();
}

async function getCurrentUser(req, res, next) {
  const { id, email, token, subscription } = req.user;
  if (!token) {
    throw Unauthorized("Not authorized");
  }
  return res.status(200).json({
    user: {
      _id: id,
      email: email,
      subscription: subscription,
      token: token,
    },
  });
}

async function updateSubscription(req, res, next) {
  const { _id } = req.user;
  const { subscription } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    { subscription },
    { new: true }
  );
  if (!updatedUser) {
    throw NotFound("Not found");
  }
  return res.status(200).json(updatedUser);
}

async function updateAvatar(req, res) {
  const { originalname } = req.file;
  const { _id: id } = req.user;
  const tempPath = req.file.path;
  const avatarDir = path.join(__dirname, "../", "public", "avatars");

  const imageName = `${id}_${originalname}`;

  try {
    const resultUpload = path.join(avatarDir, imageName);
    await fs.rename(tempPath, resultUpload);
    const avatarUrl = path.join("public", "avatar", imageName);
    await User.findByIdAndUpdate(req.user._id, { avatarUrl });
    res.status(200).json({ avatarUrl });
  } catch (error) {
    await fs.unlink(tempPath);
    console.log(error.message);
    throw error;
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateSubscription,
  updateAvatar,
};
