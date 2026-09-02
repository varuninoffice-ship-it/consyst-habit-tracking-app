"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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
  return prismaUser;
}

/** monthKey is "YYYY-MM-DD" — always the 1st of the month. Returns null if invalid. */
function parseMonthDate(monthKey: string): Date | null {
  if (!/^\d{4}-\d{2}-01$/.test(monthKey)) return null;
  const [y, m] = monthKey.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  const d = new Date(Date.UTC(y, m - 1, 1));
  return isNaN(d.getTime()) ? null : d;
}

const MAX_LIST_ITEMS = 20;
const MAX_ITEM_LENGTH = 500;
const MAX_JOURNAL_LENGTH = 10_000;

export async function saveWins(monthKey: string, items: string[]) {
  const user = await getAuthUser();
  const reflectionMonth = parseMonthDate(monthKey);
  if (!reflectionMonth) return;
  const safe = items.slice(0, MAX_LIST_ITEMS).map((s) => s.slice(0, MAX_ITEM_LENGTH));
  await prisma.reflection.upsert({
    where: { userId_reflectionMonth: { userId: user.id, reflectionMonth } },
    create: { userId: user.id, reflectionMonth, wins: safe },
    update: { wins: safe },
  });
  revalidatePath("/reflect");
}

export async function saveGaps(monthKey: string, items: string[]) {
  const user = await getAuthUser();
  const reflectionMonth = parseMonthDate(monthKey);
  if (!reflectionMonth) return;
  const safe = items.slice(0, MAX_LIST_ITEMS).map((s) => s.slice(0, MAX_ITEM_LENGTH));
  await prisma.reflection.upsert({
    where: { userId_reflectionMonth: { userId: user.id, reflectionMonth } },
    create: { userId: user.id, reflectionMonth, gaps: safe },
    update: { gaps: safe },
  });
  revalidatePath("/reflect");
}

export async function saveJournal(monthKey: string, text: string) {
  const user = await getAuthUser();
  const reflectionMonth = parseMonthDate(monthKey);
  if (!reflectionMonth) return;
  const safe = text.slice(0, MAX_JOURNAL_LENGTH);
  await prisma.reflection.upsert({
    where: { userId_reflectionMonth: { userId: user.id, reflectionMonth } },
    create: { userId: user.id, reflectionMonth, journal: safe },
    update: { journal: safe },
  });
  revalidatePath("/reflect");
}

export async function saveIntentions(monthKey: string, items: string[]) {
  const user = await getAuthUser();
  const reflectionMonth = parseMonthDate(monthKey);
  if (!reflectionMonth) return;
  const safe = items.slice(0, MAX_LIST_ITEMS).map((s) => s.slice(0, MAX_ITEM_LENGTH));
  await prisma.reflection.upsert({
    where: { userId_reflectionMonth: { userId: user.id, reflectionMonth } },
    create: { userId: user.id, reflectionMonth, intentions: safe },
    update: { intentions: safe },
  });
  revalidatePath("/reflect");
}
