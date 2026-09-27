"use client";

// 状态标记组件，支持 hover 显示详情和点击复制ID
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
export default function StatusBadge({
  status,
  taskId,
  startTime,
  retryCount = 0,
  failureReason
}) {
  const {
    toast
  } = useToast();

  // 格式化时间
  const formatTime = timestamp => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  // 状态配置
  const statusConfig = {
    waiting: {
      color: "bg-gray-100 text-gray-800",
      text: "等待执行"
    },
    generating: {
      color: "bg-blue-100 text-blue-800",
      text: "生成中"
    },
    completed: {
      color: "bg-green-100 text-green-800",
      text: "已生成"
    },
    failed: {
      color: "bg-red-100 text-red-800",
      text: "生成失败"
    },
    waiting_clean: {
      color: "bg-gray-100 text-gray-800",
      text: "等待清理"
    },
    cleaning: {
      color: "bg-yellow-100 text-yellow-800",
      text: "文件清理中"
    },
    cleaned: {
      color: "bg-purple-100 text-purple-800",
      text: "文件已清理"
    },
    clean_failed: {
      color: "bg-orange-100 text-orange-800",
      text: "清理失败"
    }
  };
  const config = statusConfig[status];

  // 复制任务ID
  const handleCopyTaskId = async () => {
    try {
      await navigator.clipboard.writeText(taskId);
      toast({
        title: "复制成功",
        description: "任务ID已复制到剪贴板"
      });
    } catch (error) {
      console.error("复制任务ID失败:", error);
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`text-xs px-2 py-1 rounded-full inline-block cursor-pointer hover:opacity-80 transition-opacity ${config.color}`} onClick={handleCopyTaskId}>
            {config.text}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">任务开始时间：</span>
              <br />
              {formatTime(startTime)}
            </div>
            <div>
              <span className="font-medium">失败次数：</span> {retryCount}
            </div>
            {failureReason && <div>
                <span className="font-medium text-red-600">失败原因：</span>
                <br />
                {failureReason}
              </div>}
            <div className="pt-2 border-t text-xs text-white">
              点击复制任务ID
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
}
