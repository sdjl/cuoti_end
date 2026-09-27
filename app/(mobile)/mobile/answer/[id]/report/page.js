"use client";

// 答卷分析报告页面，展示学生的答卷分析结果，包括知识点掌握、错误归因和错题详情
import "./style.css";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { isMiniProgramEnvironment, navigateToMiniProgramPage, waitForWeixinJSBridge } from "../../../../../../lib/utils/minaJSSDK.js";
import { getStudentLatestMistakeBatchPdf, validateStudentPassword } from "../../../../../../lib/utils/student.js";
import { getAnswerItemsMapping, getReportData, recordReportView } from "./actions.js";
import AIDiagnosisCard from "./components/AIDiagnosisCard.js";
import GlassHeaderCard from "./components/HeaderCard.js";
import KnowledgePointsCard from "./components/KnowledgePointsCard.js";
import MistakeBatchCard from "./components/MistakeBatchCard.js";
import MistakePointsCard from "./components/MistakePointsCard.js";
import QuestionDetailCard from "./components/QuestionDetailCard.js";
import ReportFooter from "./components/ReportFooter.js";
import ScrollControlButton from "./components/ScrollControlButton.js";
// 调试用全局变量：设置为 true 时总是显示学生操作按钮
const DEBUG_SHOW_REDO_BUTTON = false;

// 错题集下载页面的URL
const MISTAKE_BATCH_LIST_URL = "/pages/cuoti/others/downloadMistakeStudentPdf/downloadMistakeStudentPdf";

// 每个题目最多可以选择的错误归因数量
const MAX_MISTAKE_POINTS_PER_QUESTION = 3;
export default function ReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentAnswerId = params.id;
  const password = searchParams.get("password") || "";
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMiniProgram, setIsMiniProgram] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [answerItemsMap, setAnswerItemsMap] = useState(new Map());
  const [mistakeBatchData, setMistakeBatchData] = useState(null);

  // 检测小程序环境
  useEffect(() => {
    const checkEnvironment = async () => {
      // 等待 WeixinJSBridge 准备就绪
      await waitForWeixinJSBridge();

      // 检测是否在小程序环境中
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

        // 获取完整报告数据
        const data = await getReportData(studentAnswerId);
        if (!data) {
          setError("未找到答卷数据");
          return;
        }
        setReportData(data);

        // 验证是否是学生本人
        if (password && data.studentId) {
          const isValidPassword = await validateStudentPassword(data.studentId, password);
          setIsStudent(isValidPassword);
        }

        // 获取答题记录的映射关系
        const answerItemMapping = await getAnswerItemsMapping(studentAnswerId);
        setAnswerItemsMap(answerItemMapping);

        // 获取最近的错题集PDF记录（包含任务信息）
        const latestData = await getStudentLatestMistakeBatchPdf(data.studentId);
        setMistakeBatchData(latestData);

        // 如果是小程序环境，记录查看行为
        if (isMiniProgram) {
          await recordReportView(studentAnswerId);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };
    if (studentAnswerId) {
      loadData();
    }
  }, [studentAnswerId, isMiniProgram, password]);

  // 处理错题再练按钮点击（AI及时答疑）
  const handleRedoClick = answerItemId => {
    if (!answerItemId) {
      console.error("错题记录ID不存在");
      return;
    }
    if (isMiniProgram) {
      // 使用工具函数跳转到小程序页面
      navigateToMiniProgramPage({
        url: `/pages/cuoti/redo/aiChat/aiChat?answerItemId=${answerItemId}`
      });
    } else {
      // 在普通浏览器中，可以显示提示或执行其他操作
      console.log("在小程序中点击可跳转到错题再练页面:", answerItemId);
    }
  };

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
          <h1 className="demo-header-title">答卷分析报告</h1>
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
          <h1 className="demo-header-title">答卷分析报告</h1>
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
      <div className="demo-header">
        <h1 className="demo-header-title">答卷分析报告</h1>
      </div>

      {/* 玻璃拟态风格头部 */}
      <div className="glass-header-container">
        <GlassHeaderCard data={reportData.header} />
      </div>

      {/* 内容区域 */}
      <div className="demo-content">
        {/* 最近的错题集 */}
        <div data-section="mistake-batch" className="mb-6">
          <MistakeBatchCard mistakeBatchData={mistakeBatchData} showButtons={DEBUG_SHOW_REDO_BUTTON || isMiniProgram} onDownloadClick={handleDownloadPdfClick} />
        </div>

        {/* 知识点掌握情况 */}
        <div data-section="knowledge-points">
          <KnowledgePointsCard data={reportData.knowledgePoints} />
        </div>

        {/* 错误归因分析 */}
        <div data-section="mistake-points">
          <MistakePointsCard data={reportData.mistakePoints} />
        </div>

        {/* 错题详情 */}
        {reportData.wrongQuestions.map((question, index) => {
        const answerItemId = answerItemsMap.get(question._id);
        const showRedoButton = DEBUG_SHOW_REDO_BUTTON || isMiniProgram;
        const canEditMistakePoints = DEBUG_SHOW_REDO_BUTTON || isStudent;
        return <div key={question._id} data-section="question-detail">
              <QuestionDetailCard question={question} classCorrectRate={question.classCorrectRate} questionIndex={index + 1} studentAnswerImage={question.studentAnswerImage} isCorrectedByMistakeAgain={question.isCorrectedByMistakeAgain} redoImage={question.redoImage} showRedoButton={showRedoButton} answerItemId={answerItemId} onRedoClick={handleRedoClick} canEditMistakePoints={canEditMistakePoints} studentId={reportData.studentId} classId={reportData.classId} courseId={reportData.courseId} questionPackId={reportData.questionPackId} type={reportData.type} subject={reportData.subject} maxMistakePoints={MAX_MISTAKE_POINTS_PER_QUESTION} />
            </div>;
      })}

        {/* AI综合诊断 */}
        {reportData.aiDiagnosis && <div data-section="ai-diagnosis">
            <AIDiagnosisCard aiDiagnosis={reportData.aiDiagnosis} />
          </div>}

        {/* 报告页脚 */}
        <ReportFooter schoolName={reportData.header.schoolName} analysisCompletedTime={reportData.analysisCompletedTime} />
      </div>

      {/* 底部安全区域 */}
      <div className="demo-safe-area-bottom" />

      {/* 浮动滚动控制按钮 */}
      <ScrollControlButton wrongQuestionsCount={reportData.wrongQuestions.length} />
    </div>;
}
