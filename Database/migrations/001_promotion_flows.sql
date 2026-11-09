-- Run once after RetailOne_DB_Schema.sql, against RetailOnePOS. No existing rows are changed.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
ALTER TABLE dbo.Promotions DROP CONSTRAINT CK_Prom_Status, CK_Prom_Value, CK_Prom_Dates;
ALTER TABLE dbo.Promotions ALTER COLUMN name NVARCHAR(255) NULL;
ALTER TABLE dbo.Promotions ALTER COLUMN type VARCHAR(20) NULL;
ALTER TABLE dbo.Promotions ALTER COLUMN value DECIMAL(15,2) NULL;
ALTER TABLE dbo.Promotions ALTER COLUMN startDate DATETIME2(7) NULL;
ALTER TABLE dbo.Promotions ALTER COLUMN endDate DATETIME2(7) NULL;
ALTER TABLE dbo.Promotions ADD
  requestKey VARCHAR(100) NULL,
  requestHash VARCHAR(64) NULL,
  CONSTRAINT CK_Prom_Status CHECK (status IN ('Draft','Active','Disabled','Expired','Deleted')),
  CONSTRAINT CK_Prom_Value CHECK (value >= 0 AND (type <> 'Percent' OR value <= 100)),
  CONSTRAINT CK_Prom_Dates CHECK (endDate >= startDate),
  CONSTRAINT CK_Prom_Published CHECK (status = 'Draft' OR
    (name IS NOT NULL AND LEN(LTRIM(RTRIM(name))) > 0 AND type IS NOT NULL
     AND value IS NOT NULL AND startDate IS NOT NULL AND endDate IS NOT NULL));
-- Compile the index only after ALTER TABLE has added its column in this transaction.
EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_Prom_RequestKey ON dbo.Promotions(requestKey) WHERE requestKey IS NOT NULL;';
CREATE TABLE dbo.PromotionProductExclusions (
  promotionId BIGINT NOT NULL REFERENCES dbo.Promotions(id) ON DELETE CASCADE,
  productId BIGINT NOT NULL REFERENCES dbo.Products(id),
  CONSTRAINT PK_PromotionProductExclusions PRIMARY KEY (promotionId, productId)
);
COMMIT;
