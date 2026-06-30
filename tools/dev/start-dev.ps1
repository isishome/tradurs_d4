param(
  [switch]$Stop
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$workspace = Resolve-Path (Join-Path $root '..')
$backDir = Join-Path $workspace 'back'
$frontDir = Join-Path $workspace 'front'
$redisExe = Join-Path $root '..\..\..\Programs\Redis-x64-3.0.504\redis-server.exe'
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
$npmCmd = (Get-Command npm.cmd -ErrorAction Stop).Source
$stateDir = Join-Path $env:TEMP 'tradurs-dev'
$pidFile = Join-Path $stateDir 'pids.json'
$redisPort = 6379
$backPort = 6081
$frontPort = 6080
$d4Port = 6090

function Write-Info($message) {
  Write-Host "[dev] $message"
}

function Resolve-FullPath($path) {
  if (-not $path) { return '' }

  try { return [System.IO.Path]::GetFullPath([string]$path).TrimEnd('\') }
  catch { return [string]$path }
}

function Test-SamePath($left, $right) {
  $leftPath = Resolve-FullPath $left
  $rightPath = Resolve-FullPath $right

  if (-not $leftPath -or -not $rightPath) { return $false }

  return [string]::Equals($leftPath, $rightPath, [System.StringComparison]::OrdinalIgnoreCase)
}

function Test-Port($port) {
  $client = New-Object Net.Sockets.TcpClient
  try {
    $connect = $client.BeginConnect('127.0.0.1', $port, $null, $null)
    if (-not $connect.AsyncWaitHandle.WaitOne(500)) { return $false }
    $client.EndConnect($connect)
    return $true
  }
  catch { return $false }
  finally { $client.Close() }
}

function Get-ListeningProcessIds([int[]]$ports) {
  $connections = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) { return @() }

  return @($connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 })
}

function Get-ProcessCommandLine($processId) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
  if (-not $process) { return '' }

  return [string]$process.CommandLine
}

function Get-ProcessExecutablePath($processId) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
  if (-not $process) { return '' }

  return [string]$process.ExecutablePath
}

function Stop-ProcessTree($processId) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) { return }

  & taskkill.exe /PID $processId /T /F | Out-Null
}

function Read-PidRecords {
  if (-not (Test-Path $pidFile)) { return @() }

  try {
    $raw = Get-Content -Path $pidFile -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) { return @() }

    return @($raw | ConvertFrom-Json)
  }
  catch {
    Write-Info "failed to read pid file: $($_.Exception.Message)"
    return @()
  }
}

function Write-PidRecords($children) {
  if (-not (Test-Path $stateDir)) {
    New-Item -Path $stateDir -ItemType Directory | Out-Null
  }

  $records = @()
  foreach ($child in $children) {
    $records += [PSCustomObject]@{ name = $child.name; pid = $child.pid }
  }

  if ($records.Count -eq 0) { return }

  $records | ConvertTo-Json -Depth 4 | Set-Content -Path $pidFile -Encoding utf8
}

function Stop-RecordedProcesses {
  $stopped = $false
  $records = Read-PidRecords

  foreach ($record in $records) {
    if (-not $record.PSObject.Properties['pid']) { continue }

    $processId = 0
    if (-not [int]::TryParse([string]$record.pid, [ref]$processId)) { continue }
    if ($processId -le 0) { continue }

    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
      $name = if ($record.PSObject.Properties['name']) { [string]$record.name } else { 'managed' }
      Write-Info "stopping $name pid=$processId"
      Stop-ProcessTree $processId
      $stopped = $true
    }
  }

  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
  return $stopped
}

function Stop-PortProcesses {
  $stopped = $false
  $portMap = @{
    $redisPort = 'redis'
    $backPort = 'back'
    $frontPort = 'front'
    $d4Port = 'd4'
  }

  foreach ($port in @($redisPort, $backPort, $frontPort, $d4Port)) {
    $processIds = Get-ListeningProcessIds @($port)
    foreach ($processId in $processIds) {
      $exe = Get-ProcessExecutablePath $processId
      $cmd = Get-ProcessCommandLine $processId

      if ($port -eq $redisPort -and -not (Test-SamePath $exe $redisExe)) {
        continue
      }

      Write-Info "stopping $($portMap[$port]) port=$port pid=$processId $cmd"
      Stop-ProcessTree $processId
      $stopped = $true
    }
  }

  return $stopped
}

