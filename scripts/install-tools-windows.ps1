$ErrorActionPreference = "Stop"

winget install --id Docker.DockerDesktop --exact
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Kubernetes.kubectl --exact
winget install --id Helm.Helm --exact

Write-Output ""
Write-Output "Tools installation requested."
Write-Output "Close this terminal, open a new PowerShell window, start Docker Desktop, and run:"
Write-Output ".\scripts\check-tools.ps1"
