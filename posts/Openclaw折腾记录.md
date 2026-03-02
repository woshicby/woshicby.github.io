---
    title: Openclaw折腾记录
    date: 2026-02-06
    categories: [技术, 工具]
    tags: [Openclaw, 折腾, 配置]
    excerpt: 记录一下使用Openclaw过程中的各种配置和问题解决，方便以后查阅~
---

最近在折腾Openclaw，把遇到的问题和解决方案都记录下来，免得以后忘了～

# 🚀 初识Openclaw

Openclaw是一个很棒的工具，刚开始使用时遇到了不少问题，不过慢慢都解决了。

# 📦 版本选择

## 国内版 vs 官方版

现在Openclaw有很多国内版，比如：
- openclaw-cn
- openclaw-zh
- 其他国内镜像版本

**国内版的优缺点：**

✅ **优点：**
- 部署更快更方便
- 访问速度更快
- 不需要特殊网络环境
- 对中文支持更好（早期版本）

❌ **缺点：**
- 版本更新滞后，没有官方版本新
- 存在很多bug
- 功能可能不完整

**官方版本最新动态（2026.2.26）：**
- 官方版本现在也一定程度支持中文了，可以很好地使用
- 功能更完整，bug更少
- 版本更新及时
- 提供更可靠的技术支持

**建议：**
如果追求稳定性和最新功能，建议使用官方版本。虽然部署可能麻烦一些，但能获得更好的使用体验。

# ⚙️ 安装方法

## 官方安装方式

官方提供了一句代码安装的方式，但可能会遇到一些问题。

## 推荐安装方式：npm安装

其实npm安装也是一句代码，但更可靠：

```bash
npm install openclaw@latest
```

**npm安装的优势：**
- 更稳定可靠
- 版本更新及时
- 依赖管理更完善

# 📁 配置文件位置

Openclaw的配置文件位置：

- **Linux/Mac**：`~/.openclaw/openclaw.json`
- **Windows**：`C:\Users\用户名\.openclaw\openclaw.json`

**重要配置更新说明：**
- 更新模型配置时，除了修改`openclaw.json`外，还需要检查一下`~/.openclaw/agents/你在用的agent（一般是main）/agent/models.json`，有时候会没有及时更新导致有问题。
- 修改完成后，建议执行以下命令重启服务，确保配置生效：
  ```bash
  openclaw gateway restart
  ```
- 重启后再测试配置是否正确应用

# 🌐 局域网lm-studio配置

如果要在局域网中使用lm-studio，需要进行以下配置。

## 配置示例

```json
{
  "models": {
    "providers": {
      "lm-studio": {
        "baseUrl": "http://your-lm-studio-server:port/v1", // 记得替换
        "apiKey": "your-api-key", // lm-studio这里随便输都行，但一定要有
        "api": "openai-completions",
        "models": [
          {
            "id": "your-model-id",
            "name": "your-model-name",
            // "reasoning": true // 这三行是可选配置项，根据实际需求添加
            // "contextWindow": 262144,
            // "maxTokens": 100000
          }
        ]
      }
    }
  }
}
```

## 配置说明

| 参数 | 说明 | 示例值 | 必填 |
|------|------|----------|------|
| baseUrl | 指定lm-studio服务器的地址 | `http://192.168.1.100:1234/v1` | 是 |
| apiKey | API密钥，用于身份验证 | `your-api-key` | 是 |
| api | 指定API类型 | `openai-completions` | 是 |
| id | 模型ID | `qwen/qwen3.5-35b-a3b` | 是 |
| name | 模型显示名称 | `Qwen 3.5 35B` | 是 |
| reasoning | 是否支持推理 | `true`/`false` | 否 |
| contextWindow | 上下文窗口大小 | `262144` | 否 |
| maxTokens | 最大token数 | `100000` | 否 |

**注意：** 某些lm-studio实例可以使用任意密钥，如"any-key-works"。生产环境中请使用安全的密钥。

# 🔑 DeepSeek配置注意事项

配置DeepSeek时需要特别注意以下几点，否则可能导致连接失败。

## 配置示例

```json
{
  "models": {
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com/v1", // ⚠️ 重要：baseUrl必须使用https协议，不能使用http协议
        "apiKey": "sk-your-actual-api-key-here", // ⚠️ 重要：apiKey必须保持完整的"sk-"前缀格式，不要添加"Bearer"
        "api": "openai-completions",
        "models": [
          {
            "id": "deepseek-reasoner",
            "name": "DeepSeek Reasoner",
            // "reasoning": true
          },
          {
            "id": "deepseek-chat",
            "name": "DeepSeek Chat",
            // "reasoning": false
          }
        ]
      }
    }
  }
}
```

## 关键注意事项

1. **baseUrl协议要求**：必须使用https协议，HTTP连接会被拒绝
2. **apiKey格式要求**：必须保持完整的"sk-"前缀格式
   - ❌ 不要添加"Bearer"前缀
   - ❌ 不要删除"sk-"前缀
   - ✅ 直接粘贴完整的API密钥即可

