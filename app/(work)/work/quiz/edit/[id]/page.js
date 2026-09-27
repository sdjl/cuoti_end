"use client";

import { Loader2, Save, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 编辑口述核心知识点页面，用于修改口述核心知识点的基本信息
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Switch } from "../../../../../../components/ui/switch.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getQuizAction, getSchoolGradesAction, updateQuizAction } from "./actions.js";
import DateTimePicker from "./components/DateTimePicker.js";
export default function EditQuizPage() {
  const params = useParams();
  const quizId = params.id;
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();

  // 表单状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [teamEnabled, setTeamEnabled] = useState(false);
  const [teamMaxSize, setTeamMaxSize] = useState(5);
  const [teamEndTime, setTeamEndTime] = useState(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 年级列表
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取年级列表
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setGradesLoading(true);
        const gradesList = await getSchoolGradesAction();
        setGrades(gradesList);
      } catch (error) {
        console.error("获取年级列表失败:", error);
        toast({
          title: "获取年级失败",
          description: "获取年级列表时发生错误",
          variant: "destructive"
        });
      } finally {
        setGradesLoading(false);
      }
    };
    fetchGrades();
  }, [toast]);

  // 获取口述核心知识点数据
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const quiz = await getQuizAction(quizId);
        if (!quiz) {
          toast({
            title: "获取失败",
            description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}不存在或无权限访问`,
            variant: "destructive"
          });
          router.push("/work/quiz/list");
          return;
        }
        setTitle(quiz.title);
        setDescription(quiz.description || "");
        setSubject(quiz.subject);
        setGrade(quiz.grade || "all");
        setTeamEnabled(quiz.teamEnabled || false);
        setTeamMaxSize(quiz.teamMaxSize || 5);
        setTeamEndTime(quiz.teamEndTime);
      } catch (error) {
        console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据失败:`, error);
        toast({
          title: "获取失败",
          description: `获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据时发生错误`,
          variant: "destructive"
        });
        router.push("/work/quiz/list");
      } finally {
        setIsLoading(false);
      }
    };
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, toast, router]);

  // 处理表单提交
  const handleSubmit = async e => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "请输入标题",
        description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}标题不能为空`,
        variant: "destructive"
      });
      return;
    }
    if (!subject) {
      toast({
        title: "请选择科目",
        description: `请选择${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}科目`,
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateQuizAction(quizId, {
        title: title.trim(),
        description: description.trim(),
        subject,
        grade: grade === "all" ? undefined : grade || undefined,
        teamEnabled,
        teamMaxSize,
        teamEndTime
      });
      if (result.success) {
        toast({
          title: "更新成功",
          description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}已成功更新`
        });
        router.push("/work/quiz/list");
      } else {
        toast({
          title: "更新失败",
          description: result.error || `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}时发生错误`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败:`, error);
      toast({
        title: "更新失败",
        description: `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`编辑${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`} showBackButton={true} backHref="/work/quiz/list" backText="返回列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">加载中...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`编辑${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`} showBackButton={true} backHref="/work/quiz/list" backText="返回列表" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}标题{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}标题`} disabled={isSubmitting} required />
                </div>

                {/* 描述 */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}描述
                  </Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}描述（可选）`} disabled={isSubmitting} rows={3} />
                </div>

                {/* 科目 */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    科目 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={subject} onValueChange={setSubject} disabled={isSubmitting || subjectsLoading} required>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      {!subjectsLoading && subjects.map(subjectOption => <SelectItem key={subjectOption.name} value={subjectOption.name}>
                            {subjectOption.name}
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* 年级 */}
                <div className="space-y-2">
                  <Label htmlFor="grade">年级</Label>
                  <Select value={grade} onValueChange={setGrade} disabled={isSubmitting || gradesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择年级（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">不限年级</SelectItem>
                      {!gradesLoading && grades.map(gradeOption => <SelectItem key={gradeOption} value={gradeOption}>
                            {gradeOption}
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {gradesLoading && <p className="text-sm text-gray-500">加载年级列表中...</p>}
                </div>

                {/* 分隔线 */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">组队功能设置</h3>
                  </div>

                  {/* 组队功能开关 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="team-enabled" className="text-sm font-medium">
                          开启组队PK功能
                        </Label>
                        <p className="text-sm text-gray-500">
                          开启后学生可以创建队伍参与
                          {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                        </p>
                      </div>
                      <Switch id="team-enabled" checked={teamEnabled} onCheckedChange={setTeamEnabled} disabled={isSubmitting} />
                    </div>

                    {/* 队伍人数上限 - 只有在开启组队功能时才显示 */}
                    {teamEnabled && <>
                        <div className="space-y-2">
                          <Label htmlFor="team-max-size">队伍人数上限</Label>
                          <div className="flex items-center space-x-2">
                            <Select value={teamMaxSize.toString()} onValueChange={value => setTeamMaxSize(parseInt(value))} disabled={isSubmitting}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => <SelectItem key={size} value={size.toString()}>
                                    {size}人
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-500">
                              每个队伍最多人数
                            </span>
                          </div>
                        </div>

                        {/* 活动结束时间 */}
                        <div className="space-y-2">
                          <Label>活动结束时间</Label>
                          <DateTimePicker value={teamEndTime} onChange={setTeamEndTime} disabled={isSubmitting} placeholder="选择活动结束时间（可选）" />
                          <p className="text-sm text-gray-500">
                            设置组队活动的结束时间，超过此时间后将无法继续组队
                          </p>
                        </div>
                      </>}
                  </div>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push("/work/quiz/list")} disabled={isSubmitting}>
                    取消
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        更新中...
                      </> : <>
                        <Save className="h-4 w-4 mr-2" />
                        更新{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                      </>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 说明信息 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">编辑说明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • 可以随时编辑{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}的基本信息
              </li>
              <li>
                • 锁定{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}后，学生才能开始参与
                {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
              </li>
              <li>
                • 锁定后的{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                无法删除或修改题目，但可以修改基本信息
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>;
}
