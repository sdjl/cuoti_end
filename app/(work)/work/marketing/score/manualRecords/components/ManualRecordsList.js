"use client";

import { Calculator, Edit } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
// 手动积分记录列表组件，用于展示和管理手动积分调整记录
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function ManualRecordsList({
  records,
  isLoading,
  onEditReason
}) {
  const {
    toast
  } = useToast();

  // 复制文本到剪贴板
  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "内容已复制到剪贴板"
      });
    } catch (err) {
      console.error("复制失败:", err);
      toast({
        title: "复制失败",
        description: "复制到剪贴板时发生错误",
        variant: "destructive"
      });
    }
  };

  // 格式化积分显示
  const formatPoints = points => {
    const isPositive = points >= 0;
    const prefix = isPositive ? "+" : "";
    const color = isPositive ? "text-green-600" : "text-red-600";
    const bgColor = isPositive ? "bg-green-50" : "bg-red-50";
    return <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bgColor} ${color}`}>
        <span className="font-medium">
          {prefix}
          {points}
        </span>
        <span className="text-xs">积分</span>
      </div>;
  };

  // 格式化日期时间
  const formatDateTime = timestamp => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN");
    } catch {
      return "无效时间";
    }
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (records.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无手动积分记录</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>班级</TableHead>
            <TableHead>学生姓名</TableHead>
            <TableHead>学生编号</TableHead>
            <TableHead>积分变化</TableHead>
            <TableHead>修改原因</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map(item => <TableRow key={item._id}>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {item.classroom?.name || "-"}
                </div>
              </TableCell>
              <TableCell>
                {item.student ? <div className="font-medium cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.student.name)}>
                    {item.student.name}
                  </div> : <div className="text-gray-400">-</div>}
              </TableCell>
              <TableCell>
                {item.student ? <div className="font-mono text-sm cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.student.studentCode)}>
                    {item.student.studentCode}
                  </div> : <div className="text-gray-400">-</div>}
              </TableCell>
              <TableCell>{formatPoints(item.points)}</TableCell>
              <TableCell>
                <div className="text-sm cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.reason)} title={item.reason}>
                  <div className="max-w-48 truncate">{item.reason}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {formatDateTime(item.created)}
                </div>
              </TableCell>
              <TableCell>
                <Button onClick={() => onEditReason(item._id, item.reason)} size="sm" variant="outline" className="h-8">
                  <Edit className="h-3 w-3 mr-1" />
                  编辑
                </Button>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
