const express = require("express");
const activitiesRouter = express.Router();

const {
  getAllActivities,
  createActivity,
  getActivityByName,
  getActivityById,
  updateActivity,
} = require("../db/activities");
const { getPublicRoutinesByActivity } = require("../db/routines");
const { requireUser } = require("./utilities");

// GET /api/activities/:activityId/routines
activitiesRouter.get("/:activityId/routines", async (req, res, next) => {
  const id = req.params.activityId;

  try {
    const routines = await getPublicRoutinesByActivity({ id });
    const activity = await getActivityById(id);

    if (!activity) {
      next({
        name: "RoutineDoesNotExist",
        message: `Activity ${id} not found`,
        error: "This routine doesn't exist",
      });
      return;
    }
    if (routines) {
      res.send(routines);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});



// GET /api/activities
activitiesRouter.get("/", async (req, res, next) => {
  try {
    const activities = await getAllActivities();
    if (activities) {
      res.send(activities);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// POST /api/activities
activitiesRouter.post("/", requireUser, async (req, res, next) => {
  const { name, description } = req.body;

  try {
    const _activity = await getActivityByName(name);

    if (_activity) {
      next({
        name: "ActivityExistsError",
        message: `An activity with name ${name} already exists`,
        error: "choose another activity",
      });
      return;
    }
    const activity = await createActivity({ name, description });

    if (activity) {
      res.send(activity);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// PATCH /api/activities/:activityId

activitiesRouter.patch("/:activityId", requireUser, async (req, res, next) => {
  const id = req.params.activityId;
  const { name, description } = req.body;
  const updateFields = {};
  if (name) {
    updateFields.name = name;
  }
  if (description) {
    updateFields.description = description;
  }
  try {
    const activity = await getActivityById(id);
    if (!activity) {
      next({
        name: "ActivityExistsError",
        message: `Activity ${id} not found`,
        error: "choose another activity",
      });
      return;
    }
    const activityName = await getActivityByName(name);
    if (activityName) {
      next({
        name: "ActivityNameError",
        message: `An activity with name ${name} already exists`,
        error: "Rename activity name",
      });
    }
    const patchActivity = await updateActivity({ id, name, description });
    if (patchActivity) {
      res.send(patchActivity);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = activitiesRouter;
