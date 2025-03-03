// 创建并显示结果弹窗
function createResultPopup(question, answer, balance) {
  // 移除已有的弹窗（如果存在）
  removeExistingPopup();
  
  // 创建弹窗容器
  const popup = document.createElement('div');
  popup.id = 'deepseek-result-popup';
  popup.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    max-height: 500px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    padding: 20px;
    overflow-y: auto;
    font-family: 'Segoe UI', Arial, sans-serif;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
  `;
  
  // 创建标题
  const title = document.createElement('h3');
  title.textContent = 'Deepseek 回答';
  title.style.cssText = `
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 1px solid #eee;
    padding-bottom: 12px;
    font-size: 18px;
    font-weight: 600;
  `;
  
  // 创建问题区域
  const questionDiv = document.createElement('div');
  questionDiv.style.cssText = `
    margin-top: 12px;
    font-weight: bold;
    color: #2c3e50;
    font-size: 14px;
    background-color: #f8f9fa;
    padding: 10px;
    border-radius: 6px;
    border-left: 4px solid #3498db;
  `;
  questionDiv.textContent = '问题: ' + question;
  
  // 创建回答区域
  const answerDiv = document.createElement('div');
  answerDiv.style.cssText = `
    margin-top: 15px;
    white-space: pre-wrap;
    color: #34495e;
    line-height: 1.6;
    font-size: 14px;
    background-color: #fff;
    padding: 10px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  `;
  answerDiv.textContent = answer;
  
  // 创建API余额区域（如果有余额信息）
  let balanceDiv = null;
  if (balance) {
    balanceDiv = document.createElement('div');
    balanceDiv.style.cssText = `
      margin-top: 15px;
      padding-top: 12px;
      border-top: 1px dashed #eee;
      font-size: 12px;
      color: #7f8c8d;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    // 创建余额图标
    const balanceIcon = document.createElement('span');
    balanceIcon.innerHTML = '💰';
    balanceIcon.style.marginRight = '5px';
    
    // 创建余额文本
    const balanceTextSpan = document.createElement('span');
    
    // 格式化余额信息
    let balanceText = 'API余额: ';
    if (balance.total_available) {
      balanceText += `${balance.total_available} 点数`;
    } else if (balance.total_granted) {
      balanceText += `${balance.total_granted} 点数`;
    } else {
      balanceText += '信息不可用';
    }
    
    balanceTextSpan.textContent = balanceText;
    
    // 添加到余额区域
    balanceDiv.appendChild(balanceIcon);
    balanceDiv.appendChild(balanceTextSpan);
  }
  
  // 创建关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 10px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #7f8c8d;
  `;
  closeButton.onclick = removeExistingPopup;
  
  // 添加元素到弹窗
  popup.appendChild(closeButton);
  popup.appendChild(title);
  popup.appendChild(questionDiv);
  popup.appendChild(answerDiv);
  if (balanceDiv) {
    popup.appendChild(balanceDiv);
  }
  
  // 添加到页面（不使用遮罩，让用户可以继续浏览网页）
  document.body.appendChild(popup);
  
  // 添加动画效果
  setTimeout(() => {
    popup.style.transform = 'translateY(0)';
    popup.style.opacity = '1';
  }, 10);
  
  // 添加鼠标悬停效果
  popup.addEventListener('mouseenter', () => {
    popup.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
  });
  
  popup.addEventListener('mouseleave', () => {
    popup.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.15)';
  });
  
  // 5分钟后自动关闭
  setTimeout(removeExistingPopup, 300000);
}

// 创建并显示加载中状态
function showLoading(text) {
  // 移除已有的弹窗（如果存在）
  removeExistingPopup();
  
  // 创建加载中弹窗
  const loadingPopup = document.createElement('div');
  loadingPopup.id = 'deepseek-loading-popup';
  loadingPopup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    padding: 20px;
    text-align: center;
    font-family: Arial, sans-serif;
  `;
  
  // 创建加载中文本
  const loadingText = document.createElement('div');
  loadingText.textContent = text || '加载中...';
  loadingText.style.cssText = `
    color: #2c3e50;
    margin-bottom: 15px;
  `;
  
  // 创建加载中动画
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 2s linear infinite;
    margin: 0 auto;
  `;
  
  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // 添加到弹窗
  loadingPopup.appendChild(loadingText);
  loadingPopup.appendChild(spinner);
  
  // 创建背景遮罩
  const overlay = document.createElement('div');
  overlay.id = 'deepseek-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  `;
  
  // 添加到页面
  document.body.appendChild(overlay);
  document.body.appendChild(loadingPopup);
}

