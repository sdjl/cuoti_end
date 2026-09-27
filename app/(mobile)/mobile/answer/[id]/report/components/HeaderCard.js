"use client";

// 答卷报告头部卡片组件，显示学生基本信息、试卷信息和答题统计
import { BookOpen, Calendar, CheckCircle2, LineChart, School, Target, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
// 控制是否显示右上角的正确率数据
const SHOW_MASTERY_RATE = false;
export default function GlassHeaderCard({
  data
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const handleMasteryRateClick = () => {
    setShowTooltip(true);
    // 3秒后自动隐藏提示
    setTimeout(() => {
      setShowTooltip(false);
    }, 3000);
  };
  return <div className="p-4">
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {data.studentName}
            </h1>
            <div className="flex items-center gap-1 text-slate-600 text-sm">
              <School className="w-3 h-3" />
              <span>
                {data.className} · {data.grade} · {data.schoolName}
              </span>
            </div>
          </div>
          {SHOW_MASTERY_RATE && <div className="relative">
              <div className="glass-score-badge cursor-pointer flex items-center gap-1" onClick={handleMasteryRateClick}>
                <span className="text-xl font-bold">
                  {data.overallMasteryRate}%
                </span>
              </div>

              {/* 提示气泡 */}
              {showTooltip && <div className="absolute top-full right-0 mt-2 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg max-w-48 z-10">
                  <div className="relative">
                    {/* 箭头 */}
                    <div className="absolute -top-2 right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-800"></div>
                    <p className="text-center">
                      这里显示的是所有知识点的平均掌握程度统计
                    </p>
                  </div>
                </div>}
            </div>}
        </div>

        <div className="glass-inner">
          <h2 className="text-base font-semibold mb-3 text-slate-800">
            {data.paperTitle}
          </h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-slate-600">{data.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-slate-600">{data.testTime}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="glass-result-card flex-1 bg-emerald-50/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-lg font-bold text-emerald-700">
              {data.correctCount}
            </span>
            <span className="text-xs text-emerald-600">正确</span>
          </div>
          <div className="glass-result-card flex-1 bg-red-50/80">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-lg font-bold text-red-700">
              {data.wrongCount}
            </span>
            <span className="text-xs text-red-600">错误</span>
          </div>
          <div className="glass-result-card flex-1 bg-blue-50/80">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-bold text-blue-700">
              {data.totalCount}
            </span>
            <span className="text-xs text-blue-600">总题</span>
          </div>
        </div>

        {/* 查看成长记录按钮 */}
        <div className="mt-4 pt-3 border-t border-border">
          <Link href={`/mobile/studentGrowth/${data.classroomId}/${data.studentId}`}>
            <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md active:scale-95 flex items-center justify-center gap-2">
              <LineChart className="w-4 h-4" />
              <span>查看成长记录</span>
            </div>
          </Link>
        </div>
      </div>
    </div>;
}
