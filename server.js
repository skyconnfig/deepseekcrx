const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const app = express();
const port = 3000;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 数据库配置
const dbConfig = {
  user: 'sa',
  password: 'saSA123',
  server: 'localhost',
  database: 'deepseek_qa',
  options: {
    encrypt: false,  // 修改为false，避免某些环境下的加密问题
    trustServerCertificate: true,
    enableArithAbort: true  // 添加此选项提高稳定性
  },
  pool: {
    max: 10, // 最大连接数
    min: 0, // 最小连接数
    idleTimeoutMillis: 30000, // 连接超时时间
    acquireTimeoutMillis: 30000, // 获取连接超时时间
    createTimeoutMillis: 30000  // 创建连接超时时间
  },
  connectionTimeout: 30000,  // 连接超时时间
  requestTimeout: 30000      // 请求超时时间
};

// 创建全局连接池
let pool;
let connectionRetries = 0;
const MAX_RETRIES = 3;

// 初始化数据库连接池
async function initPool() {
  try {
    console.log('正在初始化数据库连接池...');
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('数据库连接池已初始化');
    connectionRetries = 0; // 重置重试计数
    return pool;
  } catch (err) {
    console.error('初始化数据库连接池失败:', err);
    
    // 添加重试逻辑
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      console.log(`尝试重新连接数据库 (${connectionRetries}/${MAX_RETRIES})...`);
      // 延迟重试，避免立即重试导致的资源浪费
      await new Promise(resolve => setTimeout(resolve, 2000));
      return initPool();
    }
    
    throw new Error(`数据库连接失败，已重试${MAX_RETRIES}次: ${err.message}`);
  }
}

// 获取连接池
async function getPool() {
  if (!pool) {
    return await initPool();
  }
  
  // 检查连接是否有效
  try {
    // 尝试执行一个简单查询来验证连接
    await pool.request().query('SELECT 1');
    return pool;
  } catch (err) {
    console.warn('连接池可能已断开，尝试重新初始化:', err.message);
    return await initPool();
  }
}

// 测试数据库连接的API
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('正在测试数据库连接...');
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 as testConnection');
    console.log('数据库连接测试成功');
    res.json({ success: true, message: '数据库连接成功' });
  } catch (error) {
    console.error('数据库连接错误:', error);
    res.status(500).json({ 
      success: false, 
      message: `数据库连接失败: ${error.message}`,
      details: error.stack // 添加更详细的错误信息
    });
  }
});

// 保存问答记录的API
app.post('/api/save-qa', async (req, res) => {
  try {
    const { question, answer, timestamp, source_url, selected_text, model_type } = req.body;
    
    const pool = await getPool();
    const request = pool.request();
    await request
      .input('question', sql.NVarChar, question)
      .input('answer', sql.NVarChar, answer)
      .input('timestamp', sql.DateTime, new Date(timestamp))
      .input('source_url', sql.NVarChar, source_url || null)
      .input('selected_text', sql.NVarChar, selected_text || null)
      .input('model_type', sql.NVarChar, model_type || null)
      .query(`
        INSERT INTO qa_records (question, answer, timestamp, source_url, selected_text, model_type)
        VALUES (@question, @answer, @timestamp, @source_url, @selected_text, @model_type)
      `);
    
    // 使用非阻塞方式返回响应，让用户体验更流畅
    res.json({ success: true, message: '数据已成功保存' });
  } catch (error) {
    console.error('保存数据错误:', error);
    res.status(500).json({ success: false, message: `保存数据失败: ${error.message}` });
  }
});

// 获取历史记录的API
app.get('/api/history', async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    const result = await request.query(`
      SELECT TOP 20 question, answer, timestamp, source_url, selected_text, model_type
      FROM qa_records
      ORDER BY timestamp DESC
    `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('获取历史记录错误:', error);
    res.status(500).json({ success: false, message: `获取历史记录失败: ${error.message}` });
  }
});

// 优雅关闭连接池
process.on('SIGINT', async () => {
  if (pool) {
    try {
      await pool.close();
      console.log('数据库连接池已关闭');
    } catch (err) {
      console.error('关闭数据库连接池失败:', err);
    }
  }
  process.exit(0);
});

// 启动服务器
app.listen(port, async () => {
  try {
    // 服务启动时初始化连接池
    await initPool();
    console.log(`服务器运行在 http://localhost:${port}`);
  } catch (err) {
    console.error('服务器启动失败:', err);
    console.error('详细错误信息:', err.stack);
  }
});