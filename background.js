// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'askDeepseek',
    title: '使用Deepseek询问: "%s"',
    contexts: ['selection']
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'askDeepseek') {
    const selectedText = info.selectionText;
    try {
      // 获取配置信息
      const config = await chrome.storage.sync.get(['apiKey', 'modelType']);
      const apiKey = config.apiKey;
      const modelType = config.modelType || 'deepseek';

      if (!apiKey) {
        throw new Error('请先配置API Key');
      }

      // 根据模型类型选择API端点
      const apiEndpoint = modelType === 'deepseek' 
        ? 'https://api.deepseek.com/v1/chat/completions'
        : 'http://localhost:8000/v1/chat/completions';

      // 显示加载中的通知
      chrome.tabs.sendMessage(tab.id, {
        action: 'showLoading',
        text: '正在询问Deepseek...',
      });

      // 调用API（使用流式响应）
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: modelType === 'deepseek' ? 'deepseek-chat' : 'local-model',
          messages: [{
            role: 'user',
            content: selectedText
          }],
          stream: true // 启用流式响应
        })
      });
      
      if (!response.ok) {
        throw new Error('API请求失败: ' + response.statusText);
      }

      // 初始化答案变量
      let fullAnswer = '';
      let isFirstChunk = true;
      
      // 获取响应的可读流
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      // 通知前端开始接收流式响应
      chrome.tabs.sendMessage(tab.id, {
        action: 'startStreaming',
        data: {
          question: selectedText
        }
      });
      
      // 读取流数据
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 解码二进制数据
        const chunk = decoder.decode(value, { stream: true });
        
        // 处理SSE格式的数据
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                const content = data.choices[0].delta.content;
                fullAnswer += content;
                
                // 发送增量更新到页面
                chrome.tabs.sendMessage(tab.id, {
                  action: 'updateStreaming',
                  data: {
                    content: content,
                    isFirst: isFirstChunk
                  }
                });
                
                isFirstChunk = false;
              }
            } catch (e) {
              console.error('解析流数据错误:', e);
            }
          }
        }
      }
      
      // 获取API余额信息
      let balanceInfo = null;
      if (modelType === 'deepseek') {
        try {
          const balanceResponse = await fetch('https://api.deepseek.com/v1/dashboard/billing/credit_grants', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + apiKey
            }
          });
          
          if (balanceResponse.ok) {
            balanceInfo = await balanceResponse.json();
          }
        } catch (balanceError) {
          console.error('获取API余额失败:', balanceError);
          // 余额获取失败不影响主流程
        }
      }

      // 通知前端流式响应结束
      chrome.tabs.sendMessage(tab.id, {
        action: 'endStreaming',
        data: {
          balance: balanceInfo
        }
      });
      
      // 保存到数据库（在完整回答获取后）
      try {
        await saveToDatabase({
          question: selectedText,
          answer: fullAnswer,
          timestamp: new Date().toISOString(),
          source_url: tab.url,
          selected_text: selectedText,
          model_type: modelType
        });
      } catch (dbError) {
        console.error('Database Error:', dbError);
        // 数据库错误不影响用户体验，继续发送结果
      }

      // 发送结果到popup页面
      chrome.runtime.sendMessage({
        type: 'deepseekResponse',
        data: {
          question: selectedText,
          answer: fullAnswer,
          source_url: tab.url,
          selected_text: selectedText,
          model_type: modelType
        }
      });

    } catch (error) {
      console.error('Error:', error);
      // 发送错误消息到popup页面
      chrome.runtime.sendMessage({
        type: 'error',
        data: error.message
      });

      // 在页面上显示错误
      chrome.tabs.sendMessage(tab.id, {
        action: 'showError',
        error: error.message
      });
    }
  }
});

// 数据库操作函数
async function saveToDatabase(data) {
  try {
    // 通过API调用服务器保存数据
    const response = await fetch('http://localhost:3000/api/save-qa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('数据已成功保存到数据库');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error('Database Error:', err);
    throw err;
  }
}