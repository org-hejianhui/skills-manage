# PowerShell脚本：以管理员身份删除符号链接
# 请以管理员身份运行此脚本

$symlinkPath = "C:\Users\jianhui.he\.trae-cn\skills\ab-test-skill"

Write-Host "尝试删除符号链接: $symlinkPath"

# 检查符号链接是否存在
if (Test-Path -Path $symlinkPath) {
    try {
        # 尝试删除符号链接
        Remove-Item -Path $symlinkPath -Force -ErrorAction Stop
        Write-Host "符号链接删除成功!" -ForegroundColor Green
    } catch {
        Write-Host "删除失败，尝试使用其他方法..." -ForegroundColor Yellow
        try {
            # 尝试使用cmd命令删除
            cmd /c "del \"$symlinkPath\""
            if (-not (Test-Path -Path $symlinkPath)) {
                Write-Host "符号链接删除成功!" -ForegroundColor Green
            } else {
                Write-Host "删除仍然失败: $($_.Exception.Message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "所有删除方法都失败: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "请手动删除符号链接" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "符号链接不存在: $symlinkPath" -ForegroundColor Yellow
}

Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")