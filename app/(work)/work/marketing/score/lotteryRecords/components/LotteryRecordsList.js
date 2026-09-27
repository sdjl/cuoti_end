"use client";

import { Edit, Gift, Settings } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
// 积分抽奖记录列表组件，用于展示和管理学生的积分抽奖记录
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function LotteryRecordsList({
  records,
  isLoading,
  onProcess,
  onEditRemark
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

  // 获取状态标记
  const getStatusBadge = redeemStatus => {
    if (!redeemStatus) {
      return <div className="text-xs px-2 py-1 rounded-full inline-block bg-yellow-100 text-yellow-800">
          待处理
        </div>;
    }
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "待处理"
      },
      completed: {
        color: "bg-green-100 text-green-800",
        text: "已完成"
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        text: "已取消"
      }
    };
    const config = statusConfig[redeemStatus];
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
      </div>;
  };

  // 获取公示状态标记
  const getPublicStatusBadge = isPublic => {
    if (isPublic) {
      return <div className="text-xs px-2 py-1 rounded-full inline-block bg-blue-100 text-blue-800">
          已公示
        </div>;
    }
    return <div className="text-xs px-2 py-1 rounded-full inline-block bg-gray-100 text-gray-800">
        未公示
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
          <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无积分抽奖记录</p>
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
            <TableHead>奖品名称</TableHead>
            <TableHead>公示状态</TableHead>
            <TableHead>兑换状态</TableHead>
            <TableHead>老师备注</TableHead>
            <TableHead>中奖时间</TableHead>
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
              <TableCell>
                {item.prizeName ? <div className="font-medium cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.prizeName)} title={item.prizeName}>
                    <div className="max-w-32 truncate">{item.prizeName}</div>
                  </div> : <div className="text-gray-400">-</div>}
              </TableCell>
              <TableCell>{getPublicStatusBadge(item.isPublic)}</TableCell>
              <TableCell>{getStatusBadge(item.redeemStatus)}</TableCell>
              <TableCell>
                {item.teacherRemark ? <div className="text-sm cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.teacherRemark)} title={item.teacherRemark}>
                    <div className="max-w-32 truncate">
                      {item.teacherRemark}
                    </div>
                  </div> : <div className="text-gray-400">-</div>}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {formatDateTime(item.created)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button onClick={() => onEditRemark(item._id, item.teacherRemark || "", item.isPublic || false)} size="sm" variant="outline" className="h-8">
                    <Edit className="h-3 w-3 mr-1" />
                    备注
                  </Button>
                  {(!item.redeemStatus || item.redeemStatus === "pending") && <Button onClick={() => onProcess(item._id)} size="sm" variant="outline" className="h-8">
                      <Settings className="h-3 w-3 mr-1" />
                      处理
                    </Button>}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
