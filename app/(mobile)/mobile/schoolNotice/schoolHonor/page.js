"use client";

// 全校荣誉榜页面，展示学校所有学生的荣誉记录
import "./style.css";
import { AlertCircle, Award, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { dayCN } from "../../../../../lib/common/time.js";
import { isMiniProgramEnvironment, navigateToMiniProgramPage, waitForWeixinJSBridge } from "../../../../../lib/utils/minaJSSDK.js";
import { getSchoolHonorRecordsAction } from "./actions.js";
// 开发环境调试开关：设置为 true 时，即使不在小程序环境也会显示按钮（但不执行跳转）
const DEV_DEBUG_MODE = false;
function SchoolHonorContent() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [isMiniProgram, setIsMiniProgram] = useState(false);

  // 检测小程序环境
  useEffect(() => {
    const checkEnvironment = async () => {
      await waitForWeixinJSBridge();
      const isInMiniProgram = await isMiniProgramEnvironment();
      setIsMiniProgram(isInMiniProgram);
    };
    checkEnvironment();
  }, []);

  // 获取荣誉记录数据
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolId) {
        setError("缺少校园ID参数");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const result = await getSchoolHonorRecordsAction(schoolId);
        if (result.success) {
          setRecords(result.data);
        } else {
          setError(result.error || "获取数据失败");
        }
      } catch (err) {
        console.error("获取全校荣誉记录失败:", err);
        setError("获取数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolId]);

  // 处理查看我的荣誉按钮点击
  const handleViewMyHonor = () => {
    if (isMiniProgram) {
      navigateToMiniProgramPage({
        url: "/pages/cuoti/my/score/honorLog/honorLog"
      });
    } else if (DEV_DEBUG_MODE) {
      console.log("开发调试模式：跳转到小程序荣誉页面");
    }
  };

  // 判断是否显示按钮
  const showMyHonorButton = isMiniProgram || DEV_DEBUG_MODE;
  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h3 className="text-center text-lg font-medium text-gray-900 mb-2">
            加载失败
          </h3>
          <p className="text-center text-gray-600">{error}</p>
        </div>
      </div>;
  }
  return <div className="demo-mobile-container">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white pt-12 pb-6 shadow-lg">
        <div className="px-4">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">全校荣誉榜</h1>
          </div>
          <p className="text-center text-white/90 text-sm">
            优秀学子风采展示，榜样力量
          </p>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-blue-600">
                {records.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">荣誉人次</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center h-8">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">学业荣誉</div>
            </div>
          </div>

          {/* 查看我的荣誉按钮 */}
          {showMyHonorButton && <div className="mt-4 pt-4 border-t border-gray-200">
              <button onClick={handleViewMyHonor} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                查看我的荣誉
              </button>
            </div>}
        </div>
      </div>

      {/* 荣誉记录列表 */}
      <div className="px-4 pb-8">
        {records.length === 0 ? <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-8 text-center">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">暂无荣誉记录</p>
            </div>
          </div> : <div className="space-y-3">
            <div className="text-xs text-gray-500 px-2">
              最近{records.length}条荣誉记录
            </div>
            {records.map(record => {
          // 判断是否有有效的分数（不是空字符串且不是 undefined）
          const hasValidScore = record.examScore !== undefined && record.examScore !== null && String(record.examScore).trim() !== "";

          // 判断是否有有效的科目（不是空字符串且不是 undefined）
          const hasValidSubject = record.subject !== undefined && record.subject !== null && String(record.subject).trim() !== "";

          // 判断是否有老师评语
          const hasTeacherRemark = record.teacherRemark !== undefined && record.teacherRemark !== null && String(record.teacherRemark).trim() !== "";

          // 判断是否有考试名称
          const hasExamName = record.examName !== undefined && record.examName !== null && String(record.examName).trim() !== "";
          return <div key={record._id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4">
                    {/* 荣誉名称 */}
                    <div className="flex items-center mb-3">
                      <Award className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-base text-gray-900 font-semibold">
                          {record.honorName}
                        </div>
                        {/* 如果有考试成绩或科目，显示 */}
                        {(hasValidScore || hasValidSubject) && <div className="text-xs text-blue-600 mt-1">
                            {hasValidSubject && record.subject}
                            {hasValidSubject && hasValidScore && " · "}
                            {hasValidScore && `${record.examScore}分`}
                          </div>}
                      </div>
                    </div>

                    {/* 获奖学生信息 */}
                    <div className="text-sm text-gray-600 mb-2">
                      恭喜 {record.studentName} 同学
                      {hasExamName && `在 ${record.examName} 中`}
                      获得 {record.honorName}
                    </div>

                    {/* 老师评语 */}
                    {hasTeacherRemark && <div className="bg-blue-50 rounded-lg p-3 mb-2">
                        <div className="text-xs text-blue-800 font-medium mb-1">
                          老师评语
                        </div>
                        <div className="text-sm text-gray-700">
                          {record.teacherRemark}
                        </div>
                      </div>}

                    {/* 获奖日期 */}
                    <div className="text-xs text-gray-500">
                      获奖日期：{dayCN(new Date(record.created))}
                    </div>
                  </div>
                </div>;
        })}
          </div>}
      </div>
    </div>;
}
export default function SchoolHonorPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>}>
      <SchoolHonorContent />
    </Suspense>;
}
