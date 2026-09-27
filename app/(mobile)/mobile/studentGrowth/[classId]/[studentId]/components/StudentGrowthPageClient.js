"use client";

import { Award, BookOpen, Circle, Heart, Loader2, Target, TrendingUp, Upload } from "lucide-react";
// 学生成长记录页面客户端组件，展示学生的成长记录列表，包括积分变化、成长类型等信息
import { useCallback, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { getStudentGrowthRecords } from "../actions.js";
// 获取成长类型对应的图标和颜色
function getTypeIcon(type) {
  switch (type) {
    case "课程错题":
      return {
        icon: Target,
        color: "text-blue-500",
        bgColor: "bg-blue-50"
      };
    case "课程练习":
      return {
        icon: BookOpen,
        color: "text-purple-500",
        bgColor: "bg-purple-50"
      };
    case "自主上传错题":
      return {
        icon: Circle,
        color: "text-orange-500",
        bgColor: "bg-orange-50"
      };
    case "上传错题":
      return {
        icon: Upload,
        color: "text-green-500",
        bgColor: "bg-green-50"
      };
    case "获得荣誉":
      return {
        icon: Award,
        color: "text-yellow-500",
        bgColor: "bg-yellow-50"
      };
    case "学情记录":
      return {
        icon: Heart,
        color: "text-pink-500",
        bgColor: "bg-pink-50"
      };
    case "手动调整积分":
      return {
        icon: TrendingUp,
        color: "text-cyan-500",
        bgColor: "bg-cyan-50"
      };
    default:
      return {
        icon: Circle,
        color: "text-gray-500",
        bgColor: "bg-gray-50"
      };
  }
}

// 格式化时间显示
function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const monthsInMs = 30 * 24 * 60 * 60 * 1000; // 30天的毫秒数

  // 如果超过一个月，显示具体日期
  if (diff > monthsInMs) {
    const date = new Date(timestamp);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}月${day}日`;
  }

  // 一个月内显示相对时间
  if (minutes === 0) {
    return "刚刚";
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    return `${days}天前`;
  }
}

// 渲染特定类型的详细信息
function renderTypeSpecificInfo(item) {
  switch (item.type) {
    case "课程错题":
      {
        const data = item.data;
        return <div className="text-xs text-gray-400 mt-2">
          剩余 {data.afterMistakeCount} 个错题
        </div>;
      }
    case "课程练习":
      {
        const data = item.data;
        return <div className="text-xs text-gray-400 mt-2">
          正确 {data.correctCount} 题 · 错误 {data.wrongCount} 题 · 共{" "}
          {data.totalCount} 题
        </div>;
      }
    case "自主上传错题":
      {
        const data = item.data;
        return <div className="text-xs text-gray-400 mt-2">
          科目：{data.subject} · 知识点：{data.knowledgePoints.join("、")}
        </div>;
      }
    case "上传错题":
      {
        const data = item.data;
        return <div className="text-xs text-gray-400 mt-2">科目：{data.subject}</div>;
      }
    case "获得荣誉":
      {
        const data = item.data;
        return <div className="mt-2">
          <div className="text-xs text-gray-400 mb-2">
            荣誉：{data.honorName}
          </div>
          {data.studentPhoto && data.studentPhoto.length > 0 && <div className="space-y-3">
              {data.studentPhoto.map((photo, index) => <div key={index} className="w-full">
                  <BaseImage src={photo.imageUrl} alt={`荣誉照片 ${index + 1}`} width={400} height={300} className="w-full h-auto rounded-lg border border-gray-200" style={{
                objectFit: "contain"
              }} />
                </div>)}
            </div>}
        </div>;
      }
    case "学情记录":
      {
        const data = item.data;
        return <div className="mt-3">
          {data.images && data.images.length > 0 && <div className="space-y-3">
              {data.images.map((image, index) => <div key={index} className="w-full">
                  <BaseImage src={image.imageUrl} alt={`学情记录图片 ${index + 1}`} width={400} height={300} className="w-full h-auto rounded-lg border border-gray-200" style={{
                objectFit: "contain"
              }} />
                </div>)}
            </div>}
        </div>;
      }
    case "手动调整积分":
      {
        const data = item.data;
        return <div className="text-xs text-gray-400 mt-2">
          调整原因：{data.reason}
        </div>;
      }
    default:
      return null;
  }
}
export default function StudentGrowthPageClient({
  classId,
  studentId,
  studentInfo,
  initialRecords,
  pageSize,
  startDate,
  endDate,
  teacherComment
}) {
  const [records, setRecords] = useState(initialRecords.records);
  const [hasMore, setHasMore] = useState(initialRecords.hasMore);
  const [totalCount] = useState(initialRecords.totalCount);
  const [totalScore] = useState(initialRecords.totalScore);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 加载更多记录
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getStudentGrowthRecords(studentId, classId, nextPage, pageSize, startDate, endDate);
      setRecords(prev => [...prev, ...result.records]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("加载更多记录失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [classId, studentId, currentPage, hasMore, isLoading, pageSize, startDate, endDate]);
  return <div className="px-4 py-6 bg-white">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">我的成长记录</h2>
        <p className="text-sm text-gray-600">
          {studentInfo.student.name} · {studentInfo.classroom.name}
        </p>
      </div>

      {/* 时间区间和老师评语 */}
      {startDate && endDate || teacherComment ? <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          {startDate && endDate && <div className="flex items-center gap-2 mb-2">
              <Circle className="w-3 h-3 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                统计时间
              </span>
            </div>}
          {startDate && endDate && <p className="text-sm text-amber-700 mb-3">
              {startDate.getFullYear()}年
              {(startDate.getMonth() + 1).toString().padStart(2, "0")}月
              {startDate.getDate().toString().padStart(2, "0")}日 至{" "}
              {endDate.getFullYear()}年
              {(endDate.getMonth() + 1).toString().padStart(2, "0")}月
              {endDate.getDate().toString().padStart(2, "0")}日
            </p>}
          {teacherComment && <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-3 h-3 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  老师评语
                </span>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                {teacherComment}
              </p>
            </div>}
        </div> : null}

      {/* 成长统计 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">总积分</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{totalScore}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">成长记录</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{totalCount}</div>
        </div>
      </div>

      {/* 成长记录列表 */}
      {records.length > 0 ? <div className="space-y-6 mb-8">
          {records.map((item, index) => {
        const {
          icon: TypeIcon,
          color,
          bgColor
        } = getTypeIcon(item.type);
        return <div key={item._id} className="group">
                <div className="flex items-start gap-4">
                  {/* 时间线点和图标 */}
                  <div className="relative flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                      <TypeIcon className={`w-4 h-4 ${color}`} />
                    </div>
                    {index < records.length - 1 && <div className="absolute top-8 left-4 w-px h-6 bg-gray-200"></div>}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {item.score ? formatTime(item.score.time) : formatTime(item.created)}
                        <Badge variant="outline" className={`border-none text-xs px-2 py-0.5 ${bgColor} ${color}`}>
                          {item.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.score && <Badge variant="outline" className={`border-none text-xs px-2 py-0.5 ${item.score.score >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            {item.score.score >= 0 ? "+" : ""}
                            {item.score.score}
                          </Badge>}
                      </div>
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed">
                      {item.description}
                    </p>

                    {/* 渲染特定类型的详细信息 */}
                    {renderTypeSpecificInfo(item)}
                  </div>
                </div>
              </div>;
      })}
        </div> : <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无成长记录</p>
          <p className="text-sm text-gray-400 mt-2">
            完成{DISPLAY_TEXT.COURSE_MISTAKE}后会在这里显示成长记录
          </p>
        </div>}

      {/* 加载更多按钮 */}
      {hasMore && <div className="mt-6">
          <Button onClick={loadMore} disabled={isLoading} variant="outline" className="w-full py-4 bg-gray-50 rounded-lg">
            {isLoading ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                加载中...
              </> : "加载更多成长记录"}
          </Button>
        </div>}

      {/* 底部安全区域 */}
      <div className="pb-8"></div>
    </div>;
}
