"use client";

import { TrendingDown } from "lucide-react";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
/**
 * 错误归因统计组件
 * 显示学生在每个错误归因上的犯错次数统计，按错误次数降序排列
 */
const MistakePointsStats = ({
  mistakePointsStats
}) => {
  // 如果没有数据，显示空状态
  if (!mistakePointsStats || mistakePointsStats.length === 0) {
    return <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {/* 组件标题 */}
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-base font-semibold text-card-foreground">
            {DISPLAY_TEXT.ERROR_ATTRIBUTION}统计
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            各{DISPLAY_TEXT.ERROR_ATTRIBUTION}的犯错次数统计
          </p>
        </div>

        {/* 空状态 */}
        <div className="p-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            <TrendingDown className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <h4 className="text-base font-medium text-card-foreground mb-1">
                暂无{DISPLAY_TEXT.ERROR_ATTRIBUTION}数据
              </h4>
              <p className="text-sm text-muted-foreground">
                还没有{DISPLAY_TEXT.ERROR_ATTRIBUTION}统计数据，继续学习吧！
              </p>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      {/* 组件标题 */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-base font-semibold text-card-foreground">
          {DISPLAY_TEXT.ERROR_ATTRIBUTION}统计
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          各{DISPLAY_TEXT.ERROR_ATTRIBUTION}的犯错次数统计（按频次排序）
        </p>
      </div>

      {/* 统计列表 */}
      <div className="p-4">
        <div className="space-y-1">
          {mistakePointsStats.map((stat, index) => <div key={index} className="flex items-center justify-between py-2">
              <span className="text-sm text-card-foreground truncate flex-1 min-w-0">
                {stat.name}
              </span>
              <span className="text-sm font-medium text-red-600 ml-3">
                {stat.errorCount}次
              </span>
            </div>)}
        </div>
      </div>
    </div>;
};
export default MistakePointsStats;
