"use client";

import { Users } from "lucide-react";
// 邀请码使用记录列表组件，展示邀请码的使用记录详情
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function UsageRecordsList({
  records,
  isLoading
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

  // 获取邀请码类型标记
  const getTypeBadge = type => {
    const typeConfig = {
      student: {
        color: "bg-blue-100 text-blue-800",
        text: "学生邀请"
      },
      partner: {
        color: "bg-green-100 text-green-800",
        text: "合作伙伴"
      },
      onetime: {
        color: "bg-purple-100 text-purple-800",
        text: "一次性"
      }
    };
    const config = typeConfig[type];
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
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
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无邀请使用记录</p>
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
            <TableHead>邀请码</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>被邀请者姓名</TableHead>
            <TableHead>被邀请者电话</TableHead>
            <TableHead>使用时间</TableHead>
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
                <div className="font-mono font-bold text-lg cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.invitationCode)}>
                  {item.invitationCode}
                </div>
              </TableCell>
              <TableCell>{getTypeBadge(item.type)}</TableCell>
              <TableCell>
                {item.inviteeName ? <div className="font-medium cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.inviteeName)}>
                    {item.inviteeName}
                  </div> : <div className="text-gray-400">-</div>}
              </TableCell>
              <TableCell>
                {item.inviteePhone ? <div className="font-mono text-sm cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.inviteePhone)}>
                    {item.inviteePhone}
                  </div> : <div className="text-gray-400">-</div>}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {formatDateTime(item.created)}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
