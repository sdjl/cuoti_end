"use client";

// 高频错题集详情页信息面板，展示题集基础数据与过滤条件
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar, FileText } from "lucide-react";
import { Badge } from "../../../../../../../../components/ui/badge.js";
export default function FrequentMistakePackInfo({
  pack
}) {
  // 获取生成方式标记
  const getGenerationTypeBadge = type => {
    const config = {
      知识点: {
        color: "bg-blue-100 text-blue-800",
        text: "知识点"
      },
      错误归因: {
        color: "bg-orange-100 text-orange-800",
        text: "错误归因"
      }
    };
    const badgeConfig = config[type];
    return <Badge className={`${badgeConfig.color}`}>{badgeConfig.text}</Badge>;
  };

  // 获取筛选内容
  const getFilterContent = () => {
    if (pack.generationType === "知识点") {
      return pack.knowledgePoints.join(", ") || "未指定";
    } else {
      return pack.mistakePoints.join(", ") || "未指定";
    }
  };
  return <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      {/* 标题 */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{pack.name}</h2>
        {pack.description && <p className="text-gray-600">{pack.description}</p>}
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div>
          <div className="text-sm text-gray-500 mb-1">科目</div>
          <div className="font-medium text-gray-900">{pack.subject}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">题目数量</div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">
              {pack.questionIds.length}
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">时间区间</div>
          <div className="font-medium text-gray-900">{pack.timeRange}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">创建时间</div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">
              {format(new Date(pack.created), "yyyy-MM-dd", {
              locale: zhCN
            })}
            </span>
          </div>
        </div>
      </div>

      {/* 生成方式和筛选条件 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <div className="text-sm text-gray-500 mb-2">生成方式</div>
          {getGenerationTypeBadge(pack.generationType)}
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-2">筛选条件</div>
          <div className="font-medium text-gray-900">{getFilterContent()}</div>
        </div>
      </div>
    </div>;
}
