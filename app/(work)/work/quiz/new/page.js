"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
// 创建新口述核心知识点页面，用于创建新的口述核心知识点
import { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.js";
import { Textarea } from "../../../../../components/ui/textarea.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../hooks/useAdminConfig.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { createQuizAction, getSchoolGradesAction } from "./actions.js";
export default function NewQuizPage() {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await createQuizAction({
        title: title.trim(),
        description: description.trim(),
        subject,
        grade: grade === "all" ? undefined : grade || undefined
      });
      if (result.success) {
        toast({
          title: "创建成功",
          description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}已成功创建`
        });
        router.push(`/work/quiz/list`);
      } else {
        toast({
          title: "创建失败",
          description: result.error || `创建${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}时发生错误`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`创建${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败:`, error);
      toast({
        title: "创建失败",
        description: `创建${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`创建新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`} showBackButton={true} backHref="/work/quiz/list" backText="返回列表" />

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

                {/* 提交按钮 */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push("/work/quiz/list")} disabled={isSubmitting}>
                    取消
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        创建中...
                      </> : <>
                        <Save className="h-4 w-4 mr-2" />
                        创建{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                      </>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 说明信息 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">创建说明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                •{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                创建后将处于&ldquo;未锁定&rdquo;状态，可以继续编辑和添加题目
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
