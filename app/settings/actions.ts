"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not authenticated");

  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  if (!prismaUser) throw new Error("User not found");
  return { prismaUser, supabase };
}

export async function updateProfile(formData: FormData) {
  const { prismaUser } = await getAuthUser();

  const name     = (formData.get("name") as string).trim();
  const timezone = (formData.get("timezone") as string).trim();

  if (!name) return;

  await prisma.user.update({
    where: { id: prismaUser.id },
    data: { name, timezone },
  });

  // Revalidate all pages that display the user's name or use their timezone
  for (const path of ["/settings", "/now", "/habits", "/pulse", "/story", "/reflect"]) {
    revalidatePath(path);
  }
}

export async function resetUserData() {
  const { prismaUser } = await getAuthUser();
  const uid = prismaUser.id;

  // Sequential deletes — no $transaction (PgBouncer pooler incompatible with
  // interactive transactions). Order respects FK constraints.
  await prisma.milestone.deleteMany({ where: { userId: uid } });
  await prisma.reflection.deleteMany({ where: { userId: uid } });
  await prisma.dayNote.deleteMany({ where: { userId: uid } });
  await prisma.habitLog.deleteMany({ where: { userId: uid } });
  await prisma.weeklyGoal.deleteMany({ where: { userId: uid } });
  await prisma.habit.deleteMany({ where: { userId: uid } });

  // Reset system start date to today
  await prisma.user.update({
    where: { id: uid },
    data: { systemStartedAt: new Date() },
  });

  redirect("/now");
}

export async function deleteAccount() {
  const { prismaUser, supabase } = await getAuthUser();

  // Deleting the User cascades to all related tables (habits, logs, goals,
  // reflections, dayNotes, milestones) via onDelete: Cascade in schema.
  await prisma.user.delete({ where: { id: prismaUser.id } });

  // Sign out so the Supabase session is cleared
  await supabase.auth.signOut();

  redirect("/signin");
}
