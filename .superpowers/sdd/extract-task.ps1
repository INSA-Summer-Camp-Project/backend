param(
  [Parameter(Mandatory)][int]$N,
  [string]$PlanPath = "docs/superpowers/plans/2026-08-21-swagger-documentation.md",
  [string]$OutDir = ".superpowers/sdd"
)
$content = Get-Content $PlanPath -Raw
$pattern = "(?s)(### Task $N:.*?)(?=### Task \($?\{0\}\)|### Task $($N+1):|## Self-Review Notes|``$)"
if ($content -notmatch "### Task $N`:") { Write-Error "Task $N not found"; exit 1 }
# Robust split approach
$sections = [regex]::Split($content, "(?m)^### Task (\d+):")
# sections: [prelude, num1, body1, num2, body2, ...]
for ($i = 1; $i -lt $sections.Length; $i += 2) {
  $num = [int]$sections[$i]
  if ($num -eq $N) {
    $body = "### Task $($sections[$i]):" + "`n" + $sections[$i+1]
    # Trim trailing separator lines (--- etc.)
    $body = ($body -replace "(?m)^---\s*$", "").TrimEnd() + "`n"
    $out = Join-Path $OutDir "task-$N-brief.md"
    Set-Content -LiteralPath $out -Value $body -Encoding utf8NoBOM
    Write-Output $out
    exit 0
  }
}
Write-Error "Task $N not found"; exit 1
