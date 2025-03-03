-- 创建数据库（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'deepseek_qa')
BEGIN
    CREATE DATABASE deepseek_qa;
END
GO

-- 使用数据库
USE deepseek_qa;
GO

-- 创建表（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'qa_records')
BEGIN
    CREATE TABLE qa_records (
        id INT IDENTITY(1,1) PRIMARY KEY,
        question NVARCHAR(MAX) NOT NULL,
        answer NVARCHAR(MAX) NOT NULL,
        timestamp DATETIME NOT NULL,
        source_url NVARCHAR(500) NULL,
        selected_text NVARCHAR(MAX) NULL,
        model_type NVARCHAR(50) NULL
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_qa_records_timestamp' AND object_id = OBJECT_ID('qa_records'))
BEGIN
    CREATE INDEX IX_qa_records_timestamp ON qa_records(timestamp);
END
GO

-- 创建全文索引（用于搜索功能）
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'QACatalog')
BEGIN
    CREATE FULLTEXT CATALOG QACatalog AS DEFAULT;
END
GO

IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('qa_records'))
BEGIN
    CREATE FULLTEXT INDEX ON qa_records(question, answer) KEY INDEX PK__qa_recor__3213E83F;
END
GO

PRINT N'数据库和表结构已成功创建！';