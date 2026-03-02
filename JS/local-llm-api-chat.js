// 本地大模型API对话工具脚本

let serverUrl = 'http://10.244.166.147:1234/v1';
let isConnected = false;
let selectedModel = '';
let currentChatId = null;
let chats = [];

// 创建markdown-it实例，添加所有必要的扩展
const md = new markdownit({
    html: true, // 启用HTML支持
    linkify: true, // 自动识别链接
    typographer: true, // 启用排版功能
    breaks: true, // 启用换行
    highlight: function(str, lang) {
        if (lang && window.hljs) {
            try {
                return window.hljs.highlight(str, { language: lang }).value;
            } catch (__) {}
        }
        return ''; // 使用默认的转义
    }
})
.use(markdownitMark) // 支持==高亮==
.use(markdownitFootnote); // 支持脚注

applySubSupRules(md);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化服务器地址
    const serverUrlInput = document.getElementById('serverUrl');
    serverUrl = serverUrlInput.value;
    
    // 测试连接按钮点击事件
    document.getElementById('testConnection').addEventListener('click', testConnection);
    
    // 发送消息按钮点击事件
    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    
    // 回车键发送消息
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 服务器地址输入变化时更新
    serverUrlInput.addEventListener('change', (e) => {
        serverUrl = e.target.value;
        isConnected = false;
        updateConnectionStatus('未测试', '');
        // 禁用模型选择
        document.getElementById('modelSelect').disabled = true;
        document.getElementById('modelSelect').innerHTML = '<option value="">请先测试连接</option>';
    });
    
    // 模型选择变化时更新
    document.getElementById('modelSelect').addEventListener('change', (e) => {
        selectedModel = e.target.value;
        updateConnectionStatus(`已选择模型：${selectedModel}`, 'success');
    });
    
    // 对话管理按钮事件
    document.getElementById('newChat').addEventListener('click', createNewChat);
    document.getElementById('exportChat').addEventListener('click', exportChat);
    document.getElementById('importChat').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importChat);
    
    // 加载保存的对话
    loadChats();
    // 创建默认对话
    if (chats.length === 0) {
        createNewChat();
    } else {
        // 切换到第一个对话
        switchChat(chats[0].id);
    }
});

// 测试连接并更新模型列表
async function testConnection() {
    const statusElement = document.getElementById('connectionStatus');
    const modelSelect = document.getElementById('modelSelect');
    statusElement.textContent = '测试中...';
    statusElement.className = 'status-message';
    
    try {
        const response = await fetch(`${serverUrl}/models`);
        if (response.ok) {
            const models = await response.json();
            isConnected = true;
            let modelInfo = '成功';
            
            // 清空并更新模型选择下拉菜单
            modelSelect.innerHTML = '';
            
            if (models && models.data && models.data.length > 0) {
                // 过滤出适合对话的模型，排除嵌入模型
                const chatModels = models.data.filter(model => 
                    !model.id.includes('embedding')
                );
                
                if (chatModels.length > 0) {
                    // 添加模型选项
                    chatModels.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = model.id;
                        modelSelect.appendChild(option);
                    });
                    
                    // 默认选择第一个模型
                    selectedModel = chatModels[0].id;
                    modelSelect.value = selectedModel;
                    modelInfo += `\n已选择模型：${selectedModel}`;
                } else {
                    // 如果没有找到模型，显示提示
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '无可用模型';
                    modelSelect.appendChild(option);
                    modelInfo += '\n无可用模型';
                }
            } else {
                // 如果模型列表为空，显示提示
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '无可用模型';
                modelSelect.appendChild(option);
                modelInfo += '\n无可用模型';
            }
            
            // 启用模型选择
            modelSelect.disabled = false;
            updateConnectionStatus(modelInfo, 'success');
        } else {
            isConnected = false;
            updateConnectionStatus(`失败：服务器返回错误 ${response.status} ${response.statusText}`, 'error');
        }
    } catch (error) {
        isConnected = false;
        let errorMessage = `失败：${error.message}`;
        if (error.message.includes('Failed to fetch')) {
            errorMessage += '\n可能的原因：\n1. LM Studio服务器未运行\n2. 服务器地址不正确\n3. 网络连接问题\n4. CORS限制';
        }
        updateConnectionStatus(errorMessage, 'error');
    }
}

// 更新连接状态
function updateConnectionStatus(message, type) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}

