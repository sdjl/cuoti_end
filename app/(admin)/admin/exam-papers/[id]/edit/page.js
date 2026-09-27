"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// 试卷编辑页面，用于修改试卷的基本信息（标题、描述、备注等）
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { getExamPaperById, updateExamPaper } from "../../../../../../lib/collection/examPaper.js";
export default function EditExamPaperPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.id;
  const fromPage = searchParams.get("from_page") || "1";
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    notes: ""
  });

  // 获取试卷数据
  useEffect(() => {
    const fetchExamPaper = async () => {
      setIsLoading(true);
      try {
        const paper = await getExamPaperById(examId);
        if (paper) {
          setFormData({
            title: paper.title,
            subject: paper.subject,
            description: paper.description || "",
            notes: paper.notes || ""
          });
        } else {
          toast({
            title: "获取试卷失败",
            description: "找不到试卷数据",
            variant: "destructive"
          });
          router.push("/admin/exam-papers");
        }
      } catch (error) {
        console.error("获取试卷数据失败:", error);
        toast({
          title: "获取试卷失败",
          description: "加载试卷数据时出错",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamPaper();
  }, [examId, router, toast]);

  // 表单变更处理
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 表单提交处理
  const handleSubmit = async e => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.title) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      // 准备更新数据
      const updateData = {
        title: formData.title,
        description: formData.description,
        notes: formData.notes
      };

      // 提交到服务器
      const success = await updateExamPaper(examId, updateData);
      if (success) {
        toast({
          title: "更新成功",
          description: "试卷信息已成功更新"
        });

        // 更新成功后返回列表页
        setTimeout(() => {
          router.push(`/admin/exam-papers?page=${fromPage}`);
        }, 1000);
      } else {
        toast({
          title: "更新失败",
          description: "试卷信息更新失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新试卷错误:", error);
      toast({
        title: "更新错误",
        description: "更新过程中发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>加载试卷数据中...</span>
      </div>;
  }
  return <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                请修改试卷信息，标题为必填项，科目不可修改
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">试卷标题 *</Label>
                <Input id="title" name="title" placeholder="请输入试卷标题" value={formData.title} onChange={handleChange} required disabled={isSaving} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">科目 (不可修改)</Label>
                <Input id="subject" name="subject" value={formData.subject} disabled={true} className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea id="description" name="description" placeholder="请输入试卷描述（选填）" value={formData.description} onChange={handleChange} rows={3} disabled={isSaving} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea id="notes" name="notes" placeholder="请输入备注信息（选填）" value={formData.notes} onChange={handleChange} rows={3} disabled={isSaving} />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="outline" onClick={() => router.push(`/admin/exam-papers?page=${fromPage}`)} disabled={isSaving}>
                取消
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </> : "保存修改"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>;
}
