"use client";

// 学习进度头部组件，展示学生的基本信息、知识点掌握情况、测验进度等统计数据
import { Bot, Brain, CheckCircle2, FileText, LineChart, School, Target, TrendingUp, XCircle } from "lucide-react";
import Link from "next/link";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
export default function LearningProgressHeader({
  data,
  studentId,
  classroomId
}) {
  const {
    studentName,
    className,
    grade,
    schoolName,
    subject,
    totalKnowledgePoints,
    masteredKnowledgePoints,
    overallMasteryRate,
    testProgress,
    totalQuestions,
    correctQuestions,
    overallCorrectRate,
    aiQuestionStats
  } = data;
  return <div className="learning-progress-card">
      {/* 头部信息 */}
      <div className="progress-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{studentName}</h1>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <School className="w-3 h-3" />
              <span>
                {className} · {grade} · {schoolName}
              </span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-md">
            <div className="flex items-center">
              <span className="text-sm font-semibold whitespace-nowrap">
                {subject}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="progress-content">
        {/* 知识点掌握 - 突出显示 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-foreground">
              本学期知识点掌握情况
            </h3>
          </div>

          <div className="knowledge-mastery-highlight">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {totalKnowledgePoints}
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  总知识点
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-700">
                  {masteredKnowledgePoints}
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  已掌握
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {overallMasteryRate.toFixed(1)}%
                </div>
                <div className="text-xs text-purple-600 font-medium">
                  掌握进度
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 分割线 */}
        <div className="progress-divider"></div>

        {/* 其他统计 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-foreground">
                测验进度
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                {testProgress.completed}
              </span>
              <span className="text-sm text-muted-foreground">
                /{testProgress.total}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{
              width: testProgress.total > 0 ? `${testProgress.completed / testProgress.total * 100}%` : "0%"
            }}></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">
                做题统计
              </span>
            </div>
            <div className="text-xl font-bold text-foreground text-center">
              {totalQuestions.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              总题数
            </div>
          </div>
        </div>

        {/* 答对率统计 */}
        <div className="flex gap-2 mb-4">
          <div className="stat-card-small bg-emerald-theme">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-emerald-theme">
              {correctQuestions}
            </div>
            <div className="text-xs text-emerald-subtitle">正确</div>
          </div>
          <div className="stat-card-small bg-red-theme">
            <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-red-theme">
              {totalQuestions - correctQuestions}
            </div>
            <div className="text-xs text-red-subtitle">错误</div>
          </div>
          <div className="stat-card-small bg-blue-theme">
            <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-theme">
              {overallCorrectRate.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-subtitle">答对率</div>
          </div>
        </div>

        {/* 自主上传错题题目统计 */}
        {aiQuestionStats.total > 0 && <>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-foreground">
                {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}题目
              </span>
            </div>
            <div className="flex gap-2">
              <div className="stat-card-small bg-purple-50">
                <Bot className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-700">
                  {aiQuestionStats.total}
                </div>
                <div className="text-xs text-purple-600">总数</div>
              </div>
              <div className="stat-card-small bg-emerald-theme">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-emerald-theme">
                  {aiQuestionStats.mastered}
                </div>
                <div className="text-xs text-emerald-subtitle">已掌握</div>
              </div>
              <div className="stat-card-small bg-orange-50">
                <XCircle className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-700">
                  {aiQuestionStats.unmastered}
                </div>
                <div className="text-xs text-orange-600">未掌握</div>
              </div>
            </div>
          </>}

        {/* 查看成长记录按钮 */}
        <div className="mt-4 pt-3 border-t border-border">
          <Link href={`/mobile/studentGrowth/${classroomId}/${studentId}`}>
            <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <LineChart className="w-4 h-4" />
              <span>查看成长记录</span>
            </div>
          </Link>
        </div>
      </div>
    </div>;
}