// 发送消息
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendMessage');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // 检查连接状态
    if (!isConnected) {
        alert('请先测试服务器连接');
        return;
    }
    
    // 禁用发送按钮并显示加载状态
    sendButton.disabled = true;
    sendButton.textContent = '发送中...';
    
    // 生成消息ID
    const userMessageId = generateMessageId();
    // 添加用户消息到聊天界面
    addMessage('user', message, null, userMessageId);
    // 添加用户消息到当前对话
    addMessageToCurrentChat('user', message, null, userMessageId);
    userInput.value = '';
    
    try {
        // 构建消息历史 - 直接使用chats数组中的原始对象
        const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
        const currentChat = chatIndex !== -1 ? chats[chatIndex] : null;
        const messages = currentChat ? currentChat.messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        })) : [];
        
        // 发送请求到LM Studio服务器（使用流式输出）
        const response = await fetch(`${serverUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel, // 使用用户选择的模型
                messages: messages,
                temperature: 0.7,
                // 请求模型返回思考内容
                thought: true,
                // 启用流式输出
                stream: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`服务器返回错误: ${response.status}`);
        }
        
        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let fullThought = '';
        let messageId = null;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            console.log('服务器响应:', chunk);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6);
                    if (dataStr === '[DONE]') break;
                    
                    try {
                        const data = JSON.parse(dataStr);
                        console.log('解析后的数据:', data);
                        if (data.choices && data.choices[0]) {
                            const delta = data.choices[0].delta;
                            console.log('Delta数据:', delta);
                            
                            // 累加思考内容
                            if (delta.reasoning_content) {
                                fullThought += delta.reasoning_content;
                                console.log('思考内容:', delta.reasoning_content);
                            }
                            if (delta.thought) {
                                fullThought += delta.thought;
                                console.log('思考内容 (thought字段):', delta.thought);
                            }
                            
                            // 累加正式内容
                            if (delta.content) {
                                fullContent += delta.content;
                                console.log('正式内容:', delta.content);
                            }
                            
                            // 如果还没有消息，创建一个新消息
                            if (!messageId) {
                                messageId = addMessage('assistant', fullContent, fullThought);
                                // 添加助手消息到当前对话
                                addMessageToCurrentChat('assistant', fullContent, fullThought, messageId);
                            } else {
                                // 更新现有消息的内容
                                updateMessage(messageId, fullContent);
                                // 更新思考内容
                                updateThoughtContent(messageId, fullThought);
                                // 更新对话历史中的消息
                                const currentChat = chats.find(chat => chat.id === currentChatId);
                                if (currentChat) {
                                    const messageIndex = currentChat.messages.findIndex(msg => msg.id === messageId);
                                    if (messageIndex !== -1) {
                                        currentChat.messages[messageIndex].content = fullContent;
                                        currentChat.messages[messageIndex].thought = fullThought;
                                        saveChats();
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('解析流式数据失败:', error);
                    }
                }
            }
        }
        
        console.log('完整内容:', fullContent);
        console.log('完整思考内容:', fullThought);
        
        // 助手消息已经在流式处理过程中添加，不需要重复添加
        
    } catch (error) {
        // 显示错误信息
        const errorMessageId = generateMessageId();
        addMessage('assistant', `错误: ${error.message}`, null, errorMessageId);
        addMessageToCurrentChat('assistant', `错误: ${error.message}`, null, errorMessageId);
    } finally {
        // 恢复发送按钮状态
        sendButton.disabled = false;
        sendButton.textContent = '发送';
    }
}

// 生成唯一的消息ID
function generateMessageId() {
    return `message-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// 智能滚动函数：只在滚动条在底部附近时才自动滚动
function scrollToBottomIfNeeded() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const scrollTop = chatMessages.scrollTop;
    const scrollHeight = chatMessages.scrollHeight;
    const clientHeight = chatMessages.clientHeight;

    // 如果滚动条距离底部小于50px，则自动滚动到底部
    if (scrollHeight - scrollTop - clientHeight < 50) {
        chatMessages.scrollTop = scrollHeight;
    }
}

