"use client";

// 错题排行榜页面，展示学生错题掌握情况的排行榜
import "./style.css";
import { Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getMistakeRankingWithStudentAction } from "./actions.js";
// 排行榜显示数量配置 - 只显示前N名
const RANKING_DISPLAY_LIMIT = 50;

// 是否隐藏其他学生姓名（全局变量）
const HIDE_OTHER_STUDENT_NAMES = true;


function hideStudentName(name, currentStudentName) {
  // 如果功能未开启或者是当前用户，直接返回原名
  if (!HIDE_OTHER_STUDENT_NAMES || name === currentStudentName) {
    return name;
  }

  // 如果姓名长度小于2，直接返回原名
  if (name.length < 2) {
    return name;
  }

  // 如果姓名是2个字，隐藏第二个字
  if (name.length === 2) {
    return `${name.charAt(0)}*`;
  }

  // 如果姓名超过2个字，隐藏倒数第2个字
  const chars = name.split("");
  chars[chars.length - 2] = "*";
  return chars.join("");
}
function MistakeRankingContent() {
  const searchParams = useSearchParams();
  const grade = searchParams.get("grade");
  const schoolId = searchParams.get("schoolId");
  const studentId = searchParams.get("studentId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [allRankingData, setAllRankingData] = useState([]);
  const [displayRankingData, setDisplayRankingData] = useState([]);
  const [currentStudentRank, setCurrentStudentRank] = useState(null);

  // 加载排行榜数据
  const loadRankingData = async range => {
    if (!schoolId || !grade) {
      setError("缺少必要参数");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // 一次性获取排行榜数据和当前学生排名
      const result = await getMistakeRankingWithStudentAction(schoolId, grade, studentId || undefined, range);
      if (result.success && result.data) {
        const fullRankingData = result.data.rankingData;
        setAllRankingData(fullRankingData);

        // 只显示前N名的数据
        const limitedRankingData = fullRankingData.slice(0, RANKING_DISPLAY_LIMIT);
        setDisplayRankingData(limitedRankingData);
        setCurrentStudentRank(result.data.currentStudentRank);
      } else {
        setError(result.error || "加载排行榜数据失败");
        // 清空之前的数据
        setAllRankingData([]);
        setDisplayRankingData([]);
        setCurrentStudentRank(null);
      }
    } catch (err) {
      console.error("Error loading ranking data:", err);
      setError("加载失败");
      // 清空之前的数据
      setAllRankingData([]);
      setDisplayRankingData([]);
      setCurrentStudentRank(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankingData(timeRange);
  }, [schoolId, grade, studentId, timeRange]);

  // 处理时间范围切换
  const handleTimeRangeChange = range => {
    setTimeRange(range);
  };
  if (loading) {
    return <div className="demo-mobile-container">
        <div className="demo-content">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">加载排行榜数据中...</p>
            </div>
          </div>
        </div>
        <div className="demo-safe-area-bottom" />
      </div>;
  }
  if (error) {
    return <div className="demo-mobile-container">
        <div className="demo-content">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-red-500 mb-2">加载失败</div>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
        <div className="demo-safe-area-bottom" />
      </div>;
  }
  return <div className="demo-mobile-container">
      {/* 头部信息 */}
      <div className="bg-white border-b border-gray-200 mb-4">
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {DISPLAY_TEXT.COURSE_MISTAKE}排行榜
            </h2>
            {grade && <p className="text-gray-600 mb-4">{grade}</p>}

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {allRankingData.length > 0 ? Math.max(...allRankingData.map(s => s.correctedCount)) : 0}
                </p>
                <p className="text-xs text-gray-500">最高掌握</p>
              </div>
              <div className="text-center border-l border-gray-200">
                <p className="text-2xl font-bold text-orange-600">
                  {allRankingData.length > 0 ? Math.round(allRankingData.reduce((acc, s) => acc + s.correctedCount, 0) / allRankingData.length) : 0}
                </p>
                <p className="text-xs text-gray-500">平均掌握</p>
              </div>
            </div>

            {/* 时间选择器 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => handleTimeRangeChange("month")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${timeRange === "month" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                本月排行
              </button>
              <button onClick={() => handleTimeRangeChange("week")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${timeRange === "week" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                本周排行
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-content space-y-4">
        {/* 我的排名 */}
        {currentStudentRank && <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {currentStudentRank.rank}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">排名</span>
                  </div>
                  <div className="border-l border-gray-200 pl-4">
                    <p className="font-bold text-gray-900">
                      {hideStudentName(currentStudentRank.studentName, currentStudentRank.studentName)}
                    </p>
                    <p className="text-sm text-gray-500">我的排名</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {currentStudentRank.correctedCount}
                    </p>
                    <p className="text-xs text-gray-500">掌握错题数</p>
                  </div>
                  <div className="text-right mt-1">
                    <p className="text-sm text-gray-400">
                      {currentStudentRank.score} 积分
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>}

        {/* 排行榜列表 */}
        {displayRankingData.length > 0 ? <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                排行榜 - 前
                {Math.min(RANKING_DISPLAY_LIMIT, allRankingData.length)}名
                {allRankingData.length > RANKING_DISPLAY_LIMIT && ` (共${allRankingData.length}名学生)`}
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {displayRankingData.map((student, index) => <div key={student.studentId} className={`p-4 hover:bg-gray-50 transition-colors ${index < 3 ? "bg-yellow-50/50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center min-w-[40px]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${student.rank === 1 ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300" : student.rank === 2 ? "bg-gray-100 text-gray-700 border-2 border-gray-300" : student.rank === 3 ? "bg-orange-100 text-orange-700 border-2 border-orange-300" : "bg-gray-50 text-gray-600"}`}>
                          {student.rank}
                        </div>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <p className="font-semibold text-gray-900">
                          {hideStudentName(student.studentName, currentStudentRank?.studentName)}
                        </p>
                        <p className="text-sm text-gray-500">
                          积分: {student.score}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        {student.correctedCount}
                      </p>
                      <p className="text-xs text-gray-500">掌握错题</p>
                    </div>
                  </div>
                </div>)}
            </div>
          </div> : (/* 空状态 */
      <div className="bg-white rounded-lg p-8 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无排行数据
            </h3>
            <p className="text-gray-500 text-sm">
              该年级{timeRange === "month" ? "本月" : "本周"}
              还没有学生完成{DISPLAY_TEXT.COURSE_MISTAKE}
            </p>
          </div>)}
      </div>

      {/* 底部安全区域 */}
      <div className="demo-safe-area-bottom" />
    </div>;
}
export default function MistakeRankingPage() {
  return <Suspense fallback={<div className="demo-mobile-container">
          <div className="demo-header">
            <h1 className="demo-header-title">
              {DISPLAY_TEXT.COURSE_MISTAKE}排行榜
            </h1>
          </div>
          <div className="demo-content">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          </div>
          <div className="demo-safe-area-bottom" />
        </div>}>
      <MistakeRankingContent />
    </Suspense>;
}
