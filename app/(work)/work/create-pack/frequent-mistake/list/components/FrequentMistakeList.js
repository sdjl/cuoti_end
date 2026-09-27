"use client";

// 高频错题集列表表格，包含生成方式、PDF操作等管理功能
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar, FileText } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
export default function FrequentMistakeList({
  frequentMistakes,
  isLoading,
  onGenerateQuestionsPdf,
  onGenerateAnswersPdf,
  onDeleteQuestionsPdf,
  onDeleteAnswersPdf,
  generatingQuestionsPdfIds,
  generatingAnswersPdfIds
}) {
  // 获取生成方式标记
  const getGenerationTypeBadge = type => {
    const config = {
      知识点: {
        color: "bg-blue-100 text-blue-800",
        text: "知识点"
      },
      错误归因: {
        color: "bg-orange-100 text-orange-800",
        text: "错误归因"
      }
    };
    const badgeConfig = config[type];
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${badgeConfig.color}`}>
        {badgeConfig.text}
      </div>;
  };

  // 获取筛选内容
  const getFilterContent = item => {
    if (item.generationType === "知识点") {
      return item.knowledgePoints.join(", ") || "未指定";
    } else {
      return item.mistakePoints.join(", ") || "未指定";
    }
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (frequentMistakes.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无高频错题集数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>科目</TableHead>
            <TableHead>题目数量</TableHead>
            <TableHead>时间区间</TableHead>
            <TableHead>生成方式</TableHead>
            <TableHead>筛选条件</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-center">题目PDF</TableHead>
            <TableHead className="text-center">答案PDF</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {frequentMistakes.map(item => <TableRow key={item._id}>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="font-medium max-w-48 truncate cursor-help">
                        {item.name}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        {item.description && <p className="text-sm text-gray-300">
                            {item.description}
                          </p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{item.subject}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{item.questionIds.length}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 max-w-32 truncate">
                  {item.timeRange}
                </div>
              </TableCell>
              <TableCell>
                {getGenerationTypeBadge(item.generationType)}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 max-w-32 truncate" title={getFilterContent(item)}>
                  {getFilterContent(item)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {format(new Date(item.created), "yyyy-MM-dd", {
                  locale: zhCN
                })}
                  </span>
                </div>
              </TableCell>
              {/* 题目PDF */}
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  {!item.questionsPdf && <Button variant="outline" size="sm" onClick={() => onGenerateQuestionsPdf(item)} disabled={generatingQuestionsPdfIds.has(item._id)} title="生成题目PDF">
                      {generatingQuestionsPdfIds.has(item._id) ? "生成中..." : "生成"}
                    </Button>}
                  {item.questionsPdf && <>
                      <Button variant="outline" size="sm" onClick={() => window.open(item.questionsPdf.fileUrl, "_blank")} title="下载题目PDF">
                        下载
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDeleteQuestionsPdf(item)} title="删除题目PDF" className="text-red-600 hover:text-red-700">
                        删除
                      </Button>
                    </>}
                </div>
              </TableCell>
              {/* 答案PDF */}
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  {!item.answersPdf && <Button variant="outline" size="sm" onClick={() => onGenerateAnswersPdf(item)} disabled={generatingAnswersPdfIds.has(item._id)} title="生成答案PDF">
                      {generatingAnswersPdfIds.has(item._id) ? "生成中..." : "生成"}
                    </Button>}
                  {item.answersPdf && <>
                      <Button variant="outline" size="sm" onClick={() => window.open(item.answersPdf.fileUrl, "_blank")} title="下载答案PDF">
                        下载
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDeleteAnswersPdf(item)} title="删除答案PDF" className="text-red-600 hover:text-red-700">
                        删除
                      </Button>
                    </>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => window.open(`/work/create-pack/frequent-mistake/list/${item._id}`, "_blank")} title="查看题目">
                  查看
                </Button>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
