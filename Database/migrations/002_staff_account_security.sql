-- Non-destructive UC64/UC66 additions. Existing JWTs are treated as version zero.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF COL_LENGTH('dbo.Users','tokenVersion') IS NULL
  ALTER TABLE dbo.Users ADD tokenVersion INT NOT NULL CONSTRAINT DF_Users_TokenVersion DEFAULT (0) WITH VALUES;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Staff') AND name='UX_Staff_Email')
  CREATE UNIQUE INDEX UX_Staff_Email ON dbo.Staff(email) WHERE email IS NOT NULL;
COMMIT;
