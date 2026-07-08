Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param (
        [string]$SourceFile,
        [string]$DestFile,
        [int]$Width,
        [int]$Height
    )
    $srcImg = [System.Drawing.Image]::FromFile($SourceFile)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Set high quality settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($srcImg, 0, 0, $Width, $Height)
    
    $bmp.Save($DestFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $srcImg.Dispose()
    Write-Host "Resized and saved: $DestFile"
}

$sourcePath = "C:\Users\RAVI\.gemini\antigravity-ide\brain\75b67ef6-21b4-4b46-bab3-5c95c6183dca\media__1783533134630.jpg"
$destDir = "d:\version 2\src\public\icons"

Resize-Image -SourceFile $sourcePath -DestFile "$destDir\icon16.png" -Width 16 -Height 16
Resize-Image -SourceFile $sourcePath -DestFile "$destDir\icon48.png" -Width 48 -Height 48
Resize-Image -SourceFile $sourcePath -DestFile "$destDir\icon128.png" -Width 128 -Height 128
