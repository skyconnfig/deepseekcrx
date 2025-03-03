// 保存配置
async function saveConfig(key, value) {
  await chrome.storage.sync.set({ [key]: value });
}

// 加载配置
async function loadConfig() {
  const result = await chrome.storage.sync.get(['apiKey', 'modelType']);
  if (result.apiKey) {
    document.getElementById('apiKey').value = result.apiKey;
  }
  if (result.modelType) {
    document.getElementById('modelType').value = result.modelType;
  }
}

// 测试API连接
async function testApiConnection() {
  const apiKey = document.getElementById('apiKey').value;
  const modelType = document.getElementById('modelType').value;
  const statusElement = document.getElementById('apiStatus');
  
  if (!apiKey) {
    statusElement.textContent = '请输入API Key';
    statusElement.className = 'api-status error';
    return;
  }

  try {
    let testEndpoint;
    if (modelType === 'deepseek') {
      testEndpoint = 'https://api.deepseek.com/v1/models';
    } else {
      testEndpoint = 'http://localhost:8000/v1/models';
    }

    const response = await fetch(testEndpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      statusElement.textContent = '连接成功！';
      statusElement.className = 'api-status success';
      await saveConfig('apiKey', apiKey);
      await saveConfig('modelType', modelType);
    } else {
      throw new Error('API验证失败');
    }
  } catch (error) {
    statusElement.textContent = `连接失败: ${error.message}`;
    statusElement.className = 'api-status error';
  }
}

// 测试SQL连接
async function testSqlConnection() {
  const statusElement = document.getElementById('sqlStatus');
  
  try {
    statusElement.textContent = '正在连接数据库...';
    statusElement.className = 'api-status';
    
    // 通过API调用服务器测试数据库连接
    const response = await fetch('http://localhost:3000/api/test-connection');
    const result = await response.json();
    
    if (result.success) {
      statusElement.textContent = 'SQL数据库连接成功！';
      statusElement.className = 'api-status success';
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    statusElement.textContent = `SQL连接失败: ${error.message}`;
    statusElement.className = 'api-status error';
    console.error('SQL连接错误:', error);
  }
}

// 事件监听器
document.getElementById('apiKey').addEventListener('change', (e) => {
  saveConfig('apiKey', e.target.value);
});

document.getElementById('modelType').addEventListener('change', (e) => {
  saveConfig('modelType', e.target.value);
});

document.getElementById('testApi').addEventListener('click', testApiConnection);

document.getElementById('testSql').addEventListener('click', testSqlConnection);

document.getElementById('saveConfig').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value;
  const modelType = document.getElementById('modelType').value;
  const statusElement = document.getElementById('apiStatus');

  if (!apiKey) {
    statusElement.textContent = '请输入API Key';
    statusElement.className = 'api-status error';
    return;
  }

  try {
    await saveConfig('apiKey', apiKey);
    await saveConfig('modelType', modelType);
    statusElement.textContent = '配置已保存！';
    statusElement.className = 'api-status success';
  } catch (error) {
    statusElement.textContent = `保存失败: ${error.message}`;
    statusElement.className = 'api-status error';
  }
});

// 页面加载时加载配置
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  loadHistory();
});

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'deepseekResponse') {
    addToHistory({
      question: message.data.question,
      answer: message.data.answer,
      timestamp: new Date().toISOString(),
      source_url: message.data.source_url,
      selected_text: message.data.selected_text,
      model_type: message.data.model_type
    });
  } else if (message.type === 'error') {
    alert('Error: ' + message.data);
  }
});

// 显示历史记录
function addToHistory(data) {
  const container = document.getElementById('historyContainer');
  const qaItem = document.createElement('div');
  qaItem.className = 'qa-item';
  
  const question = document.createElement('div');
  question.className = 'question';
  question.textContent = data.question;
  
  const answer = document.createElement('div');
  answer.className = 'answer';
  answer.textContent = data.answer;
  
  const timestamp = document.createElement('div');
  timestamp.className = 'timestamp';
  timestamp.textContent = new Date(data.timestamp).toLocaleString();
  
  // 添加来源URL（如果有）
  if (data.source_url) {
    const sourceUrl = document.createElement('div');
    sourceUrl.className = 'source-url';
    sourceUrl.innerHTML = `<small>来源: <a href="${data.source_url}" target="_blank">${data.source_url}</a></small>`;
    qaItem.appendChild(sourceUrl);
  }
  
  // 添加模型类型（如果有）
  if (data.model_type) {
    const modelType = document.createElement('div');
    modelType.className = 'model-type';
    modelType.innerHTML = `<small>模型: ${data.model_type}</small>`;
    qaItem.appendChild(modelType);
  }
  
  qaItem.appendChild(question);
  qaItem.appendChild(answer);
  qaItem.appendChild(timestamp);
  
  container.insertBefore(qaItem, container.firstChild);
}

// 加载历史记录
async function loadHistory() {
  try {
    // 通过API调用服务器获取历史记录
    const response = await fetch('http://localhost:3000/api/history');
    const result = await response.json();
    
    if (result.success && result.data) {
      result.data.forEach(record => {
        addToHistory(record);
      });
    } else {
      console.error('获取历史记录失败:', result.message);
    }
  } catch (err) {
    console.error('获取历史记录错误:', err);
  }
}

// 页面加载时获取历史记录
document.addEventListener('DOMContentLoaded', loadHistory);