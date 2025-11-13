@echo off
echo ========================================
echo   Village Building Asset Setup
echo ========================================
echo.
echo Instruksi:
echo 1. Simpan 3 PNG images Anda di folder ini
echo 2. Rename files menjadi: image1.png, image2.png, image3.png
echo 3. Jalankan script ini untuk auto-copy ke 5 building types
echo.
echo Mapping:
echo   image1.png (Farm House)  -^> castle.png, farm.png
echo   image2.png (Grand Castle) -^> fortress.png, tower.png
echo   image3.png (Market Shop)  -^> temple.png
echo.
pause

if not exist "image1.png" (
    echo ERROR: image1.png not found!
    echo Silakan rename gambar rumah kayu menjadi 'image1.png'
    pause
    exit /b
)

if not exist "image2.png" (
    echo ERROR: image2.png not found!
    echo Silakan rename gambar kastil megah menjadi 'image2.png'
    pause
    exit /b
)

if not exist "image3.png" (
    echo ERROR: image3.png not found!
    echo Silakan rename gambar kedai menjadi 'image3.png'
    pause
    exit /b
)

echo Copying files...

copy image1.png castle.png
echo ✓ Created castle.png from image1.png

copy image1.png farm.png
echo ✓ Created farm.png from image1.png

copy image2.png fortress.png
echo ✓ Created fortress.png from image2.png

copy image2.png tower.png
echo ✓ Created tower.png from image2.png

copy image3.png temple.png
echo ✓ Created temple.png from image3.png

echo.
echo ========================================
echo   Setup Complete! ✅
echo ========================================
echo.
echo Files created:
dir /B *.png | findstr /V "image"
echo.
echo Next steps:
echo 1. Buka browser game
echo 2. Tekan Ctrl+Shift+R (hard refresh)
echo 3. Cek console (F12) untuk texture loading
echo 4. Jalan ke village area (x=50-80)
echo.
pause