// 显示错误信息
function showError(errorMessage) {
  // 移除已有的弹窗（如果存在）
  removeExistingPopup();
  
  // 创建错误弹窗
  const errorPopup = document.createElement('div');
  errorPopup.id = 'deepseek-error-popup';
  errorPopup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    padding: 20px;
    text-align: center;
    font-family: Arial, sans-serif;
  `;
  
  // 创建错误标题
  const errorTitle = document.createElement('h3');
  errorTitle.textContent = '出错了';
  errorTitle.style.cssText = `
    margin-top: 0;
    color: #c0392b;
  `;
  
  // 创建错误信息
  const errorText = document.createElement('div');
  errorText.textContent = errorMessage;
  errorText.style.cssText = `
    color: #2c3e50;
    margin: 15px 0;
  `;
  
  // 创建关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '关闭';
  closeButton.style.cssText = `
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  `;
  closeButton.onclick = removeExistingPopup;
  
  // 添加到弹窗
  errorPopup.appendChild(errorTitle);
  errorPopup.appendChild(errorText);
  errorPopup.appendChild(closeButton);
  
  // 创建背景遮罩
  const overlay = document.createElement('div');
  overlay.id = 'deepseek-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  `;
  overlay.onclick = removeExistingPopup;
  
  // 添加到页面
  document.body.appendChild(overlay);
  document.body.appendChild(errorPopup);
}

