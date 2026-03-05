
Add-Type -AssemblyName System.Drawing

$inputPath = "c:\xampp\htdocs\FloodGuard\FloodGuard\frontend\admin\web-admin\assets\logo.png"
$outputPath = "c:\xampp\htdocs\FloodGuard\FloodGuard\frontend\admin\web-admin\assets\favicon.png"

try {
    $srcImage = [System.Drawing.Bitmap]::FromFile($inputPath)
    $width = $srcImage.Width
    $height = $srcImage.Height

    $minX = $width
    $minY = $height
    $maxX = 0
    $maxY = 0

    # Simple bounding box scan (can be slow for large images, but logo is 118KB so implies ~500-1000px, acceptable)
    # Optimization: Scan lines with stride
    
    for ($y = 0; $y -lt $height; $y++) {
        for ($x = 0; $x -lt $width; $x++) {
            $pixel = $srcImage.GetPixel($x, $y)
            if ($pixel.A -gt 10) { # Threshold for transparency
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -lt $minX -or $maxY -lt $minY) {
        Write-Host "Image appears empty or fully transparent."
        exit
    }
    
    # Add a small padding (e.g., 2px)
    $padding = 2
    $minX = [Math]::Max(0, $minX - $padding)
    $minY = [Math]::Max(0, $minY - $padding)
    $maxX = [Math]::Min($width - 1, $maxX + $padding)
    $maxY = [Math]::Min($height - 1, $maxY + $padding)

    $cropWidth = $maxX - $minX + 1
    $cropHeight = $maxY - $minY + 1
    
    $rect = New-Object System.Drawing.Rectangle($minX, $minY, $cropWidth, $cropHeight)
    $croppedImage = $srcImage.Clone($rect, $srcImage.PixelFormat)
    
    # Resize to square (centered)
    $maxDim = [Math]::Max($cropWidth, $cropHeight)
    $squareImage = New-Object System.Drawing.Bitmap($maxDim, $maxDim)
    $graphics = [System.Drawing.Graphics]::FromImage($squareImage)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    $offsetX = [Math]::Floor(($maxDim - $cropWidth) / 2)
    $offsetY = [Math]::Floor(($maxDim - $cropHeight) / 2)
    
    $graphics.DrawImage($croppedImage, $offsetX, $offsetY, $cropWidth, $cropHeight)
    
    $squareImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Favicon cropped and saved to $outputPath"
    
} catch {
    Write-Host "Error: $_"
} finally {
    if ($graphics) { $graphics.Dispose() }
    if ($squareImage) { $squareImage.Dispose() }
    if ($croppedImage) { $croppedImage.Dispose() }
    if ($srcImage) { $srcImage.Dispose() }
}
