@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "TARGET_BRANCH=%~1"
if "%TARGET_BRANCH%"=="" set "TARGET_BRANCH=fix/live-preview-hanging-indent-v7"

set "REPO_DIR=%~dp0"
set "PLUGIN_DIR=E:\SRC\.obsidian\plugins\nested-ordered-numbering"
set "BACKUP_ROOT=E:\SRC\.obsidian\plugins\_backup\nested-ordered-numbering"

echo [1/8] Repository: %REPO_DIR%
echo       Branch:     %TARGET_BRANCH%
echo       Plugin:     %PLUGIN_DIR%

pushd "%REPO_DIR%" || goto :fail

set "DIRTY="
for /f "delims=" %%A in ('git status --porcelain') do set "DIRTY=1"
if defined DIRTY (
  echo.
  echo ERROR: Local repository has uncommitted or untracked changes.
  echo Nothing was modified. Commit/stash/remove them first.
  git status --short
  goto :fail_popd
)

echo [2/8] Updating Git branch...
git fetch origin || goto :fail_popd
git switch "%TARGET_BRANCH%" || goto :fail_popd
git pull --ff-only origin "%TARGET_BRANCH%" || goto :fail_popd

echo [3/8] Running tests...
call pnpm test || goto :fail_popd

echo [4/8] Running lint...
call pnpm lint || goto :fail_popd

echo [5/8] Building production main.js...
call pnpm build || goto :fail_popd

echo [6/8] Running release check...
call pnpm release:check || goto :fail_popd

if not exist "main.js" (
  echo ERROR: main.js was not generated.
  goto :fail_popd
)
if not exist "manifest.json" (
  echo ERROR: manifest.json is missing.
  goto :fail_popd
)
if not exist "styles.css" (
  echo ERROR: styles.css is missing.
  goto :fail_popd
)

echo [7/8] Backing up installed plugin...
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%I"
set "BACKUP_DIR=%BACKUP_ROOT%\!STAMP!"
mkdir "!BACKUP_DIR!" >nul 2>&1 || goto :fail_popd

set "BACKED_UP=0"
for %%F in (main.js manifest.json styles.css) do (
  if exist "%PLUGIN_DIR%\%%F" (
    copy /Y "%PLUGIN_DIR%\%%F" "!BACKUP_DIR!\%%F" >nul || goto :fail_popd
    set "BACKED_UP=1"
  )
)

if "!BACKED_UP!"=="0" (
  echo No existing plugin artifacts were present; backup directory is empty.
) else (
  echo Backup verified at: !BACKUP_DIR!
  for %%F in (main.js manifest.json styles.css) do (
    if exist "%PLUGIN_DIR%\%%F" if not exist "!BACKUP_DIR!\%%F" (
      echo ERROR: Backup verification failed for %%F.
      goto :fail_popd
    )
  )
)

echo [8/8] Installing plugin artifacts...
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%" || goto :fail_popd
copy /Y "main.js" "%PLUGIN_DIR%\main.js" >nul || goto :restore
copy /Y "manifest.json" "%PLUGIN_DIR%\manifest.json" >nul || goto :restore
copy /Y "styles.css" "%PLUGIN_DIR%\styles.css" >nul || goto :restore

for %%F in (main.js manifest.json styles.css) do (
  if not exist "%PLUGIN_DIR%\%%F" (
    echo ERROR: Installed artifact missing: %%F
    goto :restore
  )
)

echo.
echo SUCCESS
echo Branch: %TARGET_BRANCH%
git rev-parse HEAD
echo Installed to: %PLUGIN_DIR%
echo Backup:       !BACKUP_DIR!
echo.
echo Reload Obsidian, then reproduce the hierarchy/wrap test.
echo To restore manually, copy main.js, manifest.json and styles.css from:
echo   !BACKUP_DIR!
echo back to:
echo   %PLUGIN_DIR%
popd
exit /b 0

:restore
echo.
echo ERROR: Deployment failed. Restoring previous plugin artifacts...
if "!BACKED_UP!"=="1" (
  for %%F in (main.js manifest.json styles.css) do (
    if exist "!BACKUP_DIR!\%%F" copy /Y "!BACKUP_DIR!\%%F" "%PLUGIN_DIR%\%%F" >nul
  )
  echo Previous artifacts restored from !BACKUP_DIR!.
) else (
  echo No previous artifacts existed, so there is nothing to restore.
)
goto :fail_popd

:fail_popd
popd
:fail
echo.
echo FAILED. No successful deployment was completed.
exit /b 1
