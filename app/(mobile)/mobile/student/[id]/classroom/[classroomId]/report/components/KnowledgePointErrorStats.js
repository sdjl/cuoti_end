"use client";

// 知识点错误统计组件，展示学生在各个知识点上的错误次数统计
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
export default function KnowledgePointErrorStats({
  data
}) {
  if (data.length === 0) {
    return null;
  }

  // 找到最大错误次数，用于计算进度条宽度
  const maxErrorCount = Math.max(...data.map(item => item.errorCount));
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          知识点错误统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
          // 计算进度条宽度百分比
          const widthPercentage = item.errorCount / maxErrorCount * 100;
          return <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {item.knowledgePoint}
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {item.errorCount}次
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300" style={{
                width: `${widthPercentage}%`
              }}></div>
                </div>
              </div>;
        })}
        </div>

        {data.length === 0 && <div className="text-center text-gray-500 py-8">
            暂无知识点错误数据
          </div>}
      </CardContent>
    </Card>;
}
