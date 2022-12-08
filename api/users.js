const express = require("express");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const bcrypt = require("bcrypt");
const {
  getUserByUsername,
  createUser,
  getUser,
  getPublicRoutinesByUser,
} = require("../db");

userRouter.use("/", (req, res, next) => {
  next();
});
userRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await getUser({ username, password });
    const passwordSecret = user.password;
    const samePass = await bcrypt.compare(password, passwordSecret)
    if (samePass) {
      const token = jwt.sign(user, JWT_SECRET);
        res.send({
        token,
        user,
        message: "You're logged in!",
      });
    } else {
      next({
        name: "IncorrectCredentialsError",
        message: "Username or password is incorrect",
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/users/register
userRouter.post("/register", async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await getUserByUsername(username);

    if (password.length < 8) {
      next({
        error: "Password too short",
        message: "Password Too Short!",
        name: "Password too short",
      });
    }

    if (user) {
      next({
        name: "UserExistsError",
        message: `User ${username} is already taken.`,
      });
    } else {
      const newUser = await createUser({
        username,
        password,
      });

      const token = jwt.sign(newUser, process.env.JWT_SECRET, {
        expiresIn: "1w",
      });

      res.send({
        message: "thank you for signing up",
        token,
        user: newUser,
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// GET /api/users/me

userRouter.get("/me", async (req, res, next) => {
  try {
    if (req.user) {
      res.send(req.user);
    } else {
      next({
        error: "Unauthorized",
        name: "Invalid credentials",
        message: "You must be logged in to perform this action",
      });
    }
  } catch (err) {
    next();
  }
});

// GET /api/users/:username/routines
userRouter.get("/:username/routines", async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    if (!user) {
      res.send({
        name: "NoUserFound",
        message: `We had trouble trying to find the user by the name of ${username}`,
      });
    } else if (req.user && user.id === req.user.id) {
      const routines = await getPublicRoutinesByUser({ username: username });

      res.send(routines);
    } else {
      const routines = await getPublicRoutinesByUser({ username: username });

      res.send(routines);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = userRouter;
