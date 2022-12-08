
const client = require("./client");

// database functions
async function getAllActivities() {
  try {
    const { rows } = await client.query(`
    SELECT * from activities;
    `);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getActivityById(activityId) {
  try {
    const {
      rows: [activities],
    } = await client.query(`
    SELECT * FROM activities WHERE id=${activityId}
    `);
    return activities;
  } catch (error) {
    throw error;
  }
}

async function getActivityByName(name) {
  try {
    const {
      rows: [activities],
    } = await client.query(`SELECT * FROM activities WHERE name=$1;`, [name]);
    return activities;
  } catch (error) {
    throw error;
  }
}


async function attachActivitiesToRoutines(routines) {
  const routinesToReturn = [...routines];
  const binds = routines.map((_, index) => `$${index + 1}`).join(", ");
  const routineIds = routines.map((routine) => routine.id);
  if (!routineIds?.length) return [];

  try {

    const {rows: activities} = await client.query(
      `
      SELECT activities.*, routine_activities.duration, routine_activities.count,
      routine_activities.id AS "routineActivityId", routine_activities."routineId"
      FROM activities 
      JOIN routine_activities ON routine_activities."activityId" = activities.id
      WHERE routine_activities."routineId" IN (${binds});
    `,
      routineIds
    );

    for (const routine of routinesToReturn) {

      const activitiesToAdd = activities.filter(
        (activity) => activity.routineId === routine.id
      );

      routine.activities = activitiesToAdd;
    }
    return routinesToReturn;
  } catch (error) {
    throw error;
  }
}

// return the new activity
async function createActivity({name, description}) {
  try {
    const {
      rows: [activity],
    } = await client.query(
      `
      INSERT INTO activities (name, description)
      VALUES($1, $2)
      ON CONFLICT (name) DO NOTHING
      RETURNING *;`,

      [name, description]
    );
    return activity;
  } catch (error) {
    throw error;
  }
}


async function updateActivity({id, ...fields}) {
  const setString = Object.keys(fields)
    .map((key, i) => `"${key}"=$${i + 1}`).join(", ");
  if (setString.length === 0) {
    return;
  }
  try {
    const {
      rows: [activities],
    } = await client.query(
      `
      UPDATE activities
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return activities;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  updateActivity,
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
};
