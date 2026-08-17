# audios 音频目录

网站音频资源,目前主要用于灵感碎片(moments)。

## 子目录约定

- `moments/`:灵感碎片音频,命名 `YYYYMMDD_HHMMSS.mp3`(时间戳),与 moments.json 的 created_at 对应
- 根目录:其他音频资源(如测试文件,尽量清理)

## 引用

灵感碎片中通过 HTML 标签引用:

```html
<audio controls src="./audios/moments/20260329_120000.mp3"></audio>
```

## 注意

- 控制体积(超 100MB 无法推 GitHub)
- 根目录残留的测试音频(test_audio.mp3 等)应清理或移入 moments/
