"use client";

import { ChevronLeft, ChevronRight, Copy, ExternalLink, FileText, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog.js";
import { Button } from "../../ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.js";
import { useToast } from "../../../hooks/use-toast.js";
import { deleteQuestion, getExamPaper, insertEmptyQuestion } from "./actions.js";

// 每页显示的最大页码数
const MAX_PAGE_BUTTONS = 12;
// 翻页按钮组件
function PageButtons({
  currentPage,
  totalPages,
  setCurrentPage
}) {
  if (!totalPages) return null;

  // 如果总页数小于等于最大显示页码数，直接显示所有页码
  if (totalPages <= MAX_PAGE_BUTTONS) {
    return <div className="flex items-center space-x-2">
        {Array.from({
        length: totalPages
      }, (_, i) => i + 1).map(page => <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="w-8 h-8 p-0">
            {page}
          </Button>)}
      </div>;
  }

  // 如果总页数大于最大显示页码数，显示下拉选择框
  return <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={currentPage.toString()} onValueChange={value => setCurrentPage(parseInt(value))}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="页码" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({
          length: totalPages
        }, (_, i) => i + 1).map(page => <SelectItem key={page} value={page.toString()}>
              第 {page} 页
            </SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>;
}
export default function ExamPaperQuestions({
  examPaper: initialExamPaper,
  initialPage = 1,
  onPageChange,
  fromExamPage
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const {
    toast
  } = useToast();

  // 操作状态
  const [insertingBefore, setInsertingBefore] = useState(null);
  const [insertingAfter, setInsertingAfter] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [examPaper, setExamPaper] = useState(initialExamPaper);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  // 更新examPaper状态当initialExamPaper改变时
  useEffect(() => {
    setExamPaper(initialExamPaper);
  }, [initialExamPaper]);

  // 获取当前显示的页面
  const currentPageData = examPaper?.pages?.find(page => page.pageNumber === currentPage);

  // 总页数
  const totalPages = examPaper?.pages?.length || 0;

  // 更新currentPage的处理函数
  const handlePageChange = page => {
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // 复制图片链接到剪贴板
  const copyImageUrl = url => {
    navigator.clipboard.writeText(url);
    toast({
      title: "成功",
      description: "图片链接已复制到剪贴板"
    });
  };

  // 在新窗口中打开图片
  const openImageInNewTab = url => {
    window.open(url, "_blank");
  };

  // 刷新试卷数据
  const refreshExamPaper = async () => {
    const updatedExamPaper = await getExamPaper(examPaper._id);
    if (updatedExamPaper) {
      setExamPaper(updatedExamPaper);
    }
  };

  // 在题目前插入空白题目
  const handleInsertBeforeQuestion = async (pageNumber, questionNumber) => {
    const questionId = `${pageNumber}_${questionNumber}`;
    setInsertingBefore(questionId);
    try {
      const result = await insertEmptyQuestion(examPaper._id, pageNumber, questionNumber, false);
      if (result) {
        // 刷新试卷数据
        await refreshExamPaper();
        toast({
          title: "成功",
          description: "题目已插入"
        });
      } else {
        toast({
          title: "失败",
          description: "题目插入失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `插入失败: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setInsertingBefore(null);
    }
  };

  // 在题目后插入空白题目
  const handleInsertAfterQuestion = async (pageNumber, questionNumber) => {
    const questionId = `${pageNumber}_${questionNumber}`;
    setInsertingAfter(questionId);
    try {
      const result = await insertEmptyQuestion(examPaper._id, pageNumber, questionNumber, true);
      if (result) {
        // 刷新试卷数据
        await refreshExamPaper();
        toast({
          title: "成功",
          description: "题目已插入"
        });
      } else {
        toast({
          title: "失败",
          description: "题目插入失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `插入失败: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setInsertingAfter(null);
    }
  };

  // 删除题目
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    const questionId = `${questionToDelete.pageNumber}_${questionToDelete.questionNumber}`;
    setDeleting(questionId);
    try {
      const result = await deleteQuestion(examPaper._id, questionToDelete.pageNumber, questionToDelete.questionNumber);
      if (result) {
        // 刷新试卷数据
        await refreshExamPaper();
        toast({
          title: "成功",
          description: "题目已删除"
        });
      } else {
        toast({
          title: "失败",
          description: "题目删除失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `删除失败: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setQuestionToDelete(null);
      setDeleting(null);
    }
  };

  // 打开删除确认对话框
  const openDeleteConfirm = (pageNumber, questionNumber) => {
    setQuestionToDelete({
      pageNumber,
      questionNumber
    });
    setDeleteConfirmOpen(true);
  };

  // 在修改内容和修改坐标按钮中使用正确的分页参数
  const getEditUrl = (type, questionPageNumber, questionNumber) => {
    // 构建基础 URL
    let url = `/admin/exam-papers/${examPaper._id}/questions/${questionPageNumber}/${questionNumber}/`;

    // 根据类型添加路径
    url += type === "content" ? "edit-content" : "edit-image";

    // 添加查询参数
    const params = new URLSearchParams();
    console.log("fromExamPage", fromExamPage);
    if (fromExamPage) {
      params.set("from_exam_page", fromExamPage.toString());
    }
    params.set("from_question_page", currentPage.toString());
    return `${url}?${params.toString()}`;
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>
            本页识别题目 ({currentPageData?.questions?.length || 0}个)
          </span>
          <div className="flex items-center space-x-2">
            <PageButtons currentPage={currentPage} totalPages={totalPages} setCurrentPage={handlePageChange} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {/* 题目列表 */}
          {currentPageData?.questions?.length ? <div className="space-y-6 w-full">
              {currentPageData.questions.map((question, index) => <div key={index} className="border rounded-md p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-md font-medium">
                          题目 {question.questionNumber}
                        </h4>
                        {question.questionType && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {question.questionType}
                          </span>}
                        {question.difficulty && <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${question.difficulty === "容易" ? "bg-green-100 text-green-800" : question.difficulty === "中等" ? "bg-yellow-100 text-yellow-800" : question.difficulty === "困难" ? "bg-orange-100 text-orange-800" : question.difficulty === "超难" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                            {question.difficulty}
                          </span>}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleInsertBeforeQuestion(currentPageData.pageNumber, question.questionNumber)} disabled={insertingBefore === `${currentPageData.pageNumber}_${question.questionNumber}` || examPaper.isLocked} title={examPaper.isLocked ? "试卷已锁定，无法插入题目" : "在此题目前插入新题目"}>
                          {insertingBefore === `${currentPageData.pageNumber}_${question.questionNumber}` ? <>
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              插入中...
                            </> : <>
                              <PlusCircle className="h-3.5 w-3.5 mr-1" />
                              上插入
                            </>}
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleInsertAfterQuestion(currentPageData.pageNumber, question.questionNumber)} disabled={insertingAfter === `${currentPageData.pageNumber}_${question.questionNumber}` || examPaper.isLocked} title={examPaper.isLocked ? "试卷已锁定，无法插入题目" : "在此题目后插入新题目"}>
                          {insertingAfter === `${currentPageData.pageNumber}_${question.questionNumber}` ? <>
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              插入中...
                            </> : <>
                              <PlusCircle className="h-3.5 w-3.5 mr-1" />
                              下插入
                            </>}
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => window.open(getEditUrl("content", currentPageData.pageNumber, question.questionNumber), "_blank")} title="修改题目内容">
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          修改内容
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => window.open(getEditUrl("image", currentPageData.pageNumber, question.questionNumber), "_blank")} title="修改题目图片">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          修改坐标
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(currentPageData.pageNumber, question.questionNumber)} disabled={deleting === `${currentPageData.pageNumber}_${question.questionNumber}` || examPaper.isLocked} title={examPaper.isLocked ? "试卷已锁定，无法删除题目" : "删除此题目"}>
                          {deleting === `${currentPageData.pageNumber}_${question.questionNumber}` ? <>
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              删除中...
                            </> : <>
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              删除
                            </>}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 题目图片 */}
                  {question.imageUrl && <div className="relative my-3 border rounded-md p-2 bg-muted/20 group">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7 bg-white rounded-full shadow-sm" onClick={() => copyImageUrl(question.imageUrl)} title="复制图片链接">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 bg-white rounded-full shadow-sm" onClick={() => openImageInNewTab(question.imageUrl)} title="在新窗口打开图片">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        题目图片
                      </div>

                      {}
                      <img src={question.imageUrl} alt={`题目 ${question.questionNumber} 图片`} className="rounded border max-h-[400px] object-contain mx-auto" />
                    </div>}

                  {/* 题目文本 */}
                  {question.questionText && <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        题目文本
                      </div>
                      <pre className="text-sm whitespace-pre-wrap">
                        {question.questionText}
                      </pre>
                    </div>}

                  {/* 答案和解析 */}
                  {(question.answer && question.answer.length > 0 || question.parse && question.parse.length > 0) && <div className="mt-2 pt-2 border-t">
                      {question.answer && question.answer.length > 0 && <div className="mb-1">
                          <span className="text-xs font-medium text-green-600 mr-1">
                            答案:
                          </span>
                          <span className="text-sm">
                            {question.answer.join(" ")}
                          </span>
                        </div>}
                      {question.parse && question.parse.length > 0 && <div>
                          <span className="text-xs font-medium text-blue-600 mr-1">
                            解析:
                          </span>
                          <span className="text-sm">
                            {question.parse.join(" ")}
                          </span>
                        </div>}
                    </div>}

                  {/* 知识点 */}
                  {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="mt-2 pt-2 border-t">
                        <span className="text-xs font-medium text-purple-600 mr-1">
                          知识点:
                        </span>
                        <span className="text-sm">
                          <div className="flex flex-wrap gap-1 mt-1">
                            {question.knowledgePoints.map((point, idx) => <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                {point}
                              </span>)}
                          </div>
                        </span>
                      </div>}

                  {/* 易错原因 */}
                  {question.easyToMistakeDetail && question.easyToMistakeDetail.length > 0 && <div className="mt-2 pt-2 border-t">
                        <span className="text-xs font-medium text-amber-600 mr-1">
                          易错原因:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {question.easyToMistakeDetail.map((detail, idx) => <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                              {detail}
                            </span>)}
                        </div>
                      </div>}

                  {/* 按钮操作区域 */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => {
                  const url = `/admin/questions/interaction?examId=${examPaper._id}&pageNumber=${currentPageData.pageNumber}&questionNumber=${question.questionNumber}`;
                  window.open(url, "_blank");
                }} disabled={!examPaper.isLocked} title={examPaper.isLocked ? "AI生成题目考察问题" : "需要先锁定试卷才能生成考察问题"}>
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        {examPaper.isLocked ? "AI生成考察问题" : "AI生成考察问题（请先锁定试卷）"}
                      </Button>
                    </div>
                  </div>
                </div>)}

              {/* 底部翻页按钮 */}
              <div className="flex justify-center mt-6">
                <PageButtons currentPage={currentPage} totalPages={totalPages} setCurrentPage={handlePageChange} />
              </div>
            </div> : <div className="flex items-center justify-center h-full w-full">
              <p className="text-muted-foreground">本页暂无识别题目</p>
            </div>}
        </div>
      </CardContent>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除题目</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除此题目吗？此操作不可撤销，删除后当前页面的所有题目序号将会重新排序。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white">
              {deleting && questionToDelete ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </> : <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
}
