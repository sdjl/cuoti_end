"use client";

import { Check, Edit, Eye, Settings, Trash2, X } from "lucide-react";
// 荣誉申请列表组件，展示荣誉申请记录并提供查看、编辑、处理、删除等操作
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
const getStatusBadge = status => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">待审核</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800">已通过</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className="text-white">
          已取消
        </Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.warn("复制失败:", error);
  }
};
export default function HonorApplicationList({
  applications,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onProcess,
  onDelete
}) {
  if (applications.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无荣誉申请记录</div>;
  }

  // 可选择的申请（只有待审核状态的可以选择）
  const selectableApplications = applications.filter(app => app.status === "pending");
  const selectableIds = selectableApplications.map(app => app._id);

  // 是否全选
  const isAllSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id));

  // 是否部分选中
  const isPartiallySelected = !isAllSelected && selectableIds.some(id => selectedIds.includes(id));

  // 全选/取消全选
  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableIds);
    }
  };

  // 单选
  const handleSelectOne = id => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };
  return <TooltipProvider>
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {selectableIds.length > 0 && <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="全选" className={isPartiallySelected && !isAllSelected ? "data-[state=checked]:bg-primary" : ""} />}
              </TableHead>
              <TableHead>班级</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>荣誉名称</TableHead>
              <TableHead>考试名称</TableHead>
              <TableHead>展示</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>分数</TableHead>
              <TableHead>申请状态</TableHead>
              <TableHead>申请时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map(application => {
            const isSelectable = application.status === "pending";
            const isSelected = selectedIds.includes(application._id);
            return <TableRow key={application._id}>
                  <TableCell>
                    {isSelectable && <Checkbox checked={isSelected} onCheckedChange={() => handleSelectOne(application._id)} aria-label={`选择 ${application.student?.name || "未知学生"}`} />}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => copyToClipboard(application.classroom?.name || "")}>
                          {application.classroom?.name || "未知班级"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>点击复制班级名称</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => copyToClipboard(application.student?.name || "")}>
                          {application.student?.name || "未知学生"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>点击复制学生姓名</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => copyToClipboard(application.honorName)}>
                          {application.honorName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>点击复制荣誉名称</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {application.examName ? <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => copyToClipboard(application.examName || "")}>
                            {application.examName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>点击复制考试名称</TooltipContent>
                      </Tooltip> : "-"}
                  </TableCell>
                  <TableCell>
                    {application.showInSchoolHonorBoard ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                  </TableCell>
                  <TableCell>{application.subject || "-"}</TableCell>
                  <TableCell>
                    {application.examScore !== undefined && application.examScore !== null ? application.examScore : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    {new Date(application.created).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onView(application)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>查看详情</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(application)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑评语</TooltipContent>
                      </Tooltip>

                      {application.status === "pending" && <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onProcess(application)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>处理申请</TooltipContent>
                        </Tooltip>}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(application)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>删除申请</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>;
}
