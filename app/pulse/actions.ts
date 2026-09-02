"use server";

import { toggleHabitLog as _toggleHabitLog } from "@/app/now/actions";

export async function toggleHabitLog(...args: Parameters<typeof _toggleHabitLog>) {
  return _toggleHabitLog(...args);
}
