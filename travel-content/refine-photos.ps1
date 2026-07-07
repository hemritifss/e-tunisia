# Re-fetches better REAL photos for specific gem IDs that got maps / weak matches.
# For each ID, tries an ordered list of Commons search queries and picks the first
# acceptable raster PHOTO (jpg/jpeg/webp), skipping maps/locators/flags/diagrams.

$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$inFile = Join-Path $root 'tunisia-travel-data.json'
$h = @{ 'User-Agent' = 'e-tunisia-travel/1.0 (contact: craftlord34@gmail.com)' }

# id -> candidate queries (most specific first). Plain hashtable so integer-key
# indexing ($fix[44]) resolves by KEY, not by position (the [ordered] gotcha).
$fix = @{
  44  = @('Aïn Draham','Ain Draham forest','Kroumirie forest')
  120 = @('Galite archipelago','La Galite island','Galiton')
  79  = @('Belvédère Tozeur','Tozeur oasis','Tozeur palmeraie')
  45  = @('Hammam Bourguiba','Aïn Draham spa')
  65  = @('Mahdia port','Mahdia Tunisia harbour','Mahdia medina')
  116 = @('Sidi Yati Djerba','Djerba plage','Djerba beach')
  92  = @('Zaafrane Douz','dunes Douz','Erg Oriental Douz')
  101 = @('Ghomrassen village','Ghomrassen Tunisia')
  30  = @('Sidi Daoud port','Sidi Daoud Cap Bon')
}

function Strip-Html([string]$s){ if($null -eq $s){return ''}; ($s -replace '<[^>]+>','').Trim() }
function Is-Photo([string]$url){
  if([string]::IsNullOrWhiteSpace($url)){ return $false }
  if($url -notmatch '\.(jpg|jpeg|webp)$'){ return $false }      # raster photos only
  if($url -match 'Locator|locator|Topo|topo|_Map|_map|Carte|flag|Flag|Coat|coat|Montage|montage|blason'){ return $false }
  return $true
}

$data = Get-Content $inFile -Raw | ConvertFrom-Json
foreach($id in $fix.Keys){
  $gem = $data.gems | Where-Object { [int]$_.id -eq [int]$id }
  $chosen = $null
  foreach($q in $fix[$id]){
    try{
      $eq = [uri]::EscapeDataString($q)
      $u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=$eq&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900"
      $r = Invoke-RestMethod -Uri $u -Headers $h -TimeoutSec 25
      if($r.query -and $r.query.pages){
        $pages = $r.query.pages.PSObject.Properties.Value | Sort-Object index
        foreach($pg in $pages){
          $ii = $pg.imageinfo | Select-Object -First 1
          if($ii -and (Is-Photo $ii.url)){
            $m = $ii.extmetadata
            $chosen = [pscustomobject]@{
              full=$ii.url; thumb= if($ii.thumburl){$ii.thumburl}else{$ii.url}
              sourcePage=$ii.descriptionurl; articleUrl=''
              license=(Strip-Html $m.LicenseShortName.value); licenseUrl=$m.LicenseUrl.value
              author=(Strip-Html $m.Artist.value); method='commons-search-refined'; query=$q; matched=$pg.title
            }
            break
          }
        }
      }
    } catch {}
    if($chosen){ break }
    Start-Sleep -Milliseconds 120
  }
  if($chosen){ $gem | Add-Member -NotePropertyName image -NotePropertyValue $chosen -Force; "FIXED  $id  $($gem.name)  -> $($chosen.matched)" }
  else { "NOFIX  $id  $($gem.name)" }
}
$data | ConvertTo-Json -Depth 12 | Set-Content -Path $inFile -Encoding UTF8
"done."
