"use client";

/**
 * 成长记录观察组件
 *
 * 此组件用于显示学生的成长记录，包括：
 * - 学情记录
 * - 积分变化
 * - 荣誉申请
 * - 积分兑换
 * - 积分抽奖
 *
 * 依赖的 Server Action 文件：
 * - app/(work)/work/dashboard/student/componentsServerActions/growthRecordsActions.ts
 */
import { Check, Target, TrendingDown, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getExchangeRecordsAction, getHonorApplicationsAction, getLotteryRecordsAction, getPointsHistoryAction, getStudyRecordsAction } from "../componentsServerActions/growthRecordsActions.js";

// 每个tab显示的记录数量（修改此处可控制所有类型的显示数量）
const RECORDS_LIMIT = 5;
export default function QuizRecordsList({
  studentId
}) {
  const [studyRecords, setStudyRecords] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [honorApplications, setHonorApplications] = useState([]);
  const [exchangeRecords, setExchangeRecords] = useState([]);
  const [lotteryRecords, setLotteryRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载学情记录数据
  useEffect(() => {
    async function loadStudyRecords() {
      setLoading(true);
      try {
        const result = await getStudyRecordsAction(studentId, RECORDS_LIMIT);
        if (result.success) {
          setStudyRecords(result.data);
        }
      } catch (error) {
        console.error("加载学情记录数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    if (studentId) {
      loadStudyRecords();
    }
  }, [studentId]);

  // 加载积分变化数据
  useEffect(() => {
    async function loadPointsHistory() {
      setLoading(true);
      try {
        const result = await getPointsHistoryAction(studentId, RECORDS_LIMIT);
        if (result.success) {
          setPointsHistory(result.data);
        }
      } catch (error) {
        console.error("加载积分变化数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    if (studentId) {
      loadPointsHistory();
    }
  }, [studentId]);

  // 加载荣誉申请数据
  useEffect(() => {
    async function loadHonorApplications() {
      setLoading(true);
      try {
        const result = await getHonorApplicationsAction(studentId, RECORDS_LIMIT);
        if (result.success) {
          setHonorApplications(result.data);
        }
      } catch (error) {
        console.error("加载荣誉申请数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    if (studentId) {
      loadHonorApplications();
    }
  }, [studentId]);

  // 加载积分兑换数据
  useEffect(() => {
    async function loadExchangeRecords() {
      setLoading(true);
      try {
        const result = await getExchangeRecordsAction(studentId, RECORDS_LIMIT);
        if (result.success) {
          setExchangeRecords(result.data);
        }
      } catch (error) {
        console.error("加载积分兑换数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    if (studentId) {
      loadExchangeRecords();
    }
  }, [studentId]);

  // 加载积分抽奖数据
  useEffect(() => {
    async function loadLotteryRecords() {
      setLoading(true);
      try {
        const result = await getLotteryRecordsAction(studentId, RECORDS_LIMIT);
        if (result.success) {
          setLotteryRecords(result.data);
        }
      } catch (error) {
        console.error("加载积分抽奖数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    if (studentId) {
      loadLotteryRecords();
    }
  }, [studentId]);

  /**
   * 获取学情记录积分标记
   */
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

  /**
   * 获取成长类型标记
   */
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

  /**
   * 获取积分变化显示
   */
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

  /**
   * 获取是否显示在成长路径的标记
   */
  const getGrowthPathBadge = isShowInGrowthPath => {
    // undefined或true表示显示，false表示不显示
    const isShow = isShowInGrowthPath === undefined || isShowInGrowthPath === true;
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${isShow ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
        {isShow ? "显示" : "不显示"}
      </div>;
  };

  /**
   * 获取荣誉申请状态标记
   */
  const getHonorStatusBadge = status => {
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

  /**
   * 获取积分兑换/抽奖状态标记
   */
  const getExchangeStatusBadge = status => {
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
    const config = statusConfig[status];
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
        {config.text}
      </div>;
  };
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">成长记录观察</h2>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={() => window.open(`/work/marketing/study-record/studyRecords?studentId=${studentId}`, "_blank")} className="text-blue-600 hover:text-blue-700">
            更多学情
          </button>
          <button onClick={() => window.open(`/work/marketing/score/pointsHistory?studentId=${studentId}`, "_blank")} className="text-blue-600 hover:text-blue-700">
            更多变化
          </button>
          <button onClick={() => window.open(`/work/marketing/study-record/honorApplications?studentId=${studentId}`, "_blank")} className="text-blue-600 hover:text-blue-700">
            更多荣誉
          </button>
          <button onClick={() => window.open(`/work/marketing/score/exchangeRecords?studentId=${studentId}`, "_blank")} className="text-blue-600 hover:text-blue-700">
            更多兑换
          </button>
          <button onClick={() => window.open(`/work/marketing/score/lotteryRecords?studentId=${studentId}`, "_blank")} className="text-blue-600 hover:text-blue-700">
            更多抽奖
          </button>
        </div>
      </div>

      <Tabs defaultValue="study" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="study">学情记录</TabsTrigger>
          <TabsTrigger value="points">积分变化</TabsTrigger>
          <TabsTrigger value="honor">荣誉申请</TabsTrigger>
          <TabsTrigger value="exchange">积分兑换</TabsTrigger>
          <TabsTrigger value="lottery">积分抽奖</TabsTrigger>
        </TabsList>

        {/* 学情记录 Tab */}
        <TabsContent value="study">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : studyRecords.length === 0 ? <div className="text-center py-8 text-gray-500">暂无学情记录</div> : <div className="bg-white rounded-lg shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班级名称</TableHead>
                    <TableHead>记录内容</TableHead>
                    <TableHead>增加的积分</TableHead>
                    <TableHead>操作老师</TableHead>
                    <TableHead>图片数量</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studyRecords.map(record => <TableRow key={record._id}>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {record.className}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={record.content || ""}>
                          {record.content || "无内容"}
                        </div>
                      </TableCell>
                      <TableCell>{getPointsBadge(record.points)}</TableCell>
                      <TableCell>{record.operatorName || "未知老师"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.imageCount} 张</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(record.created).toLocaleString("zh-CN")}
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </TabsContent>

        {/* 积分变化 Tab */}
        <TabsContent value="points">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : pointsHistory.length === 0 ? <div className="text-center py-8 text-gray-500">
              暂无积分变化记录
            </div> : <div className="bg-white rounded-lg shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班级名称</TableHead>
                    <TableHead>成长类型</TableHead>
                    <TableHead>成长路径显示</TableHead>
                    <TableHead>积分变化</TableHead>
                    <TableHead>变化原因</TableHead>
                    <TableHead>变化时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointsHistory.map(record => <TableRow key={record._id}>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {record.className}
                        </div>
                      </TableCell>
                      <TableCell>{getGrowthTypeBadge(record.type)}</TableCell>
                      <TableCell>
                        {getGrowthPathBadge(record.isShowInGrowthPath)}
                      </TableCell>
                      <TableCell>
                        {getScoreChange(record.scoreChange)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" title={record.reason}>
                          <div className="max-w-32 truncate">
                            {record.reason}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(record.changeTime).toLocaleString("zh-CN")}
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </TabsContent>

        {/* 荣誉申请 Tab */}
        <TabsContent value="honor">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : honorApplications.length === 0 ? <div className="text-center py-8 text-gray-500">
              暂无荣誉申请记录
            </div> : <div className="bg-white rounded-lg shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班级</TableHead>
                    <TableHead>荣誉名称</TableHead>
                    <TableHead>考试名称</TableHead>
                    <TableHead>申请状态</TableHead>
                    <TableHead>展示</TableHead>
                    <TableHead>科目</TableHead>
                    <TableHead>分数</TableHead>
                    <TableHead>申请时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {honorApplications.map(application => <TableRow key={application._id}>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {application.className}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {application.honorName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700">
                          {application.examName || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getHonorStatusBadge(application.status)}
                      </TableCell>
                      <TableCell>
                        {application.showInSchoolHonorBoard ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                      </TableCell>
                      <TableCell>{application.subject || "—"}</TableCell>
                      <TableCell>
                        {application.examScore !== undefined && application.examScore !== null ? application.examScore : "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(application.created).toLocaleDateString("zh-CN")}
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </TabsContent>

        {/* 积分兑换 Tab */}
        <TabsContent value="exchange">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : exchangeRecords.length === 0 ? <div className="text-center py-8 text-gray-500">
              暂无积分兑换记录
            </div> : <div className="bg-white rounded-lg shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班级名称</TableHead>
                    <TableHead>商品名称</TableHead>
                    <TableHead>消耗积分</TableHead>
                    <TableHead>申请状态</TableHead>
                    <TableHead>老师备注</TableHead>
                    <TableHead>申请时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exchangeRecords.map(record => <TableRow key={record._id}>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {record.className}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium" title={record.itemName}>
                          <div className="max-w-32 truncate">
                            {record.itemName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-orange-600">
                          <span className="font-medium">
                            {record.pointsUsed}
                          </span>
                          <span className="text-xs">积分</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getExchangeStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        {record.teacherRemark ? <div className="text-sm" title={record.teacherRemark}>
                            <div className="max-w-32 truncate">
                              {record.teacherRemark}
                            </div>
                          </div> : <div className="text-gray-400">—</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(record.created).toLocaleString("zh-CN")}
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </TabsContent>

        {/* 积分抽奖 Tab */}
        <TabsContent value="lottery">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : lotteryRecords.length === 0 ? <div className="text-center py-8 text-gray-500">
              暂无积分抽奖记录
            </div> : <div className="bg-white rounded-lg shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班级</TableHead>
                    <TableHead>奖品名称</TableHead>
                    <TableHead>兑换状态</TableHead>
                    <TableHead>老师备注</TableHead>
                    <TableHead>中奖时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotteryRecords.map(record => <TableRow key={record._id}>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {record.className}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.prizeName ? <div className="font-medium" title={record.prizeName}>
                            <div className="max-w-32 truncate">
                              {record.prizeName}
                            </div>
                          </div> : <div className="text-gray-400">—</div>}
                      </TableCell>
                      <TableCell>
                        {getExchangeStatusBadge(record.redeemStatus || "pending")}
                      </TableCell>
                      <TableCell>
                        {record.teacherRemark ? <div className="text-sm" title={record.teacherRemark}>
                            <div className="max-w-32 truncate">
                              {record.teacherRemark}
                            </div>
                          </div> : <div className="text-gray-400">—</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(record.created).toLocaleString("zh-CN")}
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </TabsContent>
      </Tabs>
    </div>;
}
