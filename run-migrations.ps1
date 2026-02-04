# Run Prisma migrations for Neon database
# Usage: .\run-migrations.ps1
# Or: $env:DATABASE_URL="your-connection-string"; npx prisma migrate deploy

Write-Host "Checking for DATABASE_URL..." -ForegroundColor Yellow

if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL environment variable is not set." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please do one of the following:" -ForegroundColor Yellow
    Write-Host "1. Add DATABASE_URL to your .env.local file" -ForegroundColor Cyan
    Write-Host "2. Or run: `$env:DATABASE_URL='your-connection-string'; npx prisma migrate deploy" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Get your connection string from:" -ForegroundColor Yellow
    Write-Host "  - Vercel: Settings → Environment Variables → DATABASE_URL" -ForegroundColor Cyan
    Write-Host "  - Neon Dashboard: Connection Details" -ForegroundColor Cyan
    exit 1
}

Write-Host "DATABASE_URL is set. Running migrations..." -ForegroundColor Green
Write-Host ""

npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    Write-Host "Your database tables should now be created." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
}
