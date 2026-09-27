"use client";

import { BookMarked, BookOpen, GraduationCap, School, UserCheck, Users, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
// 校园首页，展示校园基本信息和各项统计数据
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar.js";
import { Badge } from "../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card.js";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useAuth } from "../../../../hooks/useAuth.js";
import { getCurrentSchool, getCurrentUserInfo, getSchoolStats } from "./actions.js";
import { getStudentGroupCount } from "./studentGroup/actions.js";
export default function SchoolPage() {
  const [currentSchool, setCurrentSchool] = useState(null);
  const [schoolStats, setSchoolStats] = useState({
    teacherCount: 0,
    classroomCount: 0,
    studentCount: 0,
    courseCount: 0,
    studentGroupCount: 0
  });
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const {
    toast
  } = useToast();
  useAuth();
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 获取当前学校
        const school = await getCurrentSchool();
        if (!school) {
          router.push("/work/setting/curr-school");
          return;
        }
        setCurrentSchool(school);

        // 获取学校统计数据
        const stats = await getSchoolStats();

        // 获取学生分组数量
        const studentGroupCount = await getStudentGroupCount();
        setSchoolStats({
          ...stats,
          studentGroupCount
        });

        // 获取当前用户信息
        const userInfo = await getCurrentUserInfo();
        setCurrentUserInfo(userInfo);
      } catch (error) {
        console.error("加载数据失败:", error);
        toast({
          title: "错误",
          description: "加载数据失败，请稍后重试",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router, toast]);
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <WorkHeader title="我的校园" />

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </main>
      </div>;
  }
  if (!currentSchool) {
    return null;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="我的校园" />

      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-6">
          {/* 学校信息卡片 - 左对齐，较小宽度 */}
          <div className="w-full max-w-md">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <School className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl text-blue-900">
                      {currentSchool.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {currentSchool.status}
                      </Badge>
                      {currentUserInfo?.isPrincipal && <Badge variant="default" className="bg-purple-600">
                          校长权限
                        </Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>区域：</strong>
                    {currentSchool.region}
                  </div>
                  {currentSchool.address && <div>
                      <strong>地址：</strong>
                      {currentSchool.address}
                    </div>}
                  {currentSchool.phone && <div>
                      <strong>联系电话：</strong>
                      {currentSchool.phone}
                    </div>}
                  {currentSchool.description && <div className="md:col-span-2">
                      <strong>学校描述：</strong>
                      {currentSchool.description}
                    </div>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 统计卡片网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 老师统计 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500" onClick={() => router.push("/work/school/teacher")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">教师总数</CardTitle>
                <GraduationCap className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {schoolStats.teacherCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击查看教师列表
                </p>
              </CardContent>
            </Card>

            {/* 班级统计 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500" onClick={() => router.push("/work/school/classroom")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">班级总数</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  {schoolStats.classroomCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击查看班级列表
                </p>
              </CardContent>
            </Card>

            {/* 学生统计 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-orange-500" onClick={() => router.push("/work/school/student")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">学生总数</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">
                  {schoolStats.studentCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击查看学生列表
                </p>
              </CardContent>
            </Card>

            {/* 课程统计 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500" onClick={() => router.push("/work/school/course")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">课程总数</CardTitle>
                <BookMarked className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                  {schoolStats.courseCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击查看课程列表
                </p>
              </CardContent>
            </Card>

            {/* 学生分组管理 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-cyan-500" onClick={() => router.push("/work/school/studentGroup")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  学生分组管理
                </CardTitle>
                <UsersRound className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-700">
                  {schoolStats.studentGroupCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击管理学生分组
                </p>
              </CardContent>
            </Card>

            {/* 学生分组对比 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-teal-500" onClick={() => router.push("/work/school/studentGroup/comparison")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  学生分组对比
                </CardTitle>
                <UsersRound className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-700">
                  {schoolStats.studentGroupCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击查看分组对比
                </p>
              </CardContent>
            </Card>

            {/* 当前用户信息 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-gray-500" onClick={() => router.push("/work/setting/my-info")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">我的信息</CardTitle>
                <UserCheck className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUserInfo?.userWxInfo.headimgurl} alt="用户头像" />
                    <AvatarFallback>
                      {currentUserInfo?.userInfo.name?.slice(0, 1) || currentUserInfo?.userWxInfo.nickname?.slice(0, 1) || "用"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {currentUserInfo?.userInfo.name || currentUserInfo?.userWxInfo.nickname || "未设置姓名"}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  点击查看个人信息
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>;
}
