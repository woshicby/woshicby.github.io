# 通过 JSON 文件接收输入输出路径，避免命令行编码问题
param([string]$JobFile)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName 'PresentationCore'

$job = Get-Content -Path $JobFile -Encoding UTF8 -Raw | ConvertFrom-Json
$heicPath = $job.input
$jpgPath = $job.output

try {
    $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create([Uri]$heicPath, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::Default)
    $frame = $decoder.Frames[0]

    # 尝试获取元数据
    $metadata = $null
    try {
        $metadata = $frame.Metadata
    } catch {}

    $encoder = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
    $encoder.QualityLevel = 95

    # 尝试带元数据创建新帧
    $newFrame = $null
    if ($metadata -ne $null) {
        try {
            $newFrame = [System.Windows.Media.Imaging.BitmapFrame]::Create($frame, $null, $metadata, $null)
        } catch {
            $newFrame = $null
        }
    }
    if ($newFrame -ne $null) {
        $encoder.Frames.Add($newFrame)
    } else {
        $encoder.Frames.Add($frame)
    }

    $fs = [System.IO.File]::OpenWrite($jpgPath)
    $encoder.Save($fs)
    $fs.Close()

    $result = @{
        success = $true
        width = $frame.PixelWidth
        height = $frame.PixelHeight
        hasMetadata = ($metadata -ne $null)
    }
    $result | ConvertTo-Json -Compress | Write-Output
} catch {
    $result = @{
        success = $false
        error = $_.Exception.Message
    }
    $result | ConvertTo-Json -Compress | Write-Output
}
