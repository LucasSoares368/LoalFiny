-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a schema for our maintenance tasks if it doesn't exist
CREATE SCHEMA IF NOT EXISTS maintenance;

-- Function to trigger reminders processing
CREATE OR REPLACE FUNCTION maintenance.trigger_process_reminders()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://wwdfjzvnqgotztnvnqxp.supabase.co/functions/v1/process-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger smart alerts processing
CREATE OR REPLACE FUNCTION maintenance.trigger_process_smart_alerts()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://wwdfjzvnqgotztnvnqxp.supabase.co/functions/v1/process-smart-alerts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the reminders processing (every 5 minutes)
SELECT cron.schedule(
  'process-reminders-job',
  '*/5 * * * *',
  'SELECT maintenance.trigger_process_reminders();'
);

-- Schedule the smart alerts processing (every 10 minutes)
SELECT cron.schedule(
  'process-smart-alerts-job',
  '*/10 * * * *',
  'SELECT maintenance.trigger_process_smart_alerts();'
);
