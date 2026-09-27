"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
// 积分变动记录列表组件，用于展示学生的所有积分变动历史记录
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function PointsHistoryList({
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

  // 获取成长类型标记
  const getGrowthTypeBadge = type => {
    const typeConfig = {
      课程错题: {
        color: "bg-blue-100 text-blue-800",
        text: DISPLAY_TEXT.COURSE_MISTAKE
      },
      课程练习: {
        color: "bg-cyan-100 text-cyan-800",
        text: "课程练习"
      },
      自主上传错题: {
        color: "bg-green-100 text-green-800",
        text: DISPLAY_TEXT.SELF_UPLOAD_MISTAKE
      },
      上传错题: {
        color: "bg-purple-100 text-purple-800",
        text: "上传错题"
      },
      获得荣誉: {
        color: "bg-yellow-100 text-yellow-800",
        text: "获得荣誉"
      },
      学情记录: {
        color: "bg-indigo-100 text-indigo-800",
        text: "学情记录"
      },
      分享获得积分: {
        color: "bg-emerald-100 text-emerald-800",
        text: "分享获得积分"
      },
      邀请获得积分: {
        color: "bg-teal-100 text-teal-800",
        text: "邀请获得积分"
      },
      抽奖消耗积分: {
        color: "bg-orange-100 text-orange-800",
        text: "抽奖消耗积分"
      },
      兑换消耗积分: {
        color: "bg-red-100 text-red-800",
        text: "兑换消耗积分"
      },
      手动调整积分: {
        color: "bg-gray-100 text-gray-800",
        text: "手动调整积分"
      },
      积分返还: {
        color: "bg-cyan-100 text-cyan-800",
        text: "积分返还"
      }
    };
    const config = typeConfig[type] || {
      color: "bg-gray-100 text-gray-800",
      text: type || "其他"
    };
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
      </div>;
  };

  // 获取积分变化显示
  const getScoreChange = score => {
    const isPositive = score > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    const prefix = isPositive ? "+" : "";
    return <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium">
          {prefix}
          {score}
        </span>
      </div>;
  };

  // 获取是否显示在成长路径的标记
  const getGrowthPathBadge = isShowInGrowthPath => {
    // undefined或true表示显示，false表示不显示
    const isShow = isShowInGrowthPath === undefined || isShowInGrowthPath === true;
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${isShow ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
        {isShow ? "显示" : "不显示"}
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
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无积分变动记录</p>
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
            <TableHead>成长类型</TableHead>
            <TableHead>成长路径显示</TableHead>
            <TableHead>积分变化</TableHead>
            <TableHead>变化原因</TableHead>
            <TableHead>变化时间</TableHead>
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
              <TableCell>{getGrowthTypeBadge(item.type)}</TableCell>
              <TableCell>
                {getGrowthPathBadge(item.isShowInGrowthPath)}
              </TableCell>
              <TableCell>{getScoreChange(item.score.score)}</TableCell>
              <TableCell>
                <div className="text-sm cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.score.reason)} title={item.score.reason}>
                  <div className="max-w-32 truncate">{item.score.reason}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {formatDateTime(item.score.time)}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