# 🎯 多模型优先级和备用配置

当配置了多个模型或API时，可以设置优先级和备用模型，提高系统的可靠性和可用性。

## 配置示例

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-reasoner",
        "fallbacks": [
          "deepseek/deepseek-chat",
          "lm-studio/qwen/qwen3.5-35b-a3b"
        ]
      }
    },
    "models": {
      "lm-studio/qwen/qwen3.5-35b-a3b": {},
      "deepseek/deepseek-reasoner": {},
      "deepseek/deepseek-chat": {}
    }
  }
}
```

## 配置说明

| 参数 | 说明 |
|------|------|
| primary | 指定主要使用的模型，系统优先使用这个模型处理请求 |
| fallbacks | 备用模型列表，当主模型不可用时自动切换，按顺序尝试 |
| models | 声明所有可用的模型，这里列出的模型才能被primary和fallbacks引用 |

## 使用场景

- **主模型故障**：当主模型出现故障或超时时，系统会自动切换到备用模型
- **负载均衡**：可以根据不同的使用场景设置不同的主模型和备用模型
- **成本优化**：将付费模型作为主模型，免费模型作为备用，在保证功能的同时降低成本

## 配置建议

1. 合理选择主模型：根据实际需求选择最适合的模型作为主模型
2. 备用模型多样化：备用模型应该来自不同的provider，避免单点故障
3. 测试备用模型：确保备用模型能够正常工作
4. 监控切换日志：关注模型切换日志，及时发现配置问题

# 🔍 向量化模型配置

如果在使用搜索功能时提示"没有向量化"，需要配置向量化模型以支持记忆搜索功能。

## 配置示例

```json
{
  "agents": {
    "memorySearch": {
      "provider": "openai",
      "remote": {
        "baseUrl": "http://your-embedding-server:port/v1", // 如果使用lm-studio服务器，可以直接在lm-studio服务器里面配置向量化模型
        "apiKey": "your-api-key" // lm-studio服务器的话这里apiKey随便填都行
      },
      "model": "text-embedding-nomic-embed-text-v1.5", // 推荐使用这个模型，很小一个不吃性能
      "cache": {
        "enabled": true,
        "maxEntries": 50000
      }
    }
  }
}
```

## 配置说明

| 参数 | 说明 |
|------|------|
| provider | 指定向量化模型的provider类型，常用值为`openai`（OpenAI兼容接口）|
| remote.baseUrl | 指定向量化服务的地址，格式为`http://服务器IP:端口/v1`|
| remote.apiKey | 向量化服务的API密钥，某些服务可以使用任意密钥 |
| model | 指定使用的向量化模型，如`text-embedding-nomic-embed-text-v1.5`|
| cache.enabled | 是否启用缓存，提高性能 |
| cache.maxEntries | 最大缓存条目数 |

## 常见向量化模型

- **Nomic系列**：`text-embedding-nomic-embed-text-v1.5`
  - **推荐理由**：模型体积小，资源消耗低，不吃性能；嵌入质量高，搜索效果好；支持多语言，包括中文；推理速度快
- **OpenAI系列**：`text-embedding-ada-002`
  - **特点**：嵌入质量高；支持多语言；但需要API密钥，可能产生费用
- **本地模型**：自定义本地模型名称
  - **优点**：完全离线，隐私性好；无使用费用；可根据需要定制

# 📋 完整配置示例

结合前面的所有配置，一个完整的配置文件示例：

```json
{
  "models": {
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com/v1", // ⚠️ baseUrl必须使用https协议
        "apiKey": "sk-your-actual-api-key-here", // ⚠️ apiKey必须保持"sk-"前缀格式
        "api": "openai-completions",
        "models": [
          {
            "id": "deepseek-reasoner",
            "name": "DeepSeek Reasoner",
            "reasoning": true
          },
          {
            "id": "deepseek-chat",
            "name": "DeepSeek Chat",
            "reasoning": false
          }
        ]
      },
      "lm-studio": {
        "baseUrl": "http://your-lm-studio-server:port/v1",
        "apiKey": "your-api-key",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen/qwen3.5-35b-a3b",
            "name": "Qwen 3.5 35B",
            "reasoning": true // contextWindow和maxTokens是可选配置项
            // "contextWindow": 262144,
            // "maxTokens": 100000
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-reasoner",
        "fallbacks": [
          "deepseek/deepseek-chat",
          "lm-studio/qwen/qwen3.5-35b-a3b"
        ]
      }
    },
    "models": {
      "lm-studio/qwen/qwen3.5-35b-a3b": {},
      "deepseek/deepseek-reasoner": {},
      "deepseek/deepseek-chat": {}
    },
    "memorySearch": {
      "provider": "openai",
      "remote": {
        "baseUrl": "http://your-embedding-server:port/v1", // 注意：向量化服务可能使用http协议
        "apiKey": "your-api-key" // 如果使用lm-studio服务器，这里apiKey随便填都行
      },
      "model": "text-embedding-nomic-embed-text-v1.5", // 推荐使用这个模型，很小一个不吃性能
      "cache": {
        "enabled": true,
        "maxEntries": 50000
      }
    }
  }
}
```