function Assert-PortsAvailable([int[]]$ports) {
  $blocked = @()

  foreach ($port in $ports) {
    $processIds = Get-ListeningProcessIds @($port)
    foreach ($processId in $processIds) {
      $cmd = Get-ProcessCommandLine $processId
      $blocked += "${port}(pid=${processId}) $cmd"
    }
  }

  if ($blocked.Count -gt 0) {
    throw "dev port already in use. Run 'npm run dev:all:stop' first. $($blocked -join '; ')"
  }
}

function Start-ManagedProcess($name, $fileName, $arguments, $workingDirectory) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $fileName
  $psi.Arguments = $arguments
  $psi.WorkingDirectory = $workingDirectory
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi

  $outputAction = {
    if ($EventArgs.Data) { Write-Host "[$($Event.MessageData)] $($EventArgs.Data)" }
  }

  Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action $outputAction -MessageData $name | Out-Null
  Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action $outputAction -MessageData $name | Out-Null

  if (-not $process.Start()) { throw "failed to start $name" }

  $process.BeginOutputReadLine()
  $process.BeginErrorReadLine()

  Write-Info "started $name pid=$($process.Id)"
  return [PSCustomObject]@{ name = $name; process = $process; pid = $process.Id }
}

function Wait-ServicePort($name, $port, $process, $timeoutSeconds = 45) {
  for ($i = 0; $i -lt ($timeoutSeconds * 2); $i++) {
    if ($process -and $process.HasExited) {
      throw "$name exited with code $($process.ExitCode) before port $port became available"
    }

    if (Test-Port $port) {
      Write-Info "$name is available on 127.0.0.1:$port"
      return
    }

    Start-Sleep -Milliseconds 500
  }

  throw "$name did not become available on 127.0.0.1:$port"
}

function Ensure-Redis {
  if (Test-Port $redisPort) {
    Write-Info "redis is already available on 127.0.0.1:$redisPort"
    return $null
  }

  if (-not (Test-Path $redisExe)) {
    throw "redis executable not found: $redisExe"
  }

  $redisProcess = Start-ManagedProcess 'redis' $redisExe '' (Split-Path $redisExe)
  Wait-ServicePort 'redis' $redisPort $redisProcess.process 15

  return $redisProcess
}

if ($Stop) {
  $stoppedRecorded = Stop-RecordedProcesses
  $stoppedPorts = Stop-PortProcesses

  if (-not $stoppedRecorded -and -not $stoppedPorts) {
    Write-Info 'no managed dev processes found'
  }

  exit 0
}

if (-not (Test-Path $stateDir)) {
  New-Item -Path $stateDir -ItemType Directory | Out-Null
}

Assert-PortsAvailable @($backPort, $frontPort, $d4Port)

$children = New-Object System.Collections.Generic.List[object]

try {
  $redisProcess = Ensure-Redis
  if ($redisProcess) {
    $children.Add($redisProcess)
    Write-PidRecords $children
  }

  $backProcess = Start-ManagedProcess 'back' $nodeExe 'index.js' $backDir
  $children.Add($backProcess)
  Write-PidRecords $children
  Wait-ServicePort 'back' $backPort $backProcess.process 45

  $frontProcess = Start-ManagedProcess 'front' $npmCmd 'run dev -- --strictPort' $frontDir
  $children.Add($frontProcess)
  Write-PidRecords $children
  Wait-ServicePort 'front login' $frontPort $frontProcess.process 45

  $d4Process = Start-ManagedProcess 'd4' $npmCmd 'run dev' $root
  $children.Add($d4Process)
  Write-PidRecords $children
  Wait-ServicePort 'd4' $d4Port $d4Process.process 60

  Write-Info 'services are ready'
  Write-Info "backend: http://localhost:$backPort"
  Write-Info "front login: http://localhost:$frontPort"
  Write-Info "d4: http://localhost:$d4Port"
  Write-Info 'press Ctrl+C to stop managed processes'

  while ($true) {
    foreach ($child in $children) {
      if ($child.process.HasExited) {
        throw "$($child.name) exited with code $($child.process.ExitCode)"
      }
    }
    Start-Sleep -Seconds 1
  }
}
finally {
  foreach ($child in $children) {
    if (-not $child.process.HasExited) {
      Write-Info "stopping $($child.name) pid=$($child.pid)"
      Stop-ProcessTree $child.pid
      try { $child.process.WaitForExit(5000) | Out-Null } catch {}
    }
  }

  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}