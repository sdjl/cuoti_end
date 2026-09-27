"use client";

// 积分排行榜头部组件，展示排行榜标题、统计信息和类型选择器
import { Gift } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
export function ScoreRankingHeader({
  grade,
  rankingType,
  allRankingData,
  onRankingTypeChange,
  onGoToMyScore,
  showMyScoreButton
}) {
  return <div className="bg-white border-b border-gray-200 mb-4">
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">积分排行榜</h2>
          {grade && <p className="text-gray-600 mb-4">{grade}</p>}

          {/* 统计信息 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {allRankingData.length > 0 ? Math.max(...allRankingData.map(s => s.score)) : 0}
              </p>
              <p className="text-xs text-gray-500">最高积分</p>
            </div>
            <div className="text-center border-l border-gray-200">
              <p className="text-2xl font-bold text-blue-600">
                {allRankingData.length > 0 ? Math.round(allRankingData.reduce((acc, s) => acc + s.score, 0) / allRankingData.length) : 0}
              </p>
              <p className="text-xs text-gray-500">平均积分</p>
            </div>
          </div>

          {/* 排行榜类型选择器 */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button onClick={() => onRankingTypeChange("monthly")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${rankingType === "monthly" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600"}`}>
              本月新增
            </button>
            <button onClick={() => onRankingTypeChange("total")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${rankingType === "total" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600"}`}>
              总积分
            </button>
          </div>

          {/* 我的积分按钮 - 只在小程序环境中显示 */}
          {showMyScoreButton && <Button onClick={onGoToMyScore} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              <Gift className="h-4 w-4 mr-2" />
              查看我的积分
            </Button>}
        </div>
      </div>
    </div>;
}
