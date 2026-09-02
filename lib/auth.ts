import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePrismaUser } from "@/lib/db/user";

/**
 * Returns the Prisma user for the current request, creating one if this is
 * their first visit. React.cache() deduplicates the Supabase auth call and
 * Prisma upsert within a single server render tree — both the shared layout
 * and individual pages can call this without an extra round-trip.
 */
export const getAppUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getOrCreatePrismaUser(user);
});
