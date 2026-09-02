import { prisma } from "@/lib/prisma";

interface SupabaseAuthUser {
  email?: string;
  user_metadata?: Record<string, string>;
}

/**
 * Returns the Prisma User for a Supabase auth user, creating one if this is
 * their first visit. Uses email as the stable link between auth and data.
 */
export async function getOrCreatePrismaUser(supabaseUser: SupabaseAuthUser) {
  const email = supabaseUser.email;
  if (!email) throw new Error("Supabase user has no email");

  const meta = supabaseUser.user_metadata ?? {};
  const name =
    meta.full_name ||
    `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() ||
    email.split("@")[0];

  // upsert: create on first visit, no-op update on subsequent visits
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      systemStartedAt: new Date(), // Prisma strips time for @db.Date
      timezone: "UTC", // updatable in Settings later
    },
  });
}
