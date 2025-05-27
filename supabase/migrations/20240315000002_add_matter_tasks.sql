-- Create enum for task status
CREATE TYPE task_status AS ENUM ('Not Started', 'In Progress', 'Completed');

-- Create matter_tasks table
CREATE TABLE matter_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Intake', 'Planning', 'Active Work', 'Closure')),
  weight INTEGER NOT NULL CHECK (weight > 0),
  status task_status NOT NULL DEFAULT 'Not Started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create matter_task_history table for tracking task status changes
CREATE TABLE matter_task_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES matter_tasks(id) ON DELETE CASCADE,
  status task_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add progress column to matters table
ALTER TABLE matters
ADD COLUMN progress JSONB NOT NULL DEFAULT '{
  "overall": 0,
  "by_stage": {
    "Intake": 0,
    "Planning": 0,
    "Active Work": 0,
    "Closure": 0
  },
  "completed_tasks": 0,
  "total_tasks": 0,
  "completed_weight": 0,
  "total_weight": 0
}'::jsonb;

-- Create indexes
CREATE INDEX idx_matter_tasks_matter_id ON matter_tasks(matter_id);
CREATE INDEX idx_matter_tasks_status ON matter_tasks(status);
CREATE INDEX idx_matter_task_history_task_id ON matter_task_history(task_id);

-- Create function to update matter progress
CREATE OR REPLACE FUNCTION update_matter_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_matter_id UUID;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_total_weight INTEGER;
  v_completed_weight INTEGER;
  v_overall NUMERIC;
  v_by_stage JSONB;
BEGIN
  -- Get matter_id from the task
  IF TG_OP = 'DELETE' THEN
    v_matter_id := OLD.matter_id;
  ELSE
    v_matter_id := NEW.matter_id;
  END IF;

  -- Calculate task counts and weights
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'Completed'),
    COALESCE(SUM(weight), 0),
    COALESCE(SUM(weight) FILTER (WHERE status = 'Completed'), 0)
  INTO v_total_tasks, v_completed_tasks, v_total_weight, v_completed_weight
  FROM matter_tasks
  WHERE matter_id = v_matter_id;

  -- Calculate overall progress
  v_overall := CASE 
    WHEN v_total_weight > 0 THEN (v_completed_weight::NUMERIC / v_total_weight) * 100
    ELSE 0
  END;

  -- Calculate progress by stage
  SELECT jsonb_object_agg(
    stage,
    CASE 
      WHEN stage_total > 0 THEN (stage_completed::NUMERIC / stage_total) * 100
      ELSE 0
    END
  )
  INTO v_by_stage
  FROM (
    SELECT 
      stage,
      SUM(weight) as stage_total,
      SUM(weight) FILTER (WHERE status = 'Completed') as stage_completed
    FROM matter_tasks
    WHERE matter_id = v_matter_id
    GROUP BY stage
  ) stage_stats;

  -- Update matter progress
  UPDATE matters
  SET progress = jsonb_build_object(
    'overall', v_overall,
    'by_stage', v_by_stage,
    'completed_tasks', v_completed_tasks,
    'total_tasks', v_total_tasks,
    'completed_weight', v_completed_weight,
    'total_weight', v_total_weight
  )
  WHERE id = v_matter_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for task changes
CREATE TRIGGER update_matter_progress_on_task_change
AFTER INSERT OR UPDATE OR DELETE ON matter_tasks
FOR EACH ROW
EXECUTE FUNCTION update_matter_progress();

-- Create trigger for task status changes
CREATE TRIGGER record_task_status_change
AFTER UPDATE OF status ON matter_tasks
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION record_task_status_change();

-- Create function to record task status changes
CREATE OR REPLACE FUNCTION record_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO matter_task_history (task_id, status)
  VALUES (NEW.id, NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 