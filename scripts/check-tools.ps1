$tools = @(
    @{ Name = "docker"; Command = "docker --version" },
    @{ Name = "docker compose"; Command = "docker compose version" },
    @{ Name = "node"; Command = "node --version" },
    @{ Name = "npm"; Command = "npm --version" },
    @{ Name = "kubectl"; Command = "kubectl version --client" },
    @{ Name = "helm"; Command = "helm version" }
)

$failed = $false

foreach ($tool in $tools) {
    Write-Output "Checking $($tool.Name)..."
    try {
        Invoke-Expression $tool.Command
    } catch {
        $failed = $true
        Write-Output "Missing or not available in PATH: $($tool.Name)"
    }
    Write-Output ""
}

if ($failed) {
    throw "Some required tools are missing or not available in PATH. Restart the terminal after installation and run this script again."
}

Write-Output "All required tools are available."
