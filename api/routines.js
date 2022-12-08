const express = require("express");
const routineRouter = express.Router();
const { requireUser } = require("./utilities");

const {
  getAllPublicRoutines,
  createRoutine,
  destroyRoutine,
  getRoutineById,
  updateRoutine,
} = require("../db/routines");

const {
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
} = require("../db/routine_activities");

// GET /api/routines
routineRouter.get("/", async (req, res, next) => {
  try {
    const allRoutines = await getAllPublicRoutines();

    res.send(allRoutines);
  } catch (error) {
    next(error);
  }
});

// POST /api/routines
routineRouter.post("/", requireUser, async (req, res, next) => {
  const { isPublic, name, goal } = req.body;
  try {
    const newRoutine = await createRoutine({
      creatorId: req.user.id,
      isPublic,
      name,
      goal,
    });
    if (newRoutine) {
      res.send(newRoutine);
    } else {
      next({
        name: "err",
        message: "You must be logged in order to perform this action",
      });
    }
  } catch ({ message, name }) {
    next({ message, name });
  }
});

// PATCH /api/routines/:routineId
routineRouter.patch("/:routineId", requireUser, async (req, res, next) => {
  try {
    const { isPublic, name, goal } = req.body;
    const routineId = req.params.routineId;
    const routine = await getRoutineById(routineId);

    if (routine.creatorId != req.user.id) {
      res.status(403);
      next({
        error: "Error Message",
        name: "User not found",
        message: `User ${req.user.username} is not allowed to update ${routine.name}`,
      });
    }
    const updatedRoutine = await updateRoutine({
      id: routineId,
      name,
      goal,
      isPublic,
    });
    res.send(updatedRoutine);
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// DELETE /api/routines/:routineId
routineRouter.delete("/:routineId", requireUser, async (req, res, next) => {
  try {
    const routineId = req.params.routineId;
    const routine = await getRoutineById(routineId);

    if (routine.creatorId != req.user.id) {
      res.status(403);
      next({
        error: "error message",
        name: "Unauthorized User",
        message: `User ${req.user.username} is not allowed to delete ${routine.name}`,
      });
    }
    await destroyRoutine(routineId);
    res.send(routine);
  } catch (error) {
    next(error);
  }
});

// POST /api/routines/:routineId/activities
routineRouter.post(
  "/:routineId/activities",
  requireUser,
  async (req, res, next) => {
    try {
      const {routineId} = req.params;

      const {activityId, count, duration} = req.body;
      const routine_activities = await getRoutineActivitiesByRoutine({
        id: routineId,
      });
      let found = false;
      routine_activities.forEach((ra) => {
      if (ra.activityId == activityId) {
          found = true;
        }
    });
      if (found) {
       next({
        name: "duplicate activityId",
        message: `Activity ID ${activityId} already exists in Routine ID ${routineId}`,
        });
      } else {
      const newRoutine = await addActivityToRoutine({
        routineId,
        duration,
        count,
        activityId
      });
      res.send(newRoutine);
    }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = routineRouter;
