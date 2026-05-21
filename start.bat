@echo off
:: CV 简历网页一键启动脚本 (Windows)
:: 自动检测 Python / Node.js，启动本地静态服务器

set PORT=8000
set SITE_DIR=%~dp0site

echo ============================================
echo   CV 简历网页
echo   目录: %SITE_DIR%
echo ============================================

:: 优先使用 Python 3
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo.
  echo - 使用 Python 3 启动 HTTP 服务器
  echo   打开浏览器访问: http://localhost:%PORT%
  echo   按 Ctrl+C 停止
  echo.
  cd /d "%SITE_DIR%"
  python3 -m http.server %PORT%
  goto :end
)

:: 降级到 Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo.
  echo - 使用 Python 启动 HTTP 服务器
  echo   打开浏览器访问: http://localhost:%PORT%
  echo   按 Ctrl+C 停止
  echo.
  cd /d "%SITE_DIR%"
  python -m http.server %PORT%
  goto :end
)

:: Node.js + npx serve
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo.
  echo - 使用 Node.js (serve) 启动 HTTP 服务器
  echo   打开浏览器访问: http://localhost:%PORT%
  echo   按 Ctrl+C 停止
  echo.
  cd /d "%SITE_DIR%"
  npx serve . -l %PORT% --no-clipboard
  goto :end
)

echo 错误: 未找到 Python 或 Node.js，请安装其一后重试。
pause

:end
