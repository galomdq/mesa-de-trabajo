@echo off
chcp 65001 >nul
setlocal

:: ══════════════════════════════════════════════
::  CONFIGURACIÓN — editá estas 3 líneas
:: ══════════════════════════════════════════════
set PROYECTO=C:\ruta\a\tu\urban-gym-rutinas
set GITHUB_USUARIO=galomdq
set GITHUB_TOKEN=TU_TOKEN_AQUI
:: ══════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════╗
echo ║     Urban Gym — Subir cambios a GitHub   ║
echo ╚══════════════════════════════════════════╝
echo.

:: Verificar que la carpeta existe
if not exist "%PROYECTO%" (
    echo [ERROR] No se encontró la carpeta del proyecto:
    echo         %PROYECTO%
    echo.
    echo Editá la variable PROYECTO en este archivo .bat
    pause
    exit /b 1
)

:: Ir a la carpeta del proyecto
cd /d "%PROYECTO%"

:: Verificar que es un repositorio git
if not exist ".git" (
    echo [ERROR] La carpeta no es un repositorio Git.
    pause
    exit /b 1
)

:: Configurar credenciales
git config credential.helper store
echo https://%GITHUB_USUARIO%:%GITHUB_TOKEN%@github.com > "%USERPROFILE%\.git-credentials"

:: Ver qué archivos cambiaron
echo [INFO] Archivos modificados:
git status --short
echo.

:: Agregar todos los cambios
git add .

:: Pedir mensaje de commit
set /p MENSAJE="Escribí un mensaje para el commit (Enter para mensaje automático): "
if "%MENSAJE%"=="" set MENSAJE=feat: actualizaciones Urban Gym

:: Hacer commit
git commit -m "%MENSAJE%"

if %errorlevel% neq 0 (
    echo.
    echo [INFO] No hay cambios nuevos para subir.
    pause
    exit /b 0
)

:: Subir a GitHub
echo.
echo [INFO] Subiendo a GitHub...
git push origin main 2>nul || git push origin master

if %errorlevel% equ 0 (
    echo.
    echo ╔══════════════════════════════════════════╗
    echo ║   ✓  Cambios subidos exitosamente!       ║
    echo ╚══════════════════════════════════════════╝
) else (
    echo.
    echo [ERROR] No se pudo subir. Verificá tu token o conexión.
)

echo.
pause
