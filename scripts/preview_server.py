#!/usr/bin/env python3
"""本地预览服务器(no-cache 版)——避免浏览器缓存导致刷新看不到新内容"""
import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8643

# 自动定位仓库根(本文件在 scripts/ 下,上级即仓库根)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """本地预览服务器 = 线上行为的近似。支持 HTTP Range:
    边界数据已改为 PMTiles(单文件 + HTTP Range 按需取瓦片), 线上由 Fastly/CDN 提供 Range,
    本地若不支持就完全没法验证地图填色, 所以这里补齐单段 Range(206)。"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)
        self._range_remaining = None

    def end_headers(self):
        # 声明支持 Range(PMTiles 依赖它; 线上 GitHub Pages 也回这个头)
        self.send_header('Accept-Ranges', 'bytes')
        # 禁用缓存: 每次刷新都拿最新文件
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # 告诉浏览器清除本站点已有缓存(解决 Safari 对 localhost 的顽固缓存)
        self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()

    def send_head(self):
        """单段 Range → 206; 其它情况走父类。多段 Range 不处理(Pages 也一样返回整文件)。"""
        self._range_remaining = None
        rng = self.headers.get('Range')
        if not rng or not rng.startswith('bytes='):
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, 'rb')
        except OSError:
            return super().send_head()

        try:
            fs = os.fstat(f.fileno())
            size = fs.st_size
            spec = rng.split('=', 1)[1].split(',', 1)[0].strip()   # 只取第一段
            s, _, e = spec.partition('-')
            if not s:                                              # bytes=-N: 末尾 N 字节
                start = max(0, size - int(e or 0))
                end = size - 1
            else:
                start = int(s)
                end = int(e) if e else size - 1
            if start >= size or start > end:
                self.send_response(416)
                self.send_header('Content-Range', 'bytes */%d' % size)
                self.send_header('Content-Length', '0')
                self.end_headers()
                f.close()
                return None
            end = min(end, size - 1)
            self.send_response(206)
            self.send_header('Content-Type', self.guess_type(path))
            self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
            self.send_header('Content-Length', str(end - start + 1))
            self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
            self.end_headers()
            self._range_remaining = end - start + 1
            f.seek(start)
            return f
        except (ValueError, OSError):
            f.close()
            self._range_remaining = None
            return super().send_head()

    def copyfile(self, source, outputfile):
        """Range 响应只回请求的那一段(父类会一直拷到 EOF)"""
        if self._range_remaining is None:
            return super().copyfile(source, outputfile)
        remaining = self._range_remaining
        while remaining > 0:
            chunk = source.read(min(65536, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


with Server(('', PORT), NoCacheHandler) as httpd:
    print(f'Serving {ROOT} on http://localhost:{PORT} (no-cache)')
    httpd.serve_forever()
