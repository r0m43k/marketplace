$tools = @(
    @{ Name = "docker"; Command = "docker --version"; Required = $true },
    @{ Name = "docker compose"; Command = "docker compose version"; Required = $true },
    @{ Name = "node"; Command = "node --version"; Required = $true },
    @{ Name = "npm"; Command = "npm --version"; Required = $true },
    @{ Name = "kubectl"; Command = "kubectl version --client" ; Required = $true },
    @{ Name = "minikube"; Command = "minikube version"; Required = $true },
    @{ Name = "helm"; Command = "helm version"; Required = $false }
)

$failed = $false

foreach ($tool in $tools) {
    Write-Output "Checking $($tool.Name)..."
    try {
        Invoke-Expression $tool.Command
    } catch {
        if ($tool.Required) {
            $failed = $true
            Write-Output "Missing or not available in PATH: $($tool.Name)"
        } else {
            Write-Output "Optional tool is missing or not available in PATH: $($tool.Name)"
        }
    }
    Write-Output ""
}

if ($failed) {
    throw "Some required tools are missing or not available in PATH. Restart the terminal after installation and run this script again."
}

Write-Output "All required tools are available."
