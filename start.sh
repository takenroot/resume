#!/usr/bin/env bash
# CV 简历网页一键启动脚本
# 自动检测 Python / Node.js，启动本地静态服务器
# PORT 环境变量可显式指定；不指定则从 8765 起探测一个可用端口（避开主流软件常用端口）

set -e

# ponytail: 主流软件常用端口黑名单 (用 bind 探测替代 service 列表, 更可靠)
# 避开的: web 开发常用 (3000/5000/5173/8080/8000/8443)、数据库 (3306/5432/6379/27017/27018/11211/9200/9300)、
# 消息队列 (5672/15672/9092/2181/4222)、监控 (9090/9100/9093/3000/grafana 3001)、开发辅助 (4040/9229/4000/6006/8321/8601)、
# 容器/k8s (2375/2376/6443/10250/10255/10256/8001)、Windows/Hyper-V 保留区间 (8000-8099 常见被 Hyper-V 占)、
# VSCode (9988/9989)、jupyter (8888)
BLACKLIST='3000 3001 3306 4000 4040 4222 5000 5173 5432 5672 6006 6379 6443 8000 8001 8080 8081 8086 8088 8181 8321 8443 8601 8888 9090 9092 9100 9200 9229 9300 9988 9989 10250 10255 10256 11211 15672 2181 2375 2376 27017 27018 9093'

pick_port() {
  python3 - <<PY
import socket, sys
blacklist = set("$BLACKLIST".split())
start = int("${PORT:-8765}")
for p in range(start, start + 200):
    if p in blacklist:
        continue
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        s.bind(('', p))
        print(p)
        sys.exit(0)
    except OSError:
        continue
    finally:
        s.close()
sys.exit(1)
PY
}

PORT="${PORT:-8765}"
if ! PORT="$(pick_port)"; then
  echo "错误: 在 8765-8964 范围内找不到可用端口" >&2
  exit 1
fi

SITE_DIR="$(cd "$(dirname "$0")/site" && pwd)"

echo "============================================"
echo "  CV 简历网页"
echo "  目录: $SITE_DIR"
echo "  端口: $PORT (默认 8765, 已被占用则顺延)"
echo "============================================"

# 优先使用 Python 3
if command -v python3 &>/dev/null; then
  echo ""
  echo "→ 使用 Python 3 启动 HTTP 服务器"
  echo "  打开浏览器访问: http://localhost:$PORT"
  echo "  按 Ctrl+C 停止"
  echo ""
  cd "$SITE_DIR"
  # ponytail: UI 迭代禁缓存 (全局规则 5) — http.server 默认不发 Cache-Control, 旧 JS/CSS 会被浏览器复读
  exec python3 - "$PORT" <<'PY'
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
try:
    HTTPServer(('', int(sys.argv[1])), H).serve_forever()
except KeyboardInterrupt:
    print("\nHTTP 服务器已停止")
PY
fi

# 降级到 Python
if command -v python &>/dev/null; then
  echo ""
  echo "→ 使用 Python 启动 HTTP 服务器"
  echo "  打开浏览器访问: http://localhost:$PORT"
  echo "  按 Ctrl+C 停止"
  echo ""
  cd "$SITE_DIR"
  exec python -m http.server "$PORT"
fi

# Node.js + npx serve
if command -v npx &>/dev/null; then
  echo ""
  echo "→ 使用 Node.js (serve) 启动 HTTP 服务器"
  echo "  打开浏览器访问: http://localhost:$PORT"
  echo "  按 Ctrl+C 停止"
  echo ""
  cd "$SITE_DIR"
  exec npx serve . -l "$PORT" --no-clipboard
fi

echo "错误: 未找到 Python 或 Node.js，请安装其一后重试。"
exit 1