// 添加消息到聊天窗口
function addMessage(role, content, thought, messageId = generateMessageId()) {
    const chatMessages = document.getElementById('chatMessages');
    
    // 创建消息容器，包含思考内容和消息本身
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${role}`;
    
    // 如果有思考内容，添加可折叠的思考部分在消息上方
    if (thought) {
        const thoughtContainer = document.createElement('div');
        thoughtContainer.className = 'thought-container';
        
        const thoughtToggle = document.createElement('button');
        thoughtToggle.className = 'thought-toggle';
        thoughtToggle.textContent = '📝 隐藏思考过程';
        
        const thoughtContent = document.createElement('div');
        thoughtContent.className = 'thought-content';
        // 默认显示思考内容
        thoughtContent.style.display = 'block';
        // 使用markdown-it渲染思考内容中的Markdown
        thoughtContent.innerHTML = md.render(thought);
        
        // 切换思考内容的显示/隐藏
        thoughtToggle.addEventListener('click', () => {
            if (thoughtContent.style.display === 'none') {
                thoughtContent.style.display = 'block';
                thoughtToggle.textContent = '📝 隐藏思考过程';
            } else {
                thoughtContent.style.display = 'none';
                thoughtToggle.textContent = '📝 显示思考过程';
            }
        });
        
        thoughtContainer.appendChild(thoughtToggle);
        thoughtContainer.appendChild(thoughtContent);
        messageContainer.appendChild(thoughtContainer);
    }
    
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.id = messageId;
    messageElement.className = `chat-message ${role}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    // 使用markdown-it渲染Markdown内容
    contentElement.innerHTML = md.render(content || '');
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString();
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);
    
    // 添加操作按钮
    const actionsElement = document.createElement('div');
    actionsElement.className = 'message-actions';
    
    // 如果是用户消息，添加编辑按钮
    if (role === 'user') {
        const editButton = document.createElement('button');
        editButton.className = 'action-btn edit-btn';
        editButton.textContent = '✏️ 编辑';
        editButton.addEventListener('click', () => editMessage(messageId));
        actionsElement.appendChild(editButton);
    }
    
    // 为所有消息添加删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-btn delete-btn';
    deleteButton.textContent = '🗑️ 删除';
    deleteButton.addEventListener('click', () => deleteMessage(messageId));
    actionsElement.appendChild(deleteButton);
    
    messageElement.appendChild(actionsElement);
    
    // 将消息元素添加到消息容器
    messageContainer.appendChild(messageElement);
    
    // 将消息容器添加到聊天消息区域
    chatMessages.appendChild(messageContainer);

    // 智能滚动：如果滚动条在底部附近则自动滚动
    scrollToBottomIfNeeded();

    return messageId;
}

// 移除消息
function removeMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        // 找到消息容器并删除
        const messageContainer = messageElement.parentElement;
        if (messageContainer && messageContainer.classList.contains('message-container')) {
            messageContainer.remove();
        } else {
            messageElement.remove();
        }
    }
}

// 给代码块添加行号
function addLineNumbersToCodeBlocks(container) {
    const preElements = container.querySelectorAll('pre');
    
    preElements.forEach(pre => {
        const codeElement = pre.querySelector('code');
        if (!codeElement) return;
        
        // 获取原始代码文本
        const originalCode = codeElement.textContent;
        
        // 尝试获取语言类型（从class中获取，如 language-javascript）
        let lang = '';
        const classList = codeElement.className.split(' ');
        for (const cls of classList) {
            if (cls.startsWith('language-')) {
                lang = cls.replace('language-', '');
                break;
            }
        }
        
        // 使用highlight.js进行语法高亮
        let highlightedCode = originalCode;
        if (lang && window.hljs && typeof hljs.highlight === 'function') {
            try {
                highlightedCode = hljs.highlight(originalCode, { language: lang }).value;
            } catch (__) {}
        }
        
        // 将高亮后的代码按行分割
        const lines = originalCode.split('\n');
        // 移除最后一个空行
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        
        // 现在我们需要重新构建带行号的HTML
        // 我们把每一行包裹在一个span中，并在前面添加行号
        const highlightedLines = highlightedCode.split('\n');
        if (highlightedLines.length > 0 && highlightedLines[highlightedLines.length - 1] === '') {
            highlightedLines.pop();
        }
        
        // 构建新的HTML
        let newHTML = '';
        for (let i = 0; i < lines.length; i++) {
            const lineContent = highlightedLines[i] || '';
            newHTML += `<span class="code-line"><span class="line-number">${i + 1}</span>${lineContent}</span>`;
        }
        
        // 替换code元素的内容
        codeElement.innerHTML = newHTML;
        
        // 给pre添加类名
        pre.classList.add('code-with-line-numbers');
    });
}

