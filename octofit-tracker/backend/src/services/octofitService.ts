import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid activity');
  const { userId, teamId, type, minutes } = input as { userId?: unknown; teamId?: unknown; type?: unknown; minutes?: unknown };
  if (!isValidId(userId) || !isValidId(teamId)) throw httpError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw httpError(400, 'Minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid team');
  const { name, mascot, members } = input as { name?: unknown; mascot?: unknown; members?: unknown };
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');

  const memberIds = Array.isArray(members) ? members.filter(isValidId) : [];
  if (Array.isArray(members) && memberIds.length !== members.length) throw httpError(400, 'Invalid team member');
  if (memberIds.length > 0) {
    const count = await User.countDocuments({ _id: { $in: memberIds } });
    if (count !== memberIds.length) throw httpError(404, 'One or more team members not found');
  }

  return Team.create({
    name: name.trim(),
    mascot: typeof mascot === 'string' ? mascot.trim() : '',
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const totals = await Promise.all(teams.map(async (team) => ({
    teamName: team.name,
    totalPoints: await Activity.aggregate([
      { $match: { team: team._id } },
      { $group: { _id: null, totalPoints: { $sum: '$points' } } },
    ]).then((rows) => rows[0]?.totalPoints ?? 0),
  })));
  return totals
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) throw httpError(404, 'User not found');

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    walk: 'mobility',
    cycle: 'endurance',
    strength: 'strength',
  };
  const preferredFocus = (recent[0]?.type && activityFocus[recent[0].type.toLowerCase()])
    ?? (typeof user.fitnessGoal === 'string' ? user.fitnessGoal : undefined);

  if (preferredFocus) {
    const matching = await Workout.find({ focus: preferredFocus }).lean();
    if (matching.length > 0) {
      return matching.map((workout) => ({
        ...workout,
        reason: recent[0]
          ? `Based on your recent ${recent[0].type} activity and ${preferredFocus} goal`
          : `Supports your ${preferredFocus} fitness goal`,
      }));
    }
  }

  const fallback = await Workout.find().lean();
  return fallback.map((workout) => ({
    ...workout,
    reason: `Supports your ${user.fitnessGoal} fitness goal`,
  }));
}

export { User };
