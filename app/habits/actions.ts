"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HabitCategory } from "@/app/generated/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { getTodayDate, getWeekMonday } from "@/lib/date";
import {
  runHabitAddedMilestone,
  runHabitArchivedMilestone,
} from "@/lib/db/milestones";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not authenticated");

  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, timezone: true },
  });
  if (!prismaUser) throw new Error("User not found");
  return prismaUser;
}

export async function createHabit(formData: FormData) {
  const user = await getAuthUser();

  const name = (formData.get("name") as string).trim().slice(0, 100);
  if (!name) return;
  const icon = ((formData.get("icon") as string) || "⭐").slice(0, 10);
  const rawCategory = (formData.get("category") as string) || "other";
  const VALID_CATEGORIES = ["physical","mental","growth","recovery","connection","creative","spiritual","other"];
  const category = (VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "other") as HabitCategory;
  const defaultWeeklyGoal = Math.min(7, Math.max(1, Number(formData.get("defaultWeeklyGoal")) || 3));
  const description = ((formData.get("description") as string).trim() || "").slice(0, 500) || null;

  // Get next sort order
  const last = await prisma.habit.findFirst({
    where: { userId: user.id, archivedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      name,
      icon,
      category,
      defaultWeeklyGoal,
      description,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  // C7 Trigger 5: habit_added milestone (best-effort)
  const today = getTodayDate(user.timezone);
  runHabitAddedMilestone(user.id, habit.id, name, icon, today).catch(() => {});

  // Create a WeeklyGoal row for the current week
  const weekMonday = getWeekMonday(today);

  await prisma.weeklyGoal.upsert({
    where: { habitId_weekStartDate: { habitId: habit.id, weekStartDate: weekMonday } },
    create: {
      habitId: habit.id,
      userId: user.id,
      targetDays: defaultWeeklyGoal,
      weekStartDate: weekMonday,
    },
    update: { targetDays: defaultWeeklyGoal },
  });

  revalidatePath("/habits");
  revalidatePath("/now");
}

export async function updateHabit(habitId: string, formData: FormData) {
  const user = await getAuthUser();

  const name = (formData.get("name") as string).trim().slice(0, 100);
  if (!name) return;
  const icon = ((formData.get("icon") as string) || "⭐").slice(0, 10);
  const rawCategory = (formData.get("category") as string) || "other";
  const VALID_CATEGORIES = ["physical","mental","growth","recovery","connection","creative","spiritual","other"];
  const category = (VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "other") as HabitCategory;
  const defaultWeeklyGoal = Math.min(7, Math.max(1, Number(formData.get("defaultWeeklyGoal")) || 3));
  const description = ((formData.get("description") as string).trim() || "").slice(0, 500) || null;

  await prisma.habit.updateMany({
    where: { id: habitId, userId: user.id },
    data: { name, icon, category, defaultWeeklyGoal, description },
  });

  // Upsert a WeeklyGoal for the current week with the new goal
  const today = getTodayDate(user.timezone);
  const weekMonday = getWeekMonday(today);

  await prisma.weeklyGoal.upsert({
    where: { habitId_weekStartDate: { habitId, weekStartDate: weekMonday } },
    create: {
      habitId,
      userId: user.id,
      targetDays: defaultWeeklyGoal,
      weekStartDate: weekMonday,
    },
    update: { targetDays: defaultWeeklyGoal },
  });

  revalidatePath("/habits");
  revalidatePath("/now");
}

export async function archiveHabit(habitId: string) {
  const user = await getAuthUser();

  // Fetch habit before archiving so we have name/icon/createdAt for the milestone
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
    select: { name: true, icon: true, createdAt: true },
  });

  await prisma.habit.updateMany({
    where: { id: habitId, userId: user.id },
    data: { archivedAt: new Date() },
  });

  // C7 Trigger 6: habit_archived milestone (best-effort)
  if (habit) {
    const today = getTodayDate(user.timezone);
    runHabitArchivedMilestone(
      user.id, habitId, habit.name, habit.icon, habit.createdAt, today,
    ).catch(() => {});
  }

  revalidatePath("/habits");
  revalidatePath("/now");
}

export async function reorderHabits(orderedIds: string[]) {
  const user = await getAuthUser();

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.habit.updateMany({
        where: { id, userId: user.id },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath("/habits");
}
