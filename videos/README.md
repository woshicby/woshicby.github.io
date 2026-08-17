# videos 视频目录

网站视频资源,主要用于灵感碎片(moments)。

## 子目录约定

- `moments/`:灵感碎片视频,命名 `YYYYMMDD_HHMMSS.mp4`(时间戳),与 moments.json 的 created_at 对应

## 引用

灵感碎片中通过 HTML 标签引用:

```html
<video controls src="./videos/moments/20260331_090016.mp4"></video>
```

## 注意

- **体积控制**:GitHub 单文件限 100MB,超限视频需压缩(1080p / crf 28,参考脚本 ffmpeg 压缩)
- 压缩后替换时注意 git 历史(大文件一旦提交,需 filter-repo 清理才能 push)
- 手机 4K 原片建议先压再入库(580MB→52MB 实例)
