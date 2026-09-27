"use client";

// 一次性邀请码列表组件，用于展示和管理一次性邀请码
import { Edit, Ticket } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function OnetimeCodeList({
  invitationCodes,
  isLoading,
  onEditInvitationCode
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
  const getStatusBadge = status => {
    const statusConfig = {
      active: {
        color: "bg-green-100 text-green-800",
        text: "启用"
      },
      disabled: {
        color: "bg-red-100 text-red-800",
        text: "禁用"
      }
    };
    const config = statusConfig[status] || statusConfig.disabled;
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
      </div>;
  };

  // 获取使用状态标记
  const getUsedStatusBadge = usedCount => {
    const isUsed = usedCount > 0;
    const config = isUsed ? {
      color: "bg-blue-100 text-blue-800",
      text: `${usedCount} 次`
    } : {
      color: "bg-gray-100 text-gray-800",
      text: "未使用"
    };
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
      </div>;
  };

  // 计算有效期
  const getValidityPeriod = (created, validDays) => {
    try {
      const createdDate = new Date(created);
      const expiryDate = new Date(created + validDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      const isExpired = now > expiryDate;
      const text = `${createdDate.toLocaleDateString("zh-CN")} 至 ${expiryDate.toLocaleDateString("zh-CN")}`;
      return {
        text,
        isExpired
      };
    } catch {
      return {
        text: "无效时间",
        isExpired: false
      };
    }
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (invitationCodes.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无一次性邀请码数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>邀请码</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>体验天数</TableHead>
            <TableHead>使用次数</TableHead>
            <TableHead>有效期</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitationCodes.map(item => {
          const validity = getValidityPeriod(item.created, item.validDays);
          return <TableRow key={item._id}>
                <TableCell>
                  <div className="font-mono font-bold text-lg cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.code)}>
                    {item.code}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {item.experienceDays} 天
                  </div>
                </TableCell>
                <TableCell>{getUsedStatusBadge(item.usedCount)}</TableCell>
                <TableCell>
                  <div className={`text-sm ${validity.isExpired ? "text-red-600" : "text-gray-600"}`} title={validity.isExpired ? "已过期" : "有效"}>
                    {validity.text}
                    {validity.isExpired && <span className="ml-1 text-xs">(已过期)</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEditInvitationCode(item._id)} title="编辑邀请码">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </Card>;
}
