"use client";

import { ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";
// 年级错题排行榜页面，展示当前校园所有年级列表，点击年级可查看该年级学生的错题排名情况
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";

// 导入年级列表相关的函数
import { getCurrentSchoolGrades } from "../../../../../../lib/work/teacher/mySchool.js";
export default function GradeRankingPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);

  // 加载年级列表
  const loadGrades = useCallback(async () => {
    setLoading(true);
    try {
      const gradeList = await getCurrentSchoolGrades();
      setGrades(gradeList);
    } catch (error) {
      console.error("加载年级列表失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载年级列表",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      loadGrades();
    }
  }, [user, loadGrades]);

  // 处理年级按钮点击
  const handleGradeClick = gradeName => {
    // 使用新窗口打开移动端页面，并传递年级名称和校园ID作为URL参数
    const schoolId = user?.workSetting?.currentSchool?._id;
    if (!schoolId) {
      toast({
        title: "错误",
        description: "当前校园信息不完整",
        variant: "destructive"
      });
      return;
    }
    const url = `/mobile/schoolNotice/mistakeRanking?grade=${encodeURIComponent(gradeName)}&schoolId=${encodeURIComponent(schoolId)}`;
    window.open(url, "_blank");
  };
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`年级${DISPLAY_TEXT.COURSE_MISTAKE}排行榜`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载年级数据中...</p>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={`年级${DISPLAY_TEXT.COURSE_MISTAKE}排行榜`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl">
          {/* 页面说明 */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              年级{DISPLAY_TEXT.COURSE_MISTAKE}排行榜
            </h2>
            <p className="text-gray-600 text-sm">
              选择年级查看该年级所有学生的{DISPLAY_TEXT.COURSE_MISTAKE}
              排名情况，了解学生的学习进度和掌握程度。
            </p>
          </div>

          {/* 年级列表 */}
          {grades.length > 0 ? <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                请选择年级
              </h3>

              {/* 年级按钮网格 - 一行4个 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {grades.map((grade, index) => <Button key={`grade-${index}`} variant="outline" className="h-16 text-base font-medium hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-between group" onClick={() => handleGradeClick(grade)}>
                    <span className="flex-1 text-center">{grade}</span>
                    <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>)}
              </div>

              {/* 总计显示 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  共 {grades.length} 个年级
                </p>
              </div>
            </div> : (/* 空状态 */
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                暂无年级数据
              </h3>
              <p className="text-gray-500 mb-6">
                当前校园还没有设置年级信息，请先到设置页面添加年级。
              </p>
              <Button variant="outline" onClick={() => router.push("/work/setting/grade-list")}>
                前往设置年级
              </Button>
            </div>)}
        </div>
      </main>
    </div>;
}
