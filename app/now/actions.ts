"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getTodayDate } from "@/lib/date";
import {
  runPostCheckInMilestones,
  runWeekCloseMilestones,
} from "@/lib/db/milestones";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, timezone: true },
  });
  return prismaUser;
}

export async function toggleHabitLog(
  habitId: string,
  logDateKey: string, // "YYYY-MM-DD"
  completed: boolean
) {
  const prismaUser = await getAuthUser();
  if (!prismaUser) return;

  // Validate date format to prevent malformed input reaching the DB
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDateKey)) return;

  const logDate = new Date(logDateKey + "T00:00:00.000Z");
  if (isNaN(logDate.getTime())) return;

  // Verify the habit belongs to the authenticated user — prevents writing logs
  // to habits owned by other users (IDOR protection).
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: prismaUser.id },
    select: { id: true },
  });
  if (!habit) return;

  await prisma.habitLog.upsert({
    where: { habitId_logDate: { habitId, logDate } },
    create: { habitId, userId: prismaUser.id, logDate, completed },
    update: { completed },
  });

  // C7 milestone detection — only on check (not uncheck)
  if (completed) {
    const today = getTodayDate(prismaUser.timezone);
    // Run non-blocking — milestone failures must not break the check-in UX
    Promise.all([
      runPostCheckInMilestones(prismaUser.id, habitId, today),
      runWeekCloseMilestones(prismaUser.id, today),
    ]).catch(() => {
      // Milestone detection is best-effort; never surface errors to the user
    });
  }

  revalidatePath("/now");
  revalidatePath("/pulse");
}
