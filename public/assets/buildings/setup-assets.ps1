# Village Building Asset Setup Script
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Village Building Asset Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mapping 3 images ke 5 building types:" -ForegroundColor Yellow
Write-Host "  image1.png (Farm House)   -> castle.png, farm.png"
Write-Host "  image2.png (Grand Castle) -> fortress.png, tower.png"
Write-Host "  image3.png (Market Shop)  -> temple.png"
Write-Host ""

# Check if images exist
$missing = @()
if (!(Test-Path "image1.png")) { $missing += "image1.png (Farm House)" }
if (!(Test-Path "image2.png")) { $missing += "image2.png (Grand Castle)" }
if (!(Test-Path "image3.png")) { $missing += "image3.png (Market Shop)" }

if ($missing.Count -gt 0) {
    Write-Host "❌ Missing files:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Instruksi:" -ForegroundColor Yellow
    Write-Host "1. Simpan 3 PNG dari attachments"
    Write-Host "2. Rename menjadi: image1.png, image2.png, image3.png"
    Write-Host "3. Run script ini lagi"
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "✓ All source images found!" -ForegroundColor Green
Write-Host ""
Write-Host "Copying files..." -ForegroundColor Yellow

# Copy image1 -> castle.png, farm.png
Copy-Item "image1.png" "castle.png" -Force
Write-Host "  ✓ castle.png" -ForegroundColor Green

Copy-Item "image1.png" "farm.png" -Force
Write-Host "  ✓ farm.png" -ForegroundColor Green

# Copy image2 -> fortress.png, tower.png
Copy-Item "image2.png" "fortress.png" -Force
Write-Host "  ✓ fortress.png" -ForegroundColor Green

Copy-Item "image2.png" "tower.png" -Force
Write-Host "  ✓ tower.png" -ForegroundColor Green

# Copy image3 -> temple.png
Copy-Item "image3.png" "temple.png" -Force
Write-Host "  ✓ temple.png" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! ✅" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Created files:" -ForegroundColor Yellow
Get-ChildItem -Filter "*.png" | Where-Object { $_.Name -notlike "image*.png" } | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host ("  {0,-20} {1,8} KB" -f $_.Name, $size) -ForegroundColor White
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Buka browser game"
Write-Host "2. Tekan Ctrl+Shift+R (hard refresh)"
Write-Host "3. Buka DevTools (F12) -> Console tab"
Write-Host "4. Cari log: '[Texture] ✅ Loaded castle.png...'"
Write-Host "5. Jalan ke kanan (D key) sampai x=50-80 untuk lihat village!"
Write-Host ""

Read-Host "Press Enter to exit"
