#!/bin/sh

# 加载定时任务
crontab cron-task.txt

# 启动 cron 守护进程（后台运行，不记录任务日志）
crond

# 验证 cron 是否启动成功
if ps aux | grep -v grep | grep crond > /dev/null; then
    echo 'Cron 服务已启动成功'
    echo '已配置的定时任务:'
    crontab -l
else
    echo 'Cron 服务启动失败'
    exit 1
fi

# 启动 Next.js 应用
exec npm start