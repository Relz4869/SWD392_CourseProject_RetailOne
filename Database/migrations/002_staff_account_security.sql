-- Non-destructive UC64/UC66 additions.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Staff') AND name='UX_Staff_Email')
  CREATE UNIQUE INDEX UX_Staff_Email ON dbo.Staff(email) WHERE email IS NOT NULL;
COMMIT;