// 更新消息内容
function updateMessage(messageId, content) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        const contentElement = messageElement.querySelector('.message-content');
        if (contentElement) {
            // 使用markdown-it渲染Markdown内容
            contentElement.innerHTML = md.render(content);
            // 给代码块添加行号
            addLineNumbersToCodeBlocks(contentElement);
            // 渲染数学公式
            if (window.MathJax) {
                MathJax.typesetPromise([contentElement]).catch(err => console.error('MathJax渲染失败:', err));
            }
            // 智能滚动：如果滚动条在底部附近则自动滚动
            scrollToBottomIfNeeded();
        }
    }
}

// 为消息添加思考内容
function addThoughtToMessage(messageId, thought) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        // 检查是否已经有思考内容
        const messageContainer = messageElement.parentElement;
        if (messageContainer && messageContainer.className === 'message-container') {
            // 检查容器中是否已经有思考内容
            if (!messageContainer.querySelector('.thought-container')) {
                const thoughtContainer = document.createElement('div');
                thoughtContainer.className = 'thought-container';
                
                const thoughtToggle = document.createElement('button');
                thoughtToggle.className = 'thought-toggle';
                thoughtToggle.textContent = '📝 隐藏思考过程';
                
                const thoughtContent = document.createElement('div');
                thoughtContent.className = 'thought-content';
                // 默认显示思考内容
                thoughtContent.style.display = 'block';
                // 使用markdown-it渲染思考内容中的Markdown
                thoughtContent.innerHTML = md.render(thought);
                // 给代码块添加行号
                addLineNumbersToCodeBlocks(thoughtContent);
                // 渲染数学公式
                if (window.MathJax) {
                    MathJax.typesetPromise([thoughtContent]).catch(err => console.error('MathJax渲染失败:', err));
                }
                
                // 切换思考内容的显示/隐藏
                thoughtToggle.addEventListener('click', () => {
                    if (thoughtContent.style.display === 'none') {
                        thoughtContent.style.display = 'block';
                        thoughtToggle.textContent = '📝 隐藏思考过程';
                    } else {
                        thoughtContent.style.display = 'none';
                        thoughtToggle.textContent = '📝 显示思考过程';
                    }
                });
                
                thoughtContainer.appendChild(thoughtToggle);
                thoughtContainer.appendChild(thoughtContent);
                
                // 插入到消息元素之前
                messageContainer.insertBefore(thoughtContainer, messageElement);
            }
        } else {
            // 如果没有容器，创建一个新的容器
            const newMessageContainer = document.createElement('div');
            newMessageContainer.className = 'message-container';
            
            // 创建思考内容
            const thoughtContainer = document.createElement('div');
            thoughtContainer.className = 'thought-container';
            
            const thoughtToggle = document.createElement('button');
            thoughtToggle.className = 'thought-toggle';
            thoughtToggle.textContent = '📝 隐藏思考过程';
            
            const thoughtContent = document.createElement('div');
            thoughtContent.className = 'thought-content';
            // 默认显示思考内容
            thoughtContent.style.display = 'block';
            // 使用markdown-it渲染思考内容中的Markdown
            thoughtContent.innerHTML = md.render(thought);
            // 给代码块添加行号
            addLineNumbersToCodeBlocks(thoughtContent);
            // 渲染数学公式
            if (window.MathJax) {
                MathJax.typesetPromise([thoughtContent]).catch(err => console.error('MathJax渲染失败:', err));
            }
            
            // 切换思考内容的显示/隐藏
            thoughtToggle.addEventListener('click', () => {
                if (thoughtContent.style.display === 'none') {
                    thoughtContent.style.display = 'block';
                    thoughtToggle.textContent = '📝 隐藏思考过程';
                } else {
                    thoughtContent.style.display = 'none';
                    thoughtToggle.textContent = '📝 显示思考过程';
                }
            });
            
            thoughtContainer.appendChild(thoughtToggle);
            thoughtContainer.appendChild(thoughtContent);
            
            // 将思考内容和消息元素添加到新容器
            newMessageContainer.appendChild(thoughtContainer);
            newMessageContainer.appendChild(messageElement);
            
            // 替换原消息元素
            messageElement.parentElement.replaceChild(newMessageContainer, messageElement);
        }
    }
}

