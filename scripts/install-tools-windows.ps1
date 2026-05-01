$ErrorActionPreference = "Stop"

winget install --id Docker.DockerDesktop --exact
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Kubernetes.kubectl --exact
winget install --id Helm.Helm --exact

Write-Output ""
Write-Output "Tools installation requested."
Write-Output "Install Minikube separately if it is not already available:"
Write-Output "https://minikube.sigs.k8s.io/docs/start/"
Write-Output "Close this terminal, open a new PowerShell window, start Docker Desktop, and run:"
Write-Output ".\scripts\check-tools.ps1"
