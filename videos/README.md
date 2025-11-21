# videos 目录说明文档

本目录用于存放网站所需的视频资源文件，包括演示视频、背景视频和其他视频内容。

## 目录说明

videos目录是网站的视频资源库，主要用于：
- 为网站提供演示视频内容
- 存储页面背景视频
- 提供用户可播放的媒体内容
- 其他功能性视频资源（如工具演示视频）

## 推荐文件格式

为了确保兼容性和良好的播放体验，建议使用以下视频格式：

- **MP4 (.mp4)**：最通用的视频格式，支持H.264编码
  - 兼容性最好，支持所有现代浏览器
  - 推荐分辨率：720p (1280x720) 或 1080p (1920x1080)
  - 推荐比特率：
    - 720p：2-5 Mbps
    - 1080p：5-10 Mbps

- **WebM (.webm)**：开源视频格式，支持VP8/VP9编码
  - 比MP4提供更好的压缩率，文件更小
  - 推荐作为MP4的备选，提高兼容性

- **HLS (.m3u8)**：HTTP直播流格式，适合流媒体播放
  - 支持自适应比特率流
  - 适用于长视频和流媒体场景

## 命名规范

为了便于管理和使用，建议遵循以下命名规范：

- **小写字母**：文件名全部使用小写字母
- **连字符分隔**：单词之间使用连字符（-）分隔，例如：`demo-video.mp4`
- **描述性命名**：文件名应清晰描述视频内容，例如：`product-showcase.mp4`
- **前缀标识**：可以使用前缀标识视频类型，例如：
  - `demo-`：演示视频
  - `bg-`：背景视频
  - `tutorial-`：教程视频
  - `preview-`：预览视频
  - `tool-`：工具演示视频（如`tool-pace-calculator.mp4`）

## 视频优化指南

### 分辨率和比特率

- **桌面网站**：主要内容视频建议为720p或1080p
- **移动设备**：考虑提供480p或更低分辨率版本
- **背景视频**：建议使用720p或更低分辨率，以确保页面加载速度
- **短视频**：可适当提高比特率保证质量

### 性能优化

- **压缩视频**：使用专业工具优化视频文件大小
- **延迟加载**：实现视频的按需加载，减少初始页面加载时间
- **响应式视频**：为不同设备提供不同分辨率的视频
- **考虑使用CDN**：对于大型视频文件，建议使用CDN服务加速
- **分段加载**：对于长视频，考虑使用分段加载技术

### 响应式视频策略

- 为同一视频提供多个分辨率版本
- 使用HTML5 `video` 标签的多种来源属性
- 考虑在移动网络环境下自动选择低质量版本
- 使用媒体查询调整视频显示和播放行为

## 使用方法

### HTML视频标签使用

在HTML中嵌入视频时，可以使用以下方式：

```html
<video controls width="100%" height="auto">
  <source src="../videos/your-video.mp4" type="video/mp4">
  <source src="../videos/your-video.webm" type="video/webm">
  您的浏览器不支持HTML5视频播放。
</video>
```

### 背景视频实现

实现全宽背景视频：

```html
<div class="video-background">
  <video autoplay muted loop playsinline>
    <source src="../videos/bg-video.mp4" type="video/mp4">
  </video>
</div>
```

```css
.video-background {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.video-background video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
}
```

### 主题适配

视频播放器控件样式应适配网站的主题系统：

```css
/* 使用CSS变量定义播放器控件样式 */
video::-webkit-media-controls {
  background-color: var(--video-control-bg);
  color: var(--video-control-color);
}

video::-webkit-media-controls-play-button {
  background-color: var(--primary-color);
  color: white;
}
```

## 模块集成

### 配速计算器视频集成

- 为配速计算器工具添加演示视频
- 视频格式建议：720p MP4，控制在10MB以内
- 视频内容：展示工具的主要功能和使用方法

### B站API集成

与B站API集成，实现外部视频播放：

```html
<div id="bilibili-player"></div>
<script src="../js/bilibili-api.js"></script>
<script>
  // 初始化B站播放器
  const bilibiliPlayer = new BilibiliPlayer('bilibili-player');
  // 加载视频
  bilibiliPlayer.loadVideo('BV1xx411c7mK');
</script>
```

## 注意事项

- **自动播放限制**：大多数浏览器要求自动播放视频必须是静音的
- **移动设备考虑**：
  - 在移动设备上自动播放视频可能会被浏览器阻止
  - 考虑提供视频封面图片，由用户点击后再播放
- **文件大小**：
  - 单个视频文件建议不超过20MB
  - 超过10MB的视频应考虑使用外部视频托管服务（如YouTube、Vimeo）
- **版权声明**：确保所有视频内容的版权合法性
- **预加载策略**：
  - 重要视频：设置`preload="metadata"`预加载元数据
  - 非关键视频：设置`preload="none"`避免不必要的带宽消耗
- **主题切换考虑**：
  - 视频播放器控件应适配深色/浅色主题
  - 视频封面图片应考虑在不同主题下的显示效果

## 视频格式转换和压缩工具推荐

- **HandBrake**：免费开源的视频转码工具
- **FFmpeg**：强大的命令行视频处理工具
- **Adobe Media Encoder**：专业视频编码工具
- **Online-convert**：网页版视频转换工具
- **Cloudinary**：提供视频转换和优化的云服务

## 移动设备兼容性

- 确保视频可以在iOS和Android设备上正常播放
- 使用`playsinline`属性在iOS Safari中内联播放视频
- 考虑在小屏幕设备上禁用自动播放，改为用户点击播放
- 测试视频在不同移动浏览器中的表现
- 适配不同屏幕尺寸的视频播放体验

## 视频质量和性能平衡

选择视频质量时，应平衡以下因素：

1. **内容重要性**：核心内容可以使用更高质量
2. **观看环境**：预计用户在什么网络环境下观看
3. **页面用途**：营销页面可能需要更高质量，功能页面可适当降低
4. **加载速度**：确保视频不会明显延迟页面加载时间
5. **设备性能**：考虑低性能设备的播放能力

## 视频封面

为每个视频设置合适的封面图片，支持主题切换：

```html
<video controls poster="../images/video-thumbnail-light.png" data-dark-poster="../images/video-thumbnail-dark.png">
  <source src="../videos/your-video.mp4" type="video/mp4">
</video>
```

```javascript
// 使用theme-toggle.js中定义的主题切换逻辑
function updateVideoPosters() {
  const isDarkMode = document.documentElement.classList.contains('dark-theme');
  document.querySelectorAll('video[data-dark-poster]').forEach(video => {
    if (isDarkMode) {
      video.poster = video.dataset.darkPoster;
    } else {
      // 恢复默认海报
      video.poster = video.dataset.defaultPoster || video.poster;
    }
  });
}

// 监听主题切换事件
document.addEventListener('themeChanged', updateVideoPosters);
```

封面图片要求：
- 与视频内容相关
- 保持良好的视觉质量
- 尺寸与视频分辨率相匹配
- 提供浅色和深色两个版本以适配主题系统