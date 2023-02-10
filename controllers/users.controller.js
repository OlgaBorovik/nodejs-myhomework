const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const { Unauthorized, Conflict, NotFound, BadRequest } = require("http-errors");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { nanoid } = require('nanoid')
const { sendEmail } = require("../helpers/index")


// const JWT_SECRET = process.env;

async function register(req, res, next) {
  const { email, password } = req.body;

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const verificationToken = nanoid()
  try {
    const avatarUrl = gravatar.url(email);
    const savedUser = await User.create({
      email,
      password: hashedPassword,
      avatarUrl,
      verificationToken,
    });

    const mail = {
      to: email,
      subject: "Please confirm your email",
      html: `<a href="localhost:3000/api/users/verify/${verificationToken} target="_blank">Confirm your email</a>`,
    }
    await sendEmail(mail);

    console.log(savedUser);
    res.status(201).json({
      user: {
        email,
        avatarUrl,
        verificationToken,
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

  if (!storedUser.verifyEmail) {
    throw Unauthorized("Email is not verified! Please check your mail box");
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
    const avatarUrl = path.join("public", "avatars", imageName);
    console.log("avatarUrl", avatarUrl)

    Jimp.read(avatarUrl)
      .then((avatar) => {
        return avatar.resize(250, 250).write(avatarUrl);
      })
      .catch((err) => {
        console.log(err);
      });

    await User.findByIdAndUpdate(req.user._id, { avatarUrl });
    res.status(200).json({ avatarUrl });
  } catch (error) {
    await fs.unlink(tempPath);
    console.log(error.message);
    throw error;
  }
}

async function verifyEmail(req, res) {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken })
  if (!user) {
    throw NotFound("User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verified: true,
    verifyToken: null,
  });

  return res.json({
    message: "Verification successful",
  });
}

async function resendVerifyEmail(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email })
  if(!email) {
    throw BadRequest("missing required field email")
  }
  if (!user) {
    throw NotFound("User not found")
  }
  if (user.verify) {
  throw BadRequest("Verification has already been passed")
}
  
  const mail = {
      to: email,
      subject: "Please confirm your email",
      html: `<a href="localhost:3000/api/users/verify/${user.verificationToken} target="_blank">Confirm your email</a>`,
    }
  await sendEmail(mail)
  res.json({
    "message": "Verification email sent"
  })
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateSubscription,
  updateAvatar,
  verifyEmail,
  resendVerifyEmail,
};
