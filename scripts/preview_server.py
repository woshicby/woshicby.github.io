#!/usr/bin/env python3
"""本地预览服务器(no-cache 版)——避免浏览器缓存导致刷新看不到新内容"""
import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8642

# 自动定位仓库根(本文件在 scripts/ 下,上级即仓库根)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # 禁用缓存: 每次刷新都拿最新文件
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # 告诉浏览器清除本站点已有缓存(解决 Safari 对 localhost 的顽固缓存)
        self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


with Server(('', PORT), NoCacheHandler) as httpd:
    print(f'Serving {ROOT} on http://localhost:{PORT} (no-cache)')
    httpd.serve_forever()
