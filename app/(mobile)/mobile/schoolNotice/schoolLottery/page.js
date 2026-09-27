"use client";

// 全校中奖记录页面，展示学校所有学生的积分抽奖中奖记录
import "./style.css";
import { AlertCircle, Gift, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { dayCN } from "../../../../../lib/common/time.js";
import { isMiniProgramEnvironment, navigateToMiniProgramPage, waitForWeixinJSBridge } from "../../../../../lib/utils/minaJSSDK.js";
import { getSchoolLotteryRecordsAction } from "./actions.js";
// 开发环境调试开关：设置为 true 时，即使不在小程序环境也会显示按钮（但不执行跳转）
const DEV_DEBUG_MODE = true;
function SchoolLotteryContent() {
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

  // 获取中奖记录数据
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
        const result = await getSchoolLotteryRecordsAction(schoolId);
        if (result.success) {
          setRecords(result.data);
        } else {
          setError(result.error || "获取数据失败");
        }
      } catch (err) {
        console.error("获取全校中奖记录失败:", err);
        setError("获取数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolId]);

  // 处理查看我的抽奖按钮点击
  const handleViewMyLottery = () => {
    if (isMiniProgram) {
      navigateToMiniProgramPage({
        url: "/pages/cuoti/my/score/lottery/lottery"
      });
    } else if (DEV_DEBUG_MODE) {
      console.log("开发调试模式：跳转到小程序抽奖页面");
    }
  };

  // 判断是否显示按钮
  const showMyLotteryButton = isMiniProgram || DEV_DEBUG_MODE;
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
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white pt-12 pb-6 shadow-lg">
        <div className="px-4">
          <div className="flex items-center justify-center mb-2">
            <Gift className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">全校中奖记录</h1>
          </div>
          <p className="text-center text-white/90 text-sm">
            恭喜以下同学中奖，再接再厉！
          </p>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-orange-600">
                {records.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">中奖人次</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center h-8">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">积分抽奖</div>
            </div>
          </div>

          {/* 去抽奖按钮 */}
          {showMyLotteryButton && <div className="mt-4 pt-4 border-t border-gray-200">
              <button onClick={handleViewMyLottery} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                去抽奖
              </button>
            </div>}
        </div>
      </div>

      {/* 中奖记录列表 */}
      <div className="px-4 pb-8">
        {records.length === 0 ? <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-8 text-center">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">暂无中奖记录</p>
            </div>
          </div> : <div className="space-y-3">
            <div className="text-xs text-gray-500 px-2">
              最近{records.length}条中奖记录
            </div>
            {records.map(record => <div key={record._id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  {/* 奖品名称 */}
                  <div className="flex items-center mb-3">
                    <Gift className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" />
                    <div className="text-base text-gray-900 font-semibold truncate">
                      {record.prizeName}
                    </div>
                  </div>

                  {/* 中奖学生信息 */}
                  <div className="text-sm text-gray-600 mb-2">
                    恭喜 {record.className} 的 {record.studentName} 同学
                  </div>

                  {/* 中奖日期 */}
                  <div className="text-xs text-gray-500">
                    中奖日期：{dayCN(new Date(record.created))}
                  </div>
                </div>
              </div>)}
          </div>}
      </div>
    </div>;
}
export default function SchoolLotteryPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>}>
      <SchoolLotteryContent />
    </Suspense>;
}
