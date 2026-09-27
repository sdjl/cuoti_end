"use client";

// 展示学生自主上传错题统计并提供跳转查看入口
import { ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
export default function SelfUploadMistakeList({
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
                    <p>该学生自主上传的错题总数</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      已掌握数量
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>已经掌握的错题数量</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      掌握率（%）
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>已掌握数量 / 错题数量 × 100%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      未掌握数量
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>还未掌握的错题数量</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      未掌握率（%）
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>未掌握数量 / 错题数量 × 100%</p>
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
                  {stat.masteredCount}
                </span>
              </TableCell>
              <TableCell>
                <div className={`text-sm font-medium text-green-600`}>
                  {stat.masteredRate.toFixed(1)}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-orange-600">
                  {stat.unmasteredCount}
                </span>
              </TableCell>
              <TableCell>
                <div className={`text-sm font-medium text-orange-600`}>
                  {stat.unmasteredRate.toFixed(1)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => window.open(`/work/records/problem/useLogs?classId=${classId}&studentId=${stat.studentId}`, "_blank")} title="查看学生的自主上传错题练习日志">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  查看日志
                </Button>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
