"use client";

import { Edit, Eye, Trash2 } from "lucide-react";
// 学情记录列表组件，用于展示和管理学情记录
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
import { dateToString } from "../../../../../../../lib/common/time.js";
const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.warn("复制失败:", error);
  }
};
const getPointsBadge = points => {
  if (points > 0) {
    return <Badge className="bg-green-100 text-green-800">+{points}</Badge>;
  } else if (points < 0) {
    return <Badge variant="destructive" className="text-white">
        {points}
      </Badge>;
  } else {
    return <Badge variant="outline">0</Badge>;
  }
};
export default function StudyRecordList({
  records,
  onView,
  onEdit,
  onDelete
}) {
  if (records.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无学情记录</div>;
  }
  return <TooltipProvider>
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>班级</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>学生编号</TableHead>
              <TableHead>记录内容</TableHead>
              <TableHead>增加的积分</TableHead>
              <TableHead>操作老师</TableHead>
              <TableHead>图片数量</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map(record => <TableRow key={record._id}>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => copyToClipboard(record.classroom?.name || "")}>
                        {record.classroom?.name || "未知班级"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>点击复制班级名称</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => copyToClipboard(record.student?.name || "")}>
                        {record.student?.name || "未知学生"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>点击复制学生姓名</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => copyToClipboard(record.student?.studentCode || "")}>
                        {record.student?.studentCode || "未知编号"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>点击复制学生编号</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={record.content || ""}>
                    {record.content || "无内容"}
                  </div>
                </TableCell>
                <TableCell>{getPointsBadge(record.points)}</TableCell>
                <TableCell>
                  {record.operatorUser?.userInfo?.name || "未知老师"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {record.images?.length || 0} 张
                  </Badge>
                </TableCell>
                <TableCell>{dateToString(new Date(record.created))}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onView(record)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>查看详情</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>编辑记录</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(record)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除记录</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>;
}
