// 试卷解析列表组件，以表格形式展示试卷列表，提供上传、解析、下载和锁定等操作功能

import { Brain, Download, FileText, Loader2, Lock, Upload } from "lucide-react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Badge } from "../../../../../components/ui/badge.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table.js";
import { useToast } from "../../../../../hooks/use-toast.js";
export function ExamAnalysisList({
  examPapers,
  isLoading,
  totalCount,
  analysisPage,
  totalPages,
  handlePageChange,
  onLockPaper
}) {
  const {
    toast
  } = useToast();
  // 格式化分析状态函数
  const getBadgeForStatus = value => {
    if (value === true) {
      return <Badge className="bg-green-100 text-green-800">是</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100">
        否
      </Badge>;
  };

  // 处理下载解析PDF
  const handleDownloadParse = pdfUrl => {
    if (!pdfUrl) {
      toast({
        variant: "destructive",
        title: "下载失败",
        description: "未找到带解析的PDF文件"
      });
      return;
    }
    window.open(pdfUrl, "_blank");
  };

  // 生成查看题目的链接
  const generateQuestionsLink = paperId => {
    return `/admin/exam-papers/${paperId}/questions?from_exam_page=${analysisPage}`;
  };
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>试卷解析列表</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <span>当前共有 {totalCount} 份试卷</span>
            </div>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>试卷标题</TableHead>
                <TableHead>已上传</TableHead>
                <TableHead>已解析</TableHead>
                <TableHead>已锁定</TableHead>
                <TableHead>缺答案</TableHead>
                <TableHead>缺解析</TableHead>
                <TableHead>缺知识点</TableHead>
                <TableHead>缺坐标</TableHead>
                <TableHead>文本长度</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>加载中...</span>
                    </div>
                  </TableCell>
                </TableRow> : examPapers.length > 0 ? examPapers.map(paper => <TableRow key={paper._id}>
                    <TableCell className="font-medium">{paper.title}</TableCell>
                    <TableCell>
                      {paper.analysisReport ? getBadgeForStatus(paper.analysisReport.hasUploadedPdfWithParse) : getBadgeForStatus(false)}
                    </TableCell>
                    <TableCell>
                      {paper.analysisReport ? getBadgeForStatus(paper.analysisReport.isDone) : getBadgeForStatus(false)}
                    </TableCell>
                    <TableCell>{getBadgeForStatus(paper.isLocked)}</TableCell>
                    <TableCell>
                      {paper.analysisReport?.missingAnswerCount ?? "-"}
                    </TableCell>
                    <TableCell>
                      {paper.analysisReport?.missingParseCount ?? "-"}
                    </TableCell>
                    <TableCell>
                      {paper.analysisReport?.missingKnowledgePointCount ?? "-"}
                    </TableCell>
                    <TableCell>
                      {paper.analysisReport?.missingCoordinateCount ?? "-"}
                    </TableCell>
                    <TableCell>
                      {paper.analysisReport?.pdfWithParseText?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => window.open(`/admin/exam-analysis/${paper._id}/upload-pdf?from_analysis_page=${analysisPage}`, "_blank")} title="上传解析PDF" disabled={paper.isLocked}>
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => window.open(`/admin/exam-analysis/${paper._id}/analysis?from_analysis_page=${analysisPage}`, "_blank")} title="AI解析" disabled={!paper.analysisReport?.pdfWithParseUrl || paper.isLocked}>
                          <Brain className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDownloadParse(paper.analysisReport?.pdfWithParseUrl)} title="下载解析PDF" disabled={!paper.analysisReport?.pdfWithParseUrl}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => window.open(generateQuestionsLink(paper._id), "_blank")} title="查看题目">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onLockPaper(paper._id)} disabled={paper.isLocked} className={`${paper.isLocked ? "text-gray-400 cursor-not-allowed" : "text-orange-500 hover:bg-orange-500 hover:text-white"}`} title={paper.isLocked ? "已锁定" : "锁定"}>
                          <Lock className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>) : <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                    没有找到符合条件的试卷
                  </TableCell>
                </TableRow>}
            </TableBody>
          </Table>
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && <div className="flex justify-center mt-6">
            <CustomPagination currentPage={analysisPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="analysis_page" />
          </div>}
      </CardContent>
    </Card>;
}
