-- Add notification_emails column to org_settings
-- Allows organizations to specify custom email addresses for alert notifications

ALTER TABLE org_settings
ADD COLUMN notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment
COMMENT ON COLUMN org_settings.notification_emails IS 'Custom email addresses to receive alert notifications. If empty, admins with manage permission will be notified.';