// 更新思考内容
function updateThoughtContent(messageId, thought) {
    try {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            // 尝试从消息容器中查找思考内容
            let thoughtContent = null;
            
            // 先检查消息元素本身
            thoughtContent = messageElement.querySelector('.thought-content');
            
            // 如果没有找到，检查父容器
            if (!thoughtContent) {
                const messageContainer = messageElement.parentElement;
                if (messageContainer) {
                    thoughtContent = messageContainer.querySelector('.thought-content');
                }
            }
            
            if (thoughtContent) {
                try {
                    // 使用markdown-it渲染思考内容中的Markdown
                    thoughtContent.innerHTML = md.render(thought);
                    // 给代码块添加行号
                    addLineNumbersToCodeBlocks(thoughtContent);
                    // 渲染数学公式
                    if (window.MathJax) {
                        MathJax.typesetPromise([thoughtContent]).catch(err => console.error('MathJax渲染失败:', err));
                    }
                } catch (error) {
                    // 如果Markdown渲染失败，直接显示原始内容
                    thoughtContent.textContent = thought;
                }
            } else {
                console.log('未找到思考内容元素');
            }
        } else {
            console.log('未找到消息元素:', messageId);
        }
    } catch (error) {
        console.error('更新思考内容失败:', error);
    }
}

// 创建新对话
function createNewChat() {
    const chatId = `chat-${Date.now()}`;
    const chat = {
        id: chatId,
        title: `对话 ${chats.length + 1}`,
        messages: []
    };
    
    chats.push(chat);
    saveChats();
    updateChatTabs();
    switchChat(chatId);
}

// 切换对话
function switchChat(chatId) {
    currentChatId = chatId;
    
    // 清空聊天窗口
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    // 加载当前对话的消息
    const currentChat = chats.find(chat => chat.id === chatId);
    if (currentChat) {
        currentChat.messages.forEach(message => {
            if (message.type === 'user') {
                addMessage('user', message.content, null, message.id);
            } else if (message.type === 'assistant') {
                addMessage('assistant', message.content, message.thought, message.id);
            }
        });
    }
    
    // 更新对话标签的选中状态
    updateChatTabs();
}

// 更新对话标签
function updateChatTabs() {
    const chatTabs = document.getElementById('chatTabs');
    chatTabs.innerHTML = '';
    
    chats.forEach(chat => {
        const tab = document.createElement('div');
        tab.className = `tab ${chat.id === currentChatId ? 'active' : ''}`;
        tab.innerHTML = `
            <span>${chat.title}</span>
            <button class="close-tab" data-chat-id="${chat.id}">×</button>
        `;
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('close-tab')) {
                switchChat(chat.id);
            }
        });
        
        // 添加关闭按钮事件
        const closeButton = tab.querySelector('.close-tab');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        chatTabs.appendChild(tab);
    });
}

// 删除对话
function deleteChat(chatId) {
    const index = chats.findIndex(chat => chat.id === chatId);
    if (index !== -1) {
        chats.splice(index, 1);
        saveChats();
        updateChatTabs();
        
        // 如果删除的是当前对话，切换到第一个对话
        if (chatId === currentChatId) {
            if (chats.length > 0) {
                switchChat(chats[0].id);
            } else {
                createNewChat();
            }
        }
    }
}

// 保存对话到本地存储
function saveChats() {
    localStorage.setItem('lmStudioChats', JSON.stringify(chats));
}

// 删除消息
function deleteMessage(messageId) {
    const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
    if (chatIndex !== -1) {
        const currentChat = chats[chatIndex];
        const messageIndex = currentChat.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
            currentChat.messages.splice(messageIndex, 1);
            saveChats();
            removeMessage(messageId);
        }
    }
}

// 编辑消息
function editMessage(messageId) {
    if (!isConnected) {
        alert('请先测试服务器连接');
        return;
    }
    const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
    if (chatIndex !== -1) {
        const currentChat = chats[chatIndex];
        const messageIndex = currentChat.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1 && currentChat.messages[messageIndex].type === 'user') {
            const message = currentChat.messages[messageIndex];
            const newContent = prompt('请输入新的消息内容:', message.content);
            if (newContent !== null && newContent.trim() !== '') {
                message.content = newContent.trim();

                // 从修改的消息之后的所有消息都被丢弃
                currentChat.messages = currentChat.messages.slice(0, messageIndex + 1);

                saveChats();

                // 清空聊天界面，只重新渲染用户消息（编辑后的消息后面不应该有助手消息）
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.innerHTML = '';
                currentChat.messages.forEach(msg => {
                    if (msg.type === 'user') {
                        addMessage('user', msg.content, null, msg.id);
                    } else if (msg.type === 'assistant') {
                        addMessage('assistant', msg.content, msg.thought, msg.id);
                    }
                });

                // 直接使用编辑后的消息历史发送请求，而不是新添加消息
                sendEditedMessage();
            }
        }
    }
}

