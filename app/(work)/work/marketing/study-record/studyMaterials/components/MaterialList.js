"use client";

import { Edit, Eye, Link, Trash2 } from "lucide-react";
// 学习资料列表组件，展示学习资料记录并提供查看、编辑、删除等操作
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
const getStatusBadge = status => {
  if (status === "active") {
    return <Badge className="bg-green-100 text-green-800">可下载</Badge>;
  } else {
    return <Badge variant="destructive" className="text-white">
        已禁用
      </Badge>;
  }
};
const getTypeBadge = type => {
  const typeMap = {
    pdf: {
      label: "PDF",
      color: "bg-red-100 text-red-800"
    },
    word: {
      label: "Word",
      color: "bg-blue-100 text-blue-800"
    },
    excel: {
      label: "Excel",
      color: "bg-green-100 text-green-800"
    },
    ppt: {
      label: "PPT",
      color: "bg-orange-100 text-orange-800"
    },
    zip: {
      label: "压缩",
      color: "bg-purple-100 text-purple-800"
    },
    image: {
      label: "图片",
      color: "bg-pink-100 text-pink-800"
    },
    other: {
      label: "其他",
      color: "bg-gray-100 text-gray-800"
    }
  };
  const config = typeMap[type] || typeMap.other;
  return <Badge className={config.color}>{config.label}</Badge>;
};
const formatFileSize = sizeInBytes => {
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return `${sizeInMB.toFixed(2)} MB`;
};
export default function MaterialList({
  materials,
  onView,
  onEdit,
  onDelete
}) {
  if (materials.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无学习资料</div>;
  }
  return <TooltipProvider>
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>资料标题</TableHead>
              <TableHead>班级</TableHead>
              <TableHead>资料类型</TableHead>
              <TableHead>文件大小</TableHead>
              <TableHead>资料状态</TableHead>
              <TableHead>上传者姓名</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map(material => <TableRow key={material._id}>
                <TableCell>
                  <div className="max-w-xs truncate font-medium" title={material.title}>
                    {material.title}
                  </div>
                </TableCell>
                <TableCell>{material.classroom?.name || "未知班级"}</TableCell>
                <TableCell>{getTypeBadge(material.type)}</TableCell>
                <TableCell>{formatFileSize(material.file.fileSize)}</TableCell>
                <TableCell>{getStatusBadge(material.status)}</TableCell>
                <TableCell>
                  {material.uploaderUser?.userInfo?.name || "未知老师"}
                </TableCell>
                <TableCell>
                  {dateToString(new Date(material.created))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(material.file.fileUrl)}>
                          <Link className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>复制下载链接</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onView(material)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>查看详情</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(material)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>编辑资料</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(material)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除资料</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>;
}
