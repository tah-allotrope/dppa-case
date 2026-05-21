$ppt = New-Object -ComObject PowerPoint.Application
$prs = $ppt.Presentations.Open("C:\Users\tukum\Downloads\dppa-case\dppa-web-app-case-study.pptx")

$outDir = "C:\Users\tukum\Downloads\dppa-case\deck-qa"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

for ($i = 1; $i -le $prs.Slides.Count; $i++) {
    $slide = $prs.Slides.Item($i)
    $slide.Export("$outDir\slide-$($i.ToString('00')).png", "PNG", 1600, 900)
}

$prs.Close()
$ppt.Quit()
Write-Host "Exported slides to $outDir"
