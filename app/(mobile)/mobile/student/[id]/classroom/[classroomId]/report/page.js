"use client";

// 学期综合报告页面，展示学生的学习进度、知识点掌握情况、错题统计等综合信息
import "./style.css";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { isMiniProgramEnvironment, navigateToMiniProgramPage, waitForWeixinJSBridge } from "../../../../../../../../lib/utils/minaJSSDK.js";
import { getStudentLatestMistakeBatchPdf } from "../../../../../../../../lib/utils/student.js";
import { getKnowledgePointErrorStats, getReportData } from "./actions.js";
import ErrorAnalysis from "./components/ErrorAnalysis.js";
import KnowledgePointErrorStats from "./components/KnowledgePointErrorStats.js";
import KnowledgePointsChart from "./components/KnowledgePointsChart.js";
import LearningProgressHeader from "./components/LearningProgressHeader.js";
import MistakeBatchCard from "./components/MistakeBatchCard.js";
import MistakePointsStats from "./components/MistakePointsStats.js";
import ReportFooter from "./components/ReportFooter.js";
// 调试用全局变量：设置为 true 时总是显示按钮
const DEBUG_SHOW_BUTTONS = false;

// 错题集下载页面的URL
const MISTAKE_BATCH_LIST_URL = "/pages/cuoti/others/downloadMistakeStudentPdf/downloadMistakeStudentPdf";

// 知识点错误统计显示数量
const KNOWLEDGE_POINT_ERROR_STATS_LIMIT = 10;
export default function StudentProgressReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.id;
  const classroomId = params.classroomId;
  const subject = searchParams.get("subject") || "";
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMiniProgram, setIsMiniProgram] = useState(false);
  const [mistakeBatchData, setMistakeBatchData] = useState(null);
  const [knowledgePointErrorStats, setKnowledgePointErrorStats] = useState([]);

  // 检测小程序环境
  useEffect(() => {
    const checkEnvironment = async () => {
      await waitForWeixinJSBridge();
      const isInMiniProgram = await isMiniProgramEnvironment();
      setIsMiniProgram(isInMiniProgram);
    };
    checkEnvironment();
  }, []);
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 检查必需参数
        if (!subject) {
          setError("缺少科目参数");
          return;
        }

        // 获取完整报告数据
        const data = await getReportData(studentId, classroomId, subject);
        if (!data) {
          setError("未找到该科目的学习数据");
          return;
        }
        setReportData(data);

        // 获取最近的错题集PDF记录（包含任务信息）
        const latestData = await getStudentLatestMistakeBatchPdf(studentId);
        setMistakeBatchData(latestData);

        // 获取知识点错误统计
        const errorStats = await getKnowledgePointErrorStats(studentId, classroomId, KNOWLEDGE_POINT_ERROR_STATS_LIMIT);
        setKnowledgePointErrorStats(errorStats);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };
    if (studentId && classroomId && subject) {
      loadData();
    }
  }, [studentId, classroomId, subject]);

  // 处理下载错题集PDF按钮点击
  const handleDownloadPdfClick = () => {
    if (isMiniProgram) {
      navigateToMiniProgramPage({
        url: MISTAKE_BATCH_LIST_URL
      });
    } else {
      console.log("在小程序中点击可跳转到错题集下载页面");
    }
  };
  if (loading) {
    return <div className="demo-mobile-container">
        <div className="demo-header">
          <h1 className="demo-header-title">学期综合报告</h1>
        </div>
        <div className="demo-content">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">加载中...</div>
          </div>
        </div>
        <div className="demo-safe-area-bottom" />
      </div>;
  }
  if (error) {
    return <div className="demo-mobile-container">
        <div className="demo-header">
          <h1 className="demo-header-title">学期综合报告</h1>
        </div>
        <div className="demo-content">
          <div className="flex items-center justify-center py-20">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
        <div className="demo-safe-area-bottom" />
      </div>;
  }
  if (!reportData) {
    return null;
  }
  return <div className="demo-mobile-container">
      {/* 顶部标题 */}
      <div className="demo-header mb-6">
        <h1 className="demo-header-title">学期综合报告</h1>
      </div>

      {/* 内容区域 */}
      <div className="demo-content">
        {/* 学习进度头部 */}
        <LearningProgressHeader data={reportData.headerData} studentId={studentId} classroomId={classroomId} />

        {/* 最近的错题集 */}
        <div className="mt-4">
          <MistakeBatchCard mistakeBatchData={mistakeBatchData} showButtons={DEBUG_SHOW_BUTTONS || isMiniProgram} onDownloadClick={handleDownloadPdfClick} />
        </div>

        {/* 知识点掌握情况图表 */}
        <div className="mt-4">
          <KnowledgePointsChart data={reportData.knowledgeCategoriesData} />
        </div>

        {/* 知识点错误统计 */}
        <div className="mt-4">
          <KnowledgePointErrorStats data={knowledgePointErrorStats} />
        </div>

        {/* 错误归因统计 */}
        <div className="mt-4">
          <MistakePointsStats mistakePointsStats={reportData.mistakePointsStats} />
        </div>

        {/* 错误归因雷达分析 */}
        <div className="mt-4">
          <ErrorAnalysis errorAnalysisPrompt={reportData.errorAnalysisPrompt} />
        </div>

        {/* 报告页脚 */}
        <ReportFooter schoolName={reportData.headerData.schoolName} analysisCompletedTime={Date.now()} />
      </div>

      {/* 底部安全区域 */}
      <div className="demo-safe-area-bottom" />
    </div>;
}