// 发送编辑后的消息
async function sendEditedMessage() {
    const sendButton = document.getElementById('sendMessage');

    // 检查连接状态
    if (!isConnected) {
        alert('请先测试服务器连接');
        return;
    }

    // 禁用发送按钮并显示加载状态
    sendButton.disabled = true;
    sendButton.textContent = '发送中...';

    try {
        // 直接使用chats数组中的消息历史，不添加新消息
        const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
        const currentChat = chatIndex !== -1 ? chats[chatIndex] : null;
        const messages = currentChat ? currentChat.messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        })) : [];

        // 发送请求到LM Studio服务器（使用流式输出）
        const response = await fetch(`${serverUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: messages,
                temperature: 0.7,
                thought: true,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let fullThought = '';
        let messageId = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices[0].delta;

                        if (delta.reasoning_content) {
                            fullThought += delta.reasoning_content;
                        }
                        if (delta.thought) {
                            fullThought += delta.thought;
                        }
                        if (delta.content) {
                            fullContent += delta.content;
                        }

                        if (!messageId) {
                            messageId = addMessage('assistant', fullContent, fullThought);
                            addMessageToCurrentChat('assistant', fullContent, fullThought, messageId);
                        } else {
                            updateMessage(messageId, fullContent);
                            updateThoughtContent(messageId, fullThought);
                            // 更新对话历史中的消息
                            const chatIdx = chats.findIndex(chat => chat.id === currentChatId);
                            if (chatIdx !== -1) {
                                const chat = chats[chatIdx];
                                const msgIdx = chat.messages.findIndex(msg => msg.id === messageId);
                                if (msgIdx !== -1) {
                                    chat.messages[msgIdx].content = fullContent;
                                    chat.messages[msgIdx].thought = fullThought;
                                    saveChats();
                                }
                            }
                        }
                    } catch (error) {
                        console.error('解析流式数据失败:', error);
                    }
                }
            }
        }

    } catch (error) {
        const errorMessageId = generateMessageId();
        addMessage('assistant', `错误: ${error.message}`, null, errorMessageId);
        addMessageToCurrentChat('assistant', `错误: ${error.message}`, null, errorMessageId);
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = '发送';
    }
}

// 从本地存储加载对话
function loadChats() {
    const savedChats = localStorage.getItem('lmStudioChats');
    if (savedChats) {
        try {
            chats = JSON.parse(savedChats);
            // 为没有ID的消息生成唯一的ID
            chats.forEach(chat => {
                chat.messages.forEach(message => {
                    if (!message.id) {
                        message.id = generateMessageId();
                    }
                });
            });
            // 保存更新后的对话
            saveChats();
        } catch (error) {
            console.error('加载对话失败:', error);
            chats = [];
        }
    }
}

// 导出对话
function exportChat() {
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (!currentChat) return;
    
    const chatData = JSON.stringify(currentChat, null, 2);
    const blob = new Blob([chatData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChat.title || '对话'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导入对话
function importChat(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const chatData = JSON.parse(event.target.result);
            if (chatData.messages) {
                // 生成新的对话ID
                const chatId = `chat-${Date.now()}`;
                chatData.id = chatId;
                chats.push(chatData);
                saveChats();
                updateChatTabs();
                switchChat(chatId);
                alert('对话导入成功！');
            } else {
                alert('无效的对话文件！');
            }
        } catch (error) {
            console.error('导入对话失败:', error);
            alert('导入对话失败，请检查文件格式！');
        }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    e.target.value = '';
}

// 添加消息到当前对话
function addMessageToCurrentChat(type, content, thought = '', messageId = generateMessageId()) {
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (currentChat) {
        currentChat.messages.push({ id: messageId, type, content, thought, timestamp: new Date().toLocaleTimeString() });
        saveChats();
    }
    return messageId;
}