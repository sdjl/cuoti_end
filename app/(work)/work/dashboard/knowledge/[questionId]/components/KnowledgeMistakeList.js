"use client";

import { Brain, CheckCircle2, Edit, Save, X, XCircle } from "lucide-react";
// 知识点错题记录列表，支持典型错题编辑与错因标注
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { getMistakePointsBySubject } from "../../../../../../../lib/collection/mistake.js";
import { dateToString } from "../../../../../../../lib/common/time.js";
import { updateMistakeRecordAction, updateTypicalMistakeAction } from "../actions.js";
import MistakePointSelector from "./MistakePointSelector.js";
export default function KnowledgeMistakeList({
  records,
  isLoading,
  hideStudentInfo,
  subject
}) {
  const {
    toast
  } = useToast();
  const [localRecords, setLocalRecords] = useState(records);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [allMistakePoints, setAllMistakePoints] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // 当records变化时更新localRecords
  useEffect(() => {
    setLocalRecords(records);
  }, [records]);

  // 组件挂载时加载错误归因
  useEffect(() => {
    const loadMistakePoints = async () => {
      if (subject && allMistakePoints.length === 0) {
        const points = await getMistakePointsBySubject(subject);
        setAllMistakePoints(points);
      }
    };
    loadMistakePoints();
  }, [subject, allMistakePoints.length]);
  const handleDiagnose = record => {
    const url = `/work/answer/parse/${record.studentAnswerId}?studentAnswerItemId=${record._id}`;
    window.open(url, "_blank");
  };
  const formatDate = timestamp => {
    if (!timestamp) return "未知时间";
    const date = new Date(timestamp);
    return dateToString(date);
  };

  // 处理典型错题标记切换
  const handleTypicalMistakeToggle = async (itemId, currentValue) => {
    const newValue = !currentValue;

    // 乐观更新
    setLocalRecords(prev => prev.map(r => r._id === itemId ? {
      ...r,
      isTypicalMistake: newValue
    } : r));
    const result = await updateTypicalMistakeAction(itemId, newValue);
    if (!result.success) {
      // 回滚
      setLocalRecords(prev => prev.map(r => r._id === itemId ? {
        ...r,
        isTypicalMistake: !newValue
      } : r));
      toast({
        variant: "destructive",
        title: "更新失败",
        description: result.error || "更新典型错题标记失败"
      });
    }
  };

  // 开始编辑
  const handleStartEdit = record => {
    setEditingItemId(record._id);
    setEditingData({
      answerValue: record.answerValue || [],
      parse: record.parse || [],
      mistakePointIds: record.mistakePoints?.map(mp => mp._id) || []
    });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingData(null);
  };

  // 保存编辑
  const handleSaveEdit = async record => {
    if (!editingData) return;
    setIsSaving(true);
    try {
      const result = await updateMistakeRecordAction({
        itemId: record._id,
        answerValue: editingData.answerValue,
        parse: editingData.parse,
        mistakePointIds: editingData.mistakePointIds,
        questionId: record.questionId,
        studentId: record.studentId || "",
        classId: record.classId || "",
        courseId: record.courseId || null,
        questionPackId: record.questionPackId || ""
      });
      if (result.success) {
        // 更新本地记录
        const updatedMistakePoints = allMistakePoints.filter(mp => editingData.mistakePointIds.includes(mp._id));
        setLocalRecords(prev => prev.map(r => r._id === record._id ? {
          ...r,
          answerValue: editingData.answerValue,
          parse: editingData.parse,
          mistakePoints: updatedMistakePoints
        } : r));
        toast({
          title: "保存成功",
          description: "错题记录已更新"
        });
        handleCancelEdit();
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.error || "更新失败"
        });
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "发生未知错误"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const getCorrectionStatusBadge = record => {
    if (record.isCorrectedByMistakeAgain) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          已过关
        </Badge>;
    }
    if (record.hasResubmittedAnswer) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          <XCircle className="h-3 w-3 mr-1" />
          顽固错题
        </Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <XCircle className="h-3 w-3 mr-1" />
        待过关
      </Badge>;
  };
  const getResubmittedBadge = hasResubmitted => {
    if (hasResubmitted) {
      return <Badge variant="outline" className="bg-blue-50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          已提交
        </Badge>;
    }
    return <Badge variant="outline" className="bg-gray-50">
        <XCircle className="h-3 w-3 mr-1" />
        未提交
      </Badge>;
  };
  const getDifficultyBadge = difficulty => {
    const difficultyConfig = {
      容易: {
        color: "bg-green-100 text-green-800",
        text: "容易"
      },
      中等: {
        color: "bg-blue-100 text-blue-800",
        text: "中等"
      },
      困难: {
        color: "bg-orange-100 text-orange-800",
        text: "困难"
      },
      超难: {
        color: "bg-red-100 text-red-800",
        text: "超难"
      },
      未知: {
        color: "bg-gray-100 text-gray-800",
        text: "未知"
      }
    };
    const config = difficultyConfig[difficulty] || difficultyConfig.未知;
    return <Badge variant="outline" className={`${config.color} hover:${config.color}`}>
        {config.text}
      </Badge>;
  };
  if (isLoading) {
    return <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">加载中...</div>
      </div>;
  }
  if (localRecords.length === 0) {
    return <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">暂无错题记录</div>
      </div>;
  }
  const isEditing = itemId => editingItemId === itemId;
  return <div className="space-y-4">
      {localRecords.map(record => {
      const editing = isEditing(record._id);
      return <Card key={record._id} className="bg-white">
            <CardContent className="p-6">
              {/* 第一行：学生信息 + 提交时间 + 典型错题开关 */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {!hideStudentInfo && <>
                      {record.className && <Badge variant="outline" className="bg-blue-50">
                          {record.className}
                        </Badge>}
                      {record.studentName && <Badge variant="outline" className="bg-green-50">
                          {record.studentName}
                        </Badge>}
                    </>}
                  {hideStudentInfo && <Badge variant="outline" className="bg-gray-50">
                      学生信息已隐藏
                    </Badge>}
                  <span className="text-sm text-gray-600">
                    提交时间：{formatDate(record.created)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id={`typical-${record._id}`} checked={record.isTypicalMistake || false} onCheckedChange={() => handleTypicalMistakeToggle(record._id, record.isTypicalMistake)} />
                  <Label htmlFor={`typical-${record._id}`} className="cursor-pointer text-sm">
                    典型错题
                  </Label>
                </div>
              </div>

              {/* 第二行：状态信息 */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-wrap gap-2">
                  {getCorrectionStatusBadge(record)}
                  {getResubmittedBadge(record.hasResubmittedAnswer)}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Badge variant="outline">{record.questionType}</Badge>
                  {getDifficultyBadge(record.difficulty || "未知")}
                </div>
              </div>

              {/* 图片区域 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    首次做题
                  </div>
                  <div className="relative bg-gray-100 rounded border overflow-hidden">
                    {record.imageUrl ? <a href={record.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <BaseImage src={record.imageUrl} alt="首次做题" width={800} height={600} className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                      </a> : <div className="w-full h-32 flex items-center justify-center">
                        <span className="text-sm text-gray-400">无图片</span>
                      </div>}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    重做图片
                  </div>
                  <div className="relative bg-gray-100 rounded border overflow-hidden">
                    {record.redoImageUrl ? <a href={record.redoImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <BaseImage src={record.redoImageUrl} alt="重做图片" width={800} height={600} className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                      </a> : <div className="w-full h-32 flex items-center justify-center">
                        <span className="text-sm text-gray-400">无图片</span>
                      </div>}
                  </div>
                </div>
              </div>

              {/* 学生答案 */}
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  学生答案：
                </div>
                {editing ? <Input value={editingData?.answerValue.join(" ; ") || ""} onChange={e => setEditingData(prev => prev ? {
              ...prev,
              answerValue: e.target.value.split(";").map(s => s.trim())
            } : null)} placeholder="多个答案用分号分隔" /> : <div className="text-sm text-gray-600">
                    {record.answerValue && record.answerValue.length > 0 ? record.answerValue.join(" ; ") : "无答案"}
                  </div>}
              </div>

              {/* 错误解析 */}
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  错误解析：
                </div>
                {editing ? <Input value={editingData?.parse.join(" ; ") || ""} onChange={e => setEditingData(prev => prev ? {
              ...prev,
              parse: e.target.value.split(";").map(s => s.trim())
            } : null)} placeholder="多个解析用分号分隔" /> : <div className="text-sm text-gray-600">
                    {record.parse && record.parse.length > 0 ? record.parse.join(" ; ") : "无解析"}
                  </div>}
              </div>

              {/* 错误归因 */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  错误归因：
                </div>
                {editing ? <MistakePointSelector mistakePoints={allMistakePoints} selectedMistakePointIds={editingData?.mistakePointIds || []} onMistakePointsChange={ids => setEditingData(prev => prev ? {
              ...prev,
              mistakePointIds: ids
            } : null)} /> : <div className="text-sm text-gray-600">
                    {record.mistakePoints && record.mistakePoints.length > 0 ? record.mistakePoints.map(mp => mp.name).join(" ; ") : "暂无错误归因"}
                  </div>}
              </div>

              {/* 底部操作栏 */}
              <div className="flex justify-between items-center">
                {/* 知识点列表 */}
                <div className="flex flex-wrap gap-2">
                  {record.knowledgePoints && record.knowledgePoints.length > 0 ? record.knowledgePoints.map((kp, index) => <Badge key={index} variant="outline" className="bg-purple-50">
                        {kp}
                      </Badge>) : <span className="text-xs text-gray-400">无知识点标注</span>}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  {editing ? <>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                        <X className="h-4 w-4 mr-1" />
                        取消
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleSaveEdit(record)} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? "保存中..." : "保存"}
                      </Button>
                    </> : <>
                      <Button variant="outline" size="sm" onClick={() => handleStartEdit(record)}>
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleDiagnose(record)}>
                        <Brain className="h-4 w-4 mr-1" />
                        诊断题目
                      </Button>
                    </>}
                </div>
              </div>
            </CardContent>
          </Card>;
    })}
    </div>;
}
