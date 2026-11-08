/* UC82 partial migration: sealed blind count only.
   Final reconciliation remains blocked until Sales supplies a trusted
   cash receipt/refund/payout ledger contract by working session. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.CashHandoverCounts', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CashHandoverCounts (
    id         INT IDENTITY(1,1) NOT NULL,
    scheduleId INT           NOT NULL,
    countedBy  BIGINT        NOT NULL,
    actualCash DECIMAL(15,2) NOT NULL,
    countedAt  DATETIME2(7)  NOT NULL CONSTRAINT DF_CashCount_CountedAt DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_CashHandoverCounts PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_CashHandoverCounts_Schedule UNIQUE (scheduleId),
    CONSTRAINT FK_CashCount_Schedule FOREIGN KEY (scheduleId) REFERENCES dbo.WorkSchedules(id),
    CONSTRAINT FK_CashCount_Staff FOREIGN KEY (countedBy) REFERENCES dbo.Staff(id),
    CONSTRAINT CK_CashCount_Actual CHECK (actualCash >= 0)
  );
END;

IF OBJECT_ID(N'dbo.CashHandoverDenominations', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CashHandoverDenominations (
    id           INT IDENTITY(1,1) NOT NULL,
    countId      INT NOT NULL,
    denomination INT NOT NULL,
    quantity     INT NOT NULL,
    subtotal     AS (CONVERT(DECIMAL(15,2), denomination) * quantity) PERSISTED,
    CONSTRAINT PK_CashHandoverDenominations PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_CashHandoverDenomination UNIQUE (countId, denomination),
    CONSTRAINT FK_CashHandoverDenomination_Count FOREIGN KEY (countId)
      REFERENCES dbo.CashHandoverCounts(id) ON DELETE CASCADE,
    CONSTRAINT CK_CashHandoverDenomination_Value CHECK (
      denomination IN (500000,200000,100000,50000,20000,10000,5000,2000,1000)
    ),
    CONSTRAINT CK_CashHandoverDenomination_Quantity CHECK (quantity >= 0)
  );
END;

COMMIT TRANSACTION;
