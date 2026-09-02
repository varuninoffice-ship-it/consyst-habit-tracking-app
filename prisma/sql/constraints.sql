-- Consyst – supplementary constraints, partial indexes, and triggers
-- These cannot be expressed in Prisma schema and must be applied manually.
--
-- HOW TO APPLY:
--   After running `npx prisma migrate dev` for the first time, paste this
--   file into the Supabase SQL Editor and run it. It is safe to re-run:
--   all statements use IF NOT EXISTS / OR REPLACE / DROP IF EXISTS.
--
-- Data model v1.0 · Final · March 2026


-- ─── CHECK CONSTRAINTS ────────────────────────────────────────────────────────

-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, so each is dropped first to
-- keep this file re-runnable as documented above.

-- habits.default_weekly_goal must be 1–7
ALTER TABLE habits DROP CONSTRAINT IF EXISTS chk_habits_default_weekly_goal;
ALTER TABLE habits
  ADD CONSTRAINT chk_habits_default_weekly_goal
  CHECK (default_weekly_goal BETWEEN 1 AND 7);

-- habit_logs.log_date cannot be in the future
ALTER TABLE habit_logs DROP CONSTRAINT IF EXISTS chk_habit_logs_log_date_not_future;
ALTER TABLE habit_logs
  ADD CONSTRAINT chk_habit_logs_log_date_not_future
  CHECK (log_date <= CURRENT_DATE);

-- weekly_goals.target_days must be 1–7
ALTER TABLE weekly_goals DROP CONSTRAINT IF EXISTS chk_weekly_goals_target_days;
ALTER TABLE weekly_goals
  ADD CONSTRAINT chk_weekly_goals_target_days
  CHECK (target_days BETWEEN 1 AND 7);

-- weekly_goals.week_start_date must always be a Monday (DOW = 1 in ISO)
ALTER TABLE weekly_goals DROP CONSTRAINT IF EXISTS chk_weekly_goals_week_start_is_monday;
ALTER TABLE weekly_goals
  ADD CONSTRAINT chk_weekly_goals_week_start_is_monday
  CHECK (EXTRACT(DOW FROM week_start_date) = 1);

-- reflections.reflection_month must always be the 1st of the month
ALTER TABLE reflections DROP CONSTRAINT IF EXISTS chk_reflections_month_is_first;
ALTER TABLE reflections
  ADD CONSTRAINT chk_reflections_month_is_first
  CHECK (EXTRACT(DAY FROM reflection_month) = 1);


-- ─── PARTIAL INDEXES ──────────────────────────────────────────────────────────

-- Active habits only — most frequent query path for the check-in list
-- and Habits screen (Prisma @@index cannot express WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_habits_user_active
  ON habits (user_id)
  WHERE archived_at IS NULL;

-- Exclude test accounts from analytics aggregates
CREATE INDEX IF NOT EXISTS idx_users_role_non_test
  ON users (role)
  WHERE is_test = false;


-- ─── TRIGGER FUNCTIONS ────────────────────────────────────────────────────────

-- Function 1: Ensure habit_logs.user_id always equals the parent habit's user_id.
-- Prevents cross-user log writes even if the application layer has a bug.
CREATE OR REPLACE FUNCTION validate_habit_log_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT user_id FROM habits WHERE id = NEW.habit_id) IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION
      'habit_logs.user_id (%) must match habits.user_id for habit_id %',
      NEW.user_id, NEW.habit_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Block new check-ins on archived habits.
CREATE OR REPLACE FUNCTION validate_habit_not_archived()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT archived_at FROM habits WHERE id = NEW.habit_id) IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot log check-in for archived habit (habit_id: %)', NEW.habit_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Auto-update updated_at on every UPDATE.
-- Prisma @updatedAt also sets this via the client, but the trigger provides
-- belt-and-suspenders enforcement for any direct SQL updates.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── TRIGGERS ─────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_validate_habit_log_user ON habit_logs;
CREATE TRIGGER trg_validate_habit_log_user
  BEFORE INSERT OR UPDATE ON habit_logs
  FOR EACH ROW EXECUTE FUNCTION validate_habit_log_user();

DROP TRIGGER IF EXISTS trg_validate_habit_not_archived ON habit_logs;
CREATE TRIGGER trg_validate_habit_not_archived
  BEFORE INSERT ON habit_logs
  FOR EACH ROW EXECUTE FUNCTION validate_habit_not_archived();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_habits_updated_at ON habits;
CREATE TRIGGER trg_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_habit_logs_updated_at ON habit_logs;
CREATE TRIGGER trg_habit_logs_updated_at
  BEFORE UPDATE ON habit_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_day_notes_updated_at ON day_notes;
CREATE TRIGGER trg_day_notes_updated_at
  BEFORE UPDATE ON day_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reflections_updated_at ON reflections;
CREATE TRIGGER trg_reflections_updated_at
  BEFORE UPDATE ON reflections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
