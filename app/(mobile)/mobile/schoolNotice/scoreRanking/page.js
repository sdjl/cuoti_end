"use client";

// 积分排行榜页面，展示学生的月度积分和总积分排行榜
import "./style.css";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { isMiniProgramEnvironment, navigateToMiniProgramPage } from "../../../../../lib/utils/minaJSSDK.js";
import { getBothScoreRankingsAction } from "./actions.js";
import { ScoreRankingHeader } from "./components/ScoreRankingHeader.js";
import { ScoreRankingList } from "./components/ScoreRankingList.js";
// 排行榜显示数量配置 - 只显示前N名
const RANKING_DISPLAY_LIMIT = 50;

// 开发环境调试开关：设置为 true 时，即使不在小程序环境也会显示按钮（但不执行跳转）
const DEV_DEBUG_MODE = false;
function ScoreRankingContent() {
  const searchParams = useSearchParams();
  const grade = searchParams.get("grade");
  const schoolId = searchParams.get("schoolId");
  const studentId = searchParams.get("studentId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankingType, setRankingType] = useState("monthly");
  const [isMiniProgram, setIsMiniProgram] = useState(false);

  // 两种排行榜数据
  const [totalRankingData, setTotalRankingData] = useState([]);
  const [monthlyRankingData, setMonthlyRankingData] = useState([]);

  // 当前学生排名
  const [totalStudentRank, setTotalStudentRank] = useState(null);
  const [monthlyStudentRank, setMonthlyStudentRank] = useState(null);

  // 检测小程序环境
  useEffect(() => {
    const checkEnvironment = async () => {
      const isInMiniProgram = await isMiniProgramEnvironment();
      setIsMiniProgram(isInMiniProgram);
    };
    checkEnvironment();
  }, []);

  // 加载排行榜数据（只在页面加载时执行一次）
  useEffect(() => {
    const loadRankingData = async () => {
      if (!schoolId || !grade) {
        setError("缺少必要参数");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // 一次性获取两种排行榜数据和当前学生排名
        const result = await getBothScoreRankingsAction(schoolId, grade, studentId || undefined);
        if (result.success && result.data) {
          setTotalRankingData(result.data.totalRanking);
          setMonthlyRankingData(result.data.monthlyRanking);
          setTotalStudentRank(result.data.totalStudentRank);
          setMonthlyStudentRank(result.data.monthlyStudentRank);
        } else {
          setError(result.error || "加载排行榜数据失败");
        }
      } catch (err) {
        console.error("Error loading ranking data:", err);
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };
    loadRankingData();
  }, [schoolId, grade, studentId]);

  // 处理排行榜类型切换（纯前端切换，不重新请求数据）
  const handleRankingTypeChange = type => {
    setRankingType(type);
  };

  // 跳转到我的积分页面
  const handleGoToMyScore = () => {
    if (isMiniProgram) {
      navigateToMiniProgramPage({
        url: "/pages/cuoti/my/score/index/index"
      });
    } else if (DEV_DEBUG_MODE) {
      console.log("开发调试模式：跳转到小程序我的积分页面");
    }
  };

  // 获取当前显示的排行榜数据
  const currentRankingData = rankingType === "monthly" ? monthlyRankingData : totalRankingData;
  const currentStudentRank = rankingType === "monthly" ? monthlyStudentRank : totalStudentRank;
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
      <ScoreRankingHeader grade={grade} rankingType={rankingType} allRankingData={currentRankingData} onRankingTypeChange={handleRankingTypeChange} onGoToMyScore={handleGoToMyScore} showMyScoreButton={isMiniProgram || DEV_DEBUG_MODE} />

      {/* 排行榜列表 */}
      <ScoreRankingList rankingType={rankingType} displayRankingData={currentRankingData.slice(0, RANKING_DISPLAY_LIMIT)} allRankingData={currentRankingData} currentStudentRank={currentStudentRank} displayLimit={RANKING_DISPLAY_LIMIT} isMiniProgram={isMiniProgram} />

      {/* 底部安全区域 */}
      <div className="demo-safe-area-bottom" />
    </div>;
}
export default function ScoreRankingPage() {
  return <Suspense fallback={<div className="demo-mobile-container">
          <div className="demo-header">
            <h1 className="demo-header-title">积分排行榜</h1>
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
      <ScoreRankingContent />
    </Suspense>;
}
