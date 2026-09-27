"use client";

import { BookOpen, Flame, Star, Zap } from "lucide-react";
// 知识点掌握情况卡片组件，展示本次测验中已掌握、部分掌握和需要加强的知识点
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
export default function KnowledgePointsCard({
  data
}) {
  const totalKnowledgePoints = data.mastered.length + data.partiallyMastered.length + data.needsImprovement.length;
  return <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-blue-600" />
          本次测验知识点掌握情况
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 掌握的知识点 */}
        {data.mastered.length > 0 && <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-gray-800">已掌握</h3>
              <div className="flex-1 h-px bg-emerald-200"></div>
              <span className="text-sm text-emerald-600 font-medium">
                {data.mastered.length}/{totalKnowledgePoints}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.mastered.map(kp => <div key={kp.name} className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium text-center shadow-lg flex-shrink-0">
                  {kp.name}
                </div>)}
            </div>
          </div>}

        {/* 部分掌握的知识点 */}
        {data.partiallyMastered.length > 0 && <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-800">部分掌握</h3>
              <div className="flex-1 h-px bg-amber-200"></div>
              <span className="text-sm text-amber-600 font-medium">
                {data.partiallyMastered.length}/{totalKnowledgePoints}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.partiallyMastered.map(kp => <div key={kp.name} className="bg-amber-100 border border-amber-300 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium text-center shadow-sm flex-shrink-0">
                  {kp.name}
                </div>)}
            </div>
          </div>}

        {/* 未掌握的知识点 */}
        {data.needsImprovement.length > 0 && <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-800">需要加强</h3>
              <div className="flex-1 h-px bg-rose-200"></div>
              <span className="text-sm text-rose-600 font-medium">
                {data.needsImprovement.length}/{totalKnowledgePoints}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.needsImprovement.map(kp => <div key={kp.name} className="bg-rose-100 border-2 border-dashed border-rose-300 text-rose-800 px-3 py-2 rounded-lg text-sm font-medium text-center shadow-sm flex-shrink-0">
                  {kp.name}
                </div>)}
            </div>
          </div>}

        {/* 如果没有知识点数据 */}
        {totalKnowledgePoints === 0 && <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无知识点数据</p>
          </div>}
      </CardContent>
    </Card>;
}