# 🔧 常见问题解决

## 问题1：SSH连接GitHub被拒绝

**症状：** npm安装过程中遇到SSH连接GitHub被拒绝（refuse）的问题

**解决方案：**

1. 生成SSH密钥：`ssh-keygen -t ed25519 -C "your_email@example.com"`
2. 添加密钥到GitHub：复制公钥内容，在GitHub Settings → SSH and GPG keys中添加
3. 配置代理：确保代理没有问题
4. 切换端口：把端口切换成433，或在`~/.ssh/config`中配置`Port 433`
5. 测试连接：`ssh -T git@github.com`

## 问题2：配置修改后不生效

**症状：** 修改了`openclaw.json`配置，但实际对话中没有生效

**原因：** 配置需要同时修改agent级别的配置文件，并且需要重启服务

**解决：**
1. 同时修改`~/.openclaw/agents/你在用的agent（一般是main）/agent/models.json`
2. 执行`openclaw gateway restart`重启服务
3. 重启后再测试配置是否正确应用

## 问题3：DeepSeek SSL/TLS连接错误

**症状：** 连接时出现SSL/TLS相关错误

**原因：** 使用了http协议而非https

**解决：** 将baseUrl改为https协议

## 问题4：DeepSeek认证失败

**症状：** 返回401 Unauthorized错误

**原因：** apiKey格式不正确

**解决：**
- 确认apiKey包含"sk-"前缀
- 确认没有添加"Bearer"前缀
- 检查apiKey是否完整复制

## 问题5：提示"没有向量化"

**症状：** 使用搜索功能时出现"没有向量化"错误

**原因：** 未配置memorySearch或配置不正确

**解决：**
1. 检查是否添加了memorySearch配置
2. 确认baseUrl和apiKey正确
3. 测试向量化服务是否可访问

## 问题6：搜索速度慢

**症状：** 搜索功能响应很慢

**原因：** 未启用缓存或缓存设置不合理

**解决：**
1. 确认cache.enabled设置为true
2. 适当增加maxEntries值
3. 检查网络连接速度

## 问题7：向量化连接失败

**症状：** 无法连接到向量化服务

**原因：** baseUrl配置错误或服务未启动

**解决：**
1. 确认向量化服务正在运行
2. 检查baseUrl格式是否正确
3. 测试网络连接

## 问题8：版本选择困惑

**症状：** 面对多个版本时，不知道该选择哪个

**解决建议：**
- 优先选择官方版本
- 关注GitHub上的release信息
- 查看issue了解已知问题
- 根据实际需求选择合适的版本

# 💡 心得体会

经过这段时间的折腾，对Openclaw有了更深入的了解：

1. **版本很重要**：尽量使用官方版本，避免使用过时的国内版
2. **安装方式选择**：npm安装比官方的一句代码安装更可靠
3. **网络配置是关键**：SSH连接GitHub时，代理和端口配置很重要
4. **局域网配置很实用**：通过lm-studio可以在局域网中使用大模型，提高效率
5. **DeepSeek配置细节**：baseUrl必须使用https协议，apiKey必须保持"sk-"前缀格式，不要添加"Bearer"
6. **多模型配置提升可靠性**：设置主模型和备用模型，实现自动故障转移和负载均衡
7. **向量化配置支持搜索**：配置memorySearch启用记忆搜索功能，注意向量化服务可能使用http协议
8. **耐心解决问题**：遇到问题不要急，一步步排查总能找到解决方案

# 🔄 持续更新

这篇博文会持续更新，记录更多使用Openclaw过程中的经验和技巧。

## 🚀 性能优化建议

1. **启用缓存**：在向量化配置中启用缓存，提高搜索速度
2. **合理配置模型**：根据硬件资源选择合适的模型，避免过度消耗资源
3. **网络优化**：确保网络连接稳定，特别是使用远程模型时
4. **定期清理缓存**：避免缓存过大影响性能
5. **使用本地模型**：对于频繁使用的功能，考虑使用本地模型减少网络延迟

## 🔒 安全建议

1. **API密钥管理**：不要在配置文件中硬编码API密钥，考虑使用环境变量
2. **网络安全**：使用HTTPS协议保护网络传输
3. **访问控制**：设置适当的访问权限，避免未授权访问
4. **定期更新**：及时更新Openclaw和相关依赖，修复安全漏洞
5. **日志管理**：定期清理日志，避免敏感信息泄露

---

折腾Openclaw的过程虽然有些曲折，但收获满满。希望这篇记录能帮助到其他使用者，也欢迎大家在评论区分享自己的经验和问题！
