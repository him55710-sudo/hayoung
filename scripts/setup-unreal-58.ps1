param(
  [switch]$LaunchInstaller,
  [switch]$OpenLauncher,
  [switch]$LaunchProject,
  [switch]$CheckMcp
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$InstallerPath = Join-Path $env:USERPROFILE "Downloads\EpicInstaller-20.1.0.msi"
$InstallerLog = Join-Path $RepoRoot "output\unreal-epic-installer.log"
$ProjectPath = Join-Path $RepoRoot "unreal\Hayoung500.uproject"

$LauncherCandidates = @(
  "C:\Program Files\Epic Games\Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe",
  "C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe"
)

$EditorCandidates = @(
  "C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe",
  "C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe"
)

function Find-FirstExisting($Paths) {
  foreach ($Path in $Paths) {
    if (Test-Path -LiteralPath $Path) {
      return $Path
    }
  }
  return $null
}

function Show-Status {
  $launcher = Find-FirstExisting $LauncherCandidates
  $editor = Find-FirstExisting $EditorCandidates
  $msiProcesses = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -match "msiexec|winget|Epic|Unreal" } |
    Select-Object ProcessId, Name, CommandLine

  [pscustomobject]@{
    RepoRoot = $RepoRoot.Path
    EpicInstaller = $InstallerPath
    EpicInstallerExists = Test-Path -LiteralPath $InstallerPath
    EpicLauncher = $launcher
    UnrealEditor = $editor
    UnrealProject = $ProjectPath
    UnrealProjectExists = Test-Path -LiteralPath $ProjectPath
    ActiveInstallProcesses = $msiProcesses
  } | Format-List
}

New-Item -ItemType Directory -Path (Split-Path $InstallerLog) -Force | Out-Null

Show-Status

if ($LaunchInstaller) {
  if (-not (Test-Path -LiteralPath $InstallerPath)) {
    throw "Epic installer is missing: $InstallerPath"
  }

  $activeInstaller = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq "msiexec.exe" -or $_.Name -eq "winget.exe" } |
    Select-Object -First 1

  if ($activeInstaller) {
    throw "An installer process is already active (PID $($activeInstaller.ProcessId), $($activeInstaller.Name)). Finish, approve, reboot, or clear that installer before launching another Epic install."
  }

  Write-Host ""
  Write-Host "Starting Epic Games Launcher installer with administrator prompt."
  Write-Host "If Windows shows a UAC dialog, approve it. Unreal Engine installation still requires Epic login inside the Launcher."

  Start-Process -FilePath "msiexec.exe" `
    -ArgumentList "/i `"$InstallerPath`" /passive /norestart /l*v `"$InstallerLog`"" `
    -Verb RunAs
}

if ($OpenLauncher) {
  $launcher = Find-FirstExisting $LauncherCandidates
  if (-not $launcher) {
    throw "Epic Games Launcher is not installed yet."
  }
  Start-Process -FilePath $launcher
}

if ($LaunchProject) {
  $editor = Find-FirstExisting $EditorCandidates
  if (-not $editor) {
    throw "UnrealEditor.exe was not found. Install Unreal Engine 5.8 from Epic Games Launcher first."
  }
  $editorArgs = @(
    "`"$ProjectPath`"",
    "-ModelContextProtocolStartServer",
    "-ModelContextProtocolPort=8000",
    "-NoLiveCoding"
  )
  Start-Process -FilePath $editor -ArgumentList $editorArgs
}

if ($CheckMcp) {
  try {
    $headers = @{ Accept = "application/json, text/event-stream" }
    $body = @{
      jsonrpc = "2.0"
      id = 1
      method = "initialize"
      params = @{
        protocolVersion = "2025-06-18"
        capabilities = @{}
        clientInfo = @{
          name = "setup-unreal-58"
          version = "1.0"
        }
      }
    } | ConvertTo-Json -Depth 8
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/mcp" -Method Post -ContentType "application/json" -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 5
    [pscustomobject]@{
      McpEndpoint = "http://127.0.0.1:8000/mcp"
      StatusCode = $response.StatusCode
      SessionId = $response.Headers["Mcp-Session-Id"]
      ContentType = $response.Headers["Content-Type"]
    } | Format-List
  } catch {
    Write-Warning "Unreal MCP is not reachable yet. Open UE 5.8, enable Unreal MCP, then run ModelContextProtocol.StartServer 8000 or enable Auto Start Server."
  }
}
