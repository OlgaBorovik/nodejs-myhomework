const express = require("express");
const {
  register,
  login,
  getCurrentUser,
  logout,
  updateSubscription,
  updateAvatar,
} = require("../../controllers/users.controller");
const { auth } = require("../../middlewares/validation");
const { upload } = require("../../middlewares/upload");
const usersRouter = express.Router();
const { tryCatchWrapper } = require("../../helpers/index");

usersRouter.post("/register", tryCatchWrapper(register));
usersRouter.post("/login", tryCatchWrapper(login));
usersRouter.post("/logout", auth, tryCatchWrapper(logout));
usersRouter.get("/current", auth, tryCatchWrapper(getCurrentUser));
usersRouter.patch("/", auth, tryCatchWrapper(updateSubscription));
usersRouter.patch(
  "/avatars",
  auth,
  upload.single("avatar"),
  tryCatchWrapper(updateAvatar)
);

module.exports = {
  usersRouter,
};
