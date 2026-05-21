#!/usr/bin/env bash
# CV 简历网页一键启动脚本
# 自动检测 Python / Node.js，启动本地静态服务器

set -e

PORT="${PORT:-8000}"
SITE_DIR="$(cd "$(dirname "$0")/site" && pwd)"

echo "============================================"
echo "  CV 简历网页"
echo "  目录: $SITE_DIR"
echo "============================================"

# 优先使用 Python 3
if command -v python3 &>/dev/null; then
  echo ""
  echo "→ 使用 Python 3 启动 HTTP 服务器"
  echo "  打开浏览器访问: http://localhost:$PORT"
  echo "  按 Ctrl+C 停止"
  echo ""
  cd "$SITE_DIR"
  exec python3 -m http.server "$PORT"
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
