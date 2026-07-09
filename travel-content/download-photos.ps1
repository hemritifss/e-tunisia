# Downloads the REAL photo for each gem to travel-content/photos/ (so the app/gallery
# serves local files instead of hotlinking Wikimedia, which rate-limits at scale).
# Polite: spaced requests + exponential backoff on HTTP 429. Adds image.localPath to JSON.
$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$inFile = Join-Path $root 'tunisia-travel-data.json'
$dir    = Join-Path $root 'photos'
if(-not (Test-Path $dir)){ New-Item -ItemType Directory -Path $dir | Out-Null }
$h = @{ 'User-Agent' = 'e-tunisia-travel/1.0 (contact: craftlord34@gmail.com)' }

function Slug([string]$s){
  $s = $s.ToLower() -replace "[àâ]","a" -replace "[éèê]","e" -replace "[îï]","i" -replace "[ôö]","o" -replace "[ûü]","u" -replace "ç","c"
  $s = $s -replace "[^a-z0-9]+","-" -replace "^-+|-+$",""
  if($s.Length -gt 40){ $s = $s.Substring(0,40).TrimEnd('-') }
  $s
}

$data = Get-Content $inFile -Raw | ConvertFrom-Json
$done=0; $fail=@()
foreach($g in $data.gems){
  if(-not $g.image -or -not $g.image.thumb){ $fail += "$($g.id) no-url"; continue }
  $url = $g.image.thumb
  $ext = if($url -match '\.(jpg|jpeg|png|webp)(\?|$)'){ $Matches[1] } else { 'jpg' }
  $name = ("{0:000}-{1}.{2}" -f [int]$g.id, (Slug $g.name), $ext)
  $path = Join-Path $dir $name
  $rel  = "photos/$name"
  if(Test-Path $path){ $g.image | Add-Member localPath $rel -Force; $done++; continue }

  $ok=$false; $delay=600
  for($try=1; $try -le 4 -and -not $ok; $try++){
    try{
      Invoke-WebRequest -Uri $url -OutFile $path -Headers $h -TimeoutSec 40 -ErrorAction Stop
      if((Get-Item $path).Length -gt 1000){ $ok=$true } else { Remove-Item $path -Force -ErrorAction SilentlyContinue }
    } catch {
      if($_.Exception.Message -match '429'){ Start-Sleep -Milliseconds ($delay*$try*2) } else { Start-Sleep -Milliseconds 800 }
    }
  }
  if($ok){ $g.image | Add-Member localPath $rel -Force; $done++ } else { $fail += "$($g.id) $($g.name)" }
  Start-Sleep -Milliseconds 450   # be polite between files
}
$data | ConvertTo-Json -Depth 12 | Set-Content -Path $inFile -Encoding UTF8
"downloaded/ok: $done / $($data.gems.Count)"
"failed: $($fail.Count)"
$fail | ForEach-Object { $_ }
