"use client";

// 展示班级课程错题统计概览并提供跳转至答题详情
import { ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
export default function CourseMistakeList({
  stats,
  isLoading,
  classId
}) {
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (stats.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无统计数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生姓名</TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      错题数量
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>该学生在该班级课程中的错题总数</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      重做通过数量
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>已经通过重做掌握的错题数量</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      通过率（%）
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>重做通过数量 / 错题数量 × 100%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      剩余错题数
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>还未通过重做掌握的错题数量</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      顽固错题数
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>已重新提交答案但仍未掌握的错题数量</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map(stat => <TableRow key={stat.studentId}>
              <TableCell>
                <div className="font-medium">{stat.studentName}</div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-red-600">
                  {stat.mistakeCount}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-green-600">
                  {stat.correctedCount}
                </span>
              </TableCell>
              <TableCell>
                <div className={`text-sm font-medium text-green-600`}>
                  {stat.passRate.toFixed(1)}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-orange-600">
                  {stat.remainingCount}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-purple-600">
                  {stat.stubbornCount}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => window.open(`/work/records/mistake-practice/useLogs?classId=${classId}&studentId=${stat.studentId}`, "_blank")} title="查看学生的课程错题练习日志">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  查看日志
                </Button>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