// 移除已存在的弹窗
function removeExistingPopup() {
  const existingPopup = document.getElementById('deepseek-result-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  const existingLoading = document.getElementById('deepseek-loading-popup');
  if (existingLoading) {
    existingLoading.remove();
  }
  
  const existingError = document.getElementById('deepseek-error-popup');
  if (existingError) {
    existingError.remove();
  }
  
  const existingOverlay = document.getElementById('deepseek-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
}

// 创建流式响应弹窗
function createStreamingPopup(question) {
  // 移除已有的弹窗（如果存在）
  removeExistingPopup();
  
  // 创建弹窗容器
  const popup = document.createElement('div');
  popup.id = 'deepseek-result-popup';
  popup.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    max-height: 500px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    padding: 20px;
    overflow-y: auto;
    font-family: 'Segoe UI', Arial, sans-serif;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
  `;
  
  // 创建标题
  const title = document.createElement('h3');
  title.textContent = 'Deepseek 回答';
  title.style.cssText = `
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 1px solid #eee;
    padding-bottom: 12px;
    font-size: 18px;
    font-weight: 600;
  `;
  
  // 创建问题区域
  const questionDiv = document.createElement('div');
  questionDiv.style.cssText = `
    margin-top: 12px;
    font-weight: bold;
    color: #2c3e50;
    font-size: 14px;
    background-color: #f8f9fa;
    padding: 10px;
    border-radius: 6px;
    border-left: 4px solid #3498db;
  `;
  questionDiv.textContent = '问题: ' + question;
  
  // 创建回答区域
  const answerDiv = document.createElement('div');
  answerDiv.id = 'deepseek-answer';
  answerDiv.style.cssText = `
    margin-top: 15px;
    white-space: pre-wrap;
    color: #34495e;
    line-height: 1.6;
    font-size: 14px;
    background-color: #fff;
    padding: 10px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  `;
  answerDiv.textContent = answer;
  
  // 创建API余额区域（如果有余额信息）
  let balanceDiv = null;
  if (balance) {
    balanceDiv = document.createElement('div');
    balanceDiv.style.cssText = `
      margin-top: 15px;
      padding-top: 12px;
      border-top: 1px dashed #eee;
      font-size: 12px;
      color: #7f8c8d;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    // 创建余额图标
    const balanceIcon = document.createElement('span');
    balanceIcon.innerHTML = '💰';
    balanceIcon.style.marginRight = '5px';
    
    // 创建余额文本
    const balanceTextSpan = document.createElement('span');
    
    // 格式化余额信息
    let balanceText = 'API余额: ';
    if (balance.total_available) {
      balanceText += `${balance.total_available} 点数`;
    } else if (balance.total_granted) {
      balanceText += `${balance.total_granted} 点数`;
    } else {
      balanceText += '信息不可用';
    }
    
    balanceTextSpan.textContent = balanceText;
    
    // 添加到余额区域
    balanceDiv.appendChild(balanceIcon);
    balanceDiv.appendChild(balanceTextSpan);
  }
  
  // 创建关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 10px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #7f8c8d;
  `;
  closeButton.onclick = removeExistingPopup;
  
  // 添加元素到弹窗
  popup.appendChild(closeButton);
  popup.appendChild(title);
  popup.appendChild(questionDiv);
  popup.appendChild(answerDiv);
  
  // 添加到页面（不使用遮罩，让用户可以继续浏览网页）
  document.body.appendChild(popup);
  
  // 添加动画效果
  setTimeout(() => {
    popup.style.transform = 'translateY(0)';
    popup.style.opacity = '1';
  }, 10);
  
  // 添加鼠标悬停效果
  popup.addEventListener('mouseenter', () => {
    popup.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
  });
  
  popup.addEventListener('mouseleave', () => {
    popup.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.15)';
  });
  
  // 5分钟后自动关闭
  setTimeout(removeExistingPopup, 300000);
  
  return popup;
}

// 更新流式响应内容
function updateStreamingContent(content, isFirst) {
  const answerDiv = document.getElementById('deepseek-answer');
  if (!answerDiv) return;
  
  const cursor = document.getElementById('deepseek-cursor');
  
  if (isFirst) {
    // 第一次更新，清空之前的内容
    while (answerDiv.firstChild && answerDiv.firstChild !== cursor) {
      answerDiv.removeChild(answerDiv.firstChild);
    }
  }
  
  // 创建文本节点并添加到回答区域
  const textNode = document.createTextNode(content);
  answerDiv.insertBefore(textNode, cursor);
  
  // 自动滚动到底部
  const popup = document.getElementById('deepseek-result-popup');
  if (popup) {
    popup.scrollTop = popup.scrollHeight;
  }
}

// 结束流式响应并显示余额信息
function endStreaming(balance) {
  const answerDiv = document.getElementById('deepseek-answer');
  if (!answerDiv) return;
  
  // 移除光标
  const cursor = document.getElementById('deepseek-cursor');
  if (cursor) {
    cursor.remove();
  }
  
  // 如果有余额信息，添加到弹窗
  if (balance) {
    const popup = document.getElementById('deepseek-result-popup');
    if (popup) {
      const balanceDiv = document.createElement('div');
      balanceDiv.style.cssText = `
        margin-top: 15px;
        padding-top: 12px;
        border-top: 1px dashed #eee;
        font-size: 12px;
        color: #7f8c8d;
        display: flex;
        align-items: center;
        justify-content: space-between;
      `;
      
      // 创建余额图标
      const balanceIcon = document.createElement('span');
      balanceIcon.innerHTML = '💰';
      balanceIcon.style.marginRight = '5px';
      
      // 创建余额文本
      const balanceTextSpan = document.createElement('span');
      
      // 格式化余额信息
      let balanceText = 'API余额: ';
      if (balance.total_available) {
        balanceText += `${balance.total_available} 点数`;
      } else if (balance.total_granted) {
        balanceText += `${balance.total_granted} 点数`;
      } else {
        balanceText += '信息不可用';
      }
      
      balanceTextSpan.textContent = balanceText;
      
      // 添加到余额区域
      balanceDiv.appendChild(balanceIcon);
      balanceDiv.appendChild(balanceTextSpan);
      
      popup.appendChild(balanceDiv);
    }
  }
}

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showLoading') {
    showLoading(message.text);
  } else if (message.action === 'showResult') {
    createResultPopup(message.data.question, message.data.answer, message.data.balance);
  } else if (message.action === 'showError') {
    showError(message.error);
  } else if (message.action === 'startStreaming') {
    // 开始流式响应
    createStreamingPopup(message.data.question);
  } else if (message.action === 'updateStreaming') {
    // 更新流式响应内容
    updateStreamingContent(message.data.content, message.data.isFirst);
  } else if (message.action === 'endStreaming') {
    // 结束流式响应
    endStreaming(message.data.balance);
  }
  
  // 返回true表示异步响应
  return true;
});