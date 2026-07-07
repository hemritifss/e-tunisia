# Enriches tunisia-travel-data.json with REAL photos from Wikipedia / Wikimedia Commons.
# Strategy per gem:
#   Tier 1: Wikipedia search -> top article's lead image (representative, high quality) + license from Commons.
#   Tier 2: fallback to Commons file search if no article image.
# Adds an `image` object (full, thumb, source page, license, author, licenseUrl, method) to each gem.

$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$inFile = Join-Path $root 'tunisia-travel-data.json'
$h = @{ 'User-Agent' = 'e-tunisia-travel/1.0 (contact: craftlord34@gmail.com)' }

$data = Get-Content $inFile -Raw | ConvertFrom-Json

# Curated search queries where the display name won't resolve well on its own.
$override = @{
  1='Souk des Chechias Tunis'; 4='Al-Zaytuna Mosque'; 7='Sidi Bou Said'; 11='La Marsa Tunisia';
  16='Uthina'; 17='Zriba Tunisia'; 28='Hammamet'; 53='Basilica El Kef'; 55='El Kef';
  60='Ribat of Sousse'; 62='Ribat of Monastir'; 64='Mahdia'; 66='Amphitheatre of El Jem';
  68='Mosque of Uqba'; 70='Mosque of the Barber Kairouan'; 73='Kerkennah Islands';
  77='Tozeur'; 80='Nefta'; 86='Mos Espa'; 88='Lars Homestead'; 95='Matmata Tunisia';
  110='Erriadh Djerbahood'; 111='El Ghriba synagogue'; 117='Djerba mosque'; 120='Galite Islands';
  41='Utica Tunisia'; 49='Chemtou'; 91='Tisavar'; 119='Gigthis'
}

function Clean-Name([string]$n){
  $c = $n -replace '\s*\(.*?\)','' # drop parentheticals
  $c = ($c -split ' & ')[0]        # take first of "A & B"
  $c = ($c -split ' - ')[0]
  $c.Trim()
}
function Strip-Html([string]$s){ if($null -eq $s){return ''}; ($s -replace '<[^>]+>','').Trim() }

function Get-CommonsLicense([string]$fileTitle){
  if([string]::IsNullOrWhiteSpace($fileTitle)){ return $null }
  try{
    $t = [uri]::EscapeDataString("File:$fileTitle")
    $u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&titles=$t"
    $r = Invoke-RestMethod -Uri $u -Headers $h -TimeoutSec 25
    $pg = $r.query.pages.PSObject.Properties.Value | Select-Object -First 1
    $ii = $pg.imageinfo | Select-Object -First 1
    $m  = $ii.extmetadata
    return [pscustomobject]@{
      license    = (Strip-Html $m.LicenseShortName.value)
      licenseUrl = $m.LicenseUrl.value
      author     = (Strip-Html $m.Artist.value)
      credit     = (Strip-Html $m.Credit.value)
      filePage   = "https://commons.wikimedia.org/wiki/File:$([uri]::EscapeDataString($fileTitle))"
    }
  } catch { return $null }
}

$ok=0; $fallback=0; $missing=@()
foreach($g in $data.gems){
  $q = if($override.ContainsKey([int]$g.id)){ $override[[int]$g.id] } else { (Clean-Name $g.name) + ' Tunisia' }
  $img = $null
  # ---- Tier 1: Wikipedia lead image via generator=search ----
  try{
    $eq = [uri]::EscapeDataString($q)
    $u = "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=$eq&gsrlimit=1&gsrnamespace=0&prop=pageimages|info&piprop=original|thumbnail|name&pithumbsize=900&inprop=url"
    $r = Invoke-RestMethod -Uri $u -Headers $h -TimeoutSec 25
    if($r.query -and $r.query.pages){
      $pg = $r.query.pages.PSObject.Properties.Value | Sort-Object index | Select-Object -First 1
      if($pg.original -and $pg.original.source){
        $lic = Get-CommonsLicense $pg.pageimage
        $img = [pscustomobject]@{
          full       = $pg.original.source
          thumb      = if($pg.thumbnail){$pg.thumbnail.source}else{$pg.original.source}
          sourcePage = if($lic -and $lic.filePage){$lic.filePage}else{$pg.fullurl}
          articleUrl = $pg.fullurl
          license    = if($lic){$lic.license}else{''}
          licenseUrl = if($lic){$lic.licenseUrl}else{''}
          author     = if($lic){$lic.author}else{''}
          method     = 'wikipedia-leadimage'
          query      = $q
          matched    = $pg.title
        }
      }
    }
  } catch {}
  # ---- Tier 2: Commons file search ----
  if($null -eq $img){
    try{
      $eq = [uri]::EscapeDataString($q)
      $u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=$eq&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900"
      $r = Invoke-RestMethod -Uri $u -Headers $h -TimeoutSec 25
      if($r.query -and $r.query.pages){
        $pg = $r.query.pages.PSObject.Properties.Value | Sort-Object index | Select-Object -First 1
        $ii = $pg.imageinfo | Select-Object -First 1
        if($ii -and $ii.url){
          $m = $ii.extmetadata
          $img = [pscustomobject]@{
            full       = $ii.url
            thumb      = if($ii.thumburl){$ii.thumburl}else{$ii.url}
            sourcePage = $ii.descriptionurl
            articleUrl = ''
            license    = (Strip-Html $m.LicenseShortName.value)
            licenseUrl = $m.LicenseUrl.value
            author     = (Strip-Html $m.Artist.value)
            method     = 'commons-search'
            query      = $q
            matched    = $pg.title
          }
          $fallback++
        }
      }
    } catch {}
  }

  if($img){ if($img.method -eq 'wikipedia-leadimage'){$ok++}; $g | Add-Member -NotePropertyName image -NotePropertyValue $img -Force }
  else { $g | Add-Member -NotePropertyName image -NotePropertyValue $null -Force; $missing += "$($g.id) $($g.name)" }

  Start-Sleep -Milliseconds 120
}

$data | ConvertTo-Json -Depth 12 | Set-Content -Path $inFile -Encoding UTF8

"=== DONE ==="
"wikipedia lead images: $ok"
"commons fallback     : $fallback"
"missing (no photo)   : $($missing.Count)"
if($missing.Count){ "--- missing ---"; $missing | ForEach-Object { $_ } }
