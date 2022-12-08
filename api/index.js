const express = require("express");
const apiRouter = express.Router();
const jwt = require("jsonwebtoken");
const { getUserById } = require("../db");
const { JWT_SECRET } = process.env;

// GET /api/health
apiRouter.get("/health", async (req, res, next) => {
  try {
    res.send({
      success: true,
      message: "I am good and healthy",
    });
  } catch (error) {
    throw(error);
  }
  next();
});

apiRouter.use(async (req, res, next) => {
  const prefix = "Bearer ";
  const auth = req.header("Authorization");

  if (!auth) {
    next();
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);
    try {
      const {id} = jwt.verify(token, JWT_SECRET);
    if (id) {
      req.user = await getUserById(id);
      next();
      }
  } catch ({ name, message }) {
    next({ name, message });
    }
  } else {
    next({
      name: "AuthorizationHeaderError",
      message: `
      Authorization token must start with ${prefix}
      `,
    });
  }
});

apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log("User is set:", req.user);
  }

  next();
});


// apiRouter: /api/users
const usersRouter = require("./users");
apiRouter.use("/users", usersRouter);

// ROUTER: /api/activities
const activitiesRouter = require("./activities");
apiRouter.use("/activities", activitiesRouter);

// ROUTER: /api/routines
const routinesRouter = require("./routines");
apiRouter.use("/routines", routinesRouter);

// ROUTER: /api/routine_activities
const routineActivitiesRouter = require("./routineActivities");
apiRouter.use("/routine_activities", routineActivitiesRouter);

apiRouter.get("*", (req, res, next) => {
  res.status(404);
  res.send({
    message: "Not Found",
  });
});

apiRouter.use((error, req, res, next) => {
  if (error.error == "Unauthorized") {
    res.status(401);
  }
  res.send({
    error: error.name,
    name: error.name,
    message: error.message,
  });
});

module.exports = apiRouter;
