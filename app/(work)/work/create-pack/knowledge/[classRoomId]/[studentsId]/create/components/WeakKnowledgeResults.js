"use client";

import { BookOpen, Info, Minus, Plus, Search } from "lucide-react";
// 薄弱知识点分析结果组件，用于显示薄弱知识点列表并支持选择知识点和查询相关题目
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../../../components/ui/checkbox.js";
import { Separator } from "../../../../../../../../../components/ui/separator.js";
import { queryQuestionsByConditions } from "../actions.js";
import QuestionsList from "./QuestionsList.js";
export default function WeakKnowledgeResults({
  results,
  loading = false,
  studentId,
  classRoomId,
  subject,
  timeRangeDescription
}) {
  const [knowledgePointsData, setKnowledgePointsData] = useState([]);
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(true);

  // 查询过滤器状态 - 默认勾选
  const [filterCompletedQuestions, setFilterCompletedQuestions] = useState(true);
  const [filterSemesterCourseQuestions, setFilterSemesterCourseQuestions] = useState(true);
  const [filterGeneratedPackQuestions, setFilterGeneratedPackQuestions] = useState(true);

  // 题目类型过滤器状态 - 默认全部勾选
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState(new Set(["选择题", "填空题", "解答题", "算术题"]));

  // 题目难度过滤器状态 - 默认全部勾选
  const [selectedDifficultyLevels, setSelectedDifficultyLevels] = useState(new Set(["容易", "中等", "困难", "超难", "未知"]));

  // 查询题目状态
  const [questionsData, setQuestionsData] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [hasQueriedQuestions, setHasQueriedQuestions] = useState(false);

  // 当结果变化时，初始化数据
  useEffect(() => {
    if (results.length > 0) {
      const dataWithQuantity = results.map(item => ({
        ...item,
        questionQuantity: 2 // 默认每个知识点2道题目
      }));
      setKnowledgePointsData(dataWithQuantity);
      const allPoints = new Set(results.map(item => item.knowledgePoint));
      setSelectedKnowledgePoints(allPoints);
      setIsAllSelected(true);
    }
  }, [results]);

  // 处理单个知识点的选择
  const handleKnowledgePointToggle = (knowledgePoint, checked) => {
    const newSelected = new Set(selectedKnowledgePoints);
    if (checked) {
      newSelected.add(knowledgePoint);
    } else {
      newSelected.delete(knowledgePoint);
    }
    setSelectedKnowledgePoints(newSelected);
    setIsAllSelected(newSelected.size === knowledgePointsData.length);
  };

  // 处理全选/取消全选
  const handleSelectAll = checked => {
    if (checked) {
      const allPoints = new Set(knowledgePointsData.map(item => item.knowledgePoint));
      setSelectedKnowledgePoints(allPoints);
    } else {
      setSelectedKnowledgePoints(new Set());
    }
    setIsAllSelected(checked);
  };

  // 处理题目类型选择
  const handleQuestionTypeToggle = (questionType, checked) => {
    const newSelected = new Set(selectedQuestionTypes);
    if (checked) {
      newSelected.add(questionType);
    } else {
      newSelected.delete(questionType);
    }
    setSelectedQuestionTypes(newSelected);
  };

  // 处理题目难度选择
  const handleDifficultyLevelToggle = (difficulty, checked) => {
    const newSelected = new Set(selectedDifficultyLevels);
    if (checked) {
      newSelected.add(difficulty);
    } else {
      newSelected.delete(difficulty);
    }
    setSelectedDifficultyLevels(newSelected);
  };

  // 处理单个知识点题目数量变更
  const handleQuantityChange = (knowledgePoint, change) => {
    setKnowledgePointsData(prev => prev.map(item => {
      if (item.knowledgePoint === knowledgePoint) {
        const newQuantity = Math.max(1, Math.min(20, item.questionQuantity + change)); // 限制在1-20之间
        return {
          ...item,
          questionQuantity: newQuantity
        };
      }
      return item;
    }));
  };

  // 处理全部知识点题目数量变更
  const handleAllQuantityChange = change => {
    setKnowledgePointsData(prev => prev.map(item => ({
      ...item,
      questionQuantity: Math.max(1, Math.min(20, item.questionQuantity + change))
    })));
  };

  // 计算总题目数量
  const getTotalQuestionQuantity = () => {
    return knowledgePointsData.filter(item => selectedKnowledgePoints.has(item.knowledgePoint)).reduce((sum, item) => sum + item.questionQuantity, 0);
  };

  // 处理查询题目
  const handleQueryQuestions = async () => {
    const selectedData = knowledgePointsData.filter(item => selectedKnowledgePoints.has(item.knowledgePoint));
    if (selectedData.length === 0) {
      alert("请选择至少一个知识点");
      return;
    }
    setQuestionsLoading(true);
    setHasQueriedQuestions(true);
    try {
      const result = await queryQuestionsByConditions({
        studentId,
        classRoomId,
        knowledgePoints: selectedData,
        filters: {
          filterCompletedQuestions,
          filterSemesterCourseQuestions,
          filterGeneratedPackQuestions
        },
        questionTypes: Array.from(selectedQuestionTypes),
        difficultyLevels: Array.from(selectedDifficultyLevels),
        subject
      });
      if (result.success && result.data) {
        setQuestionsData(result.data);
        console.log("查询题目成功:", result.data);
      } else {
        console.error("查询题目失败:", result.error);
        alert(`查询失败: ${result.error || "未知错误"}`);
        setQuestionsData([]);
      }
    } catch (error) {
      console.error("查询题目失败:", error);
      alert(`查询失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setQuestionsData([]);
    } finally {
      setQuestionsLoading(false);
    }
  };
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            薄弱知识点分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">分析中...</div>
          </div>
        </CardContent>
      </Card>;
  }
  if (knowledgePointsData.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            薄弱知识点分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">暂无数据</div>
            <p className="text-sm text-gray-400 mt-2">
              在选定条件下未找到错题数据
            </p>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            薄弱知识点分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 统计信息 - 左中右对齐 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                共发现{" "}
                <Badge variant="outline">{knowledgePointsData.length}</Badge>{" "}
                个薄弱知识点
              </span>
              <span className="text-gray-600">
                总错误次数：
                <Badge variant="destructive" className="text-white">
                  {knowledgePointsData.reduce((sum, item) => sum + item.mistakeCount, 0)}
                </Badge>
              </span>
              <span className="text-gray-600">
                预计题目数：
                <Badge variant="default">{getTotalQuestionQuantity()}</Badge>
              </span>
            </div>
          </div>

          {/* 全选控制和批量题目数量控制合并 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox id="select-all" checked={isAllSelected} onCheckedChange={handleSelectAll} />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                {isAllSelected ? "取消全选" : "全选"}
              </label>
              <span className="text-sm text-gray-600 ml-2">
                已选择 {selectedKnowledgePoints.size} 个知识点
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                批量调整题目数量上限：
              </span>
              <Button variant="outline" size="sm" onClick={() => handleAllQuantityChange(-1)} className="h-8 w-8 p-0">
                <Minus className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAllQuantityChange(1)} className="h-8 w-8 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* 知识点列表 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {knowledgePointsData.map((item, index) => <div key={item.knowledgePoint} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox id={`knowledge-${index}`} checked={selectedKnowledgePoints.has(item.knowledgePoint)} onCheckedChange={checked => handleKnowledgePointToggle(item.knowledgePoint, !!checked)} />
                  <label htmlFor={`knowledge-${index}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{item.knowledgePoint}</div>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  {/* 题目数量控制 */}
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleQuantityChange(item.knowledgePoint, -1)} className="h-6 w-6 p-0" disabled={item.questionQuantity <= 1}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm w-8 text-center">
                      {item.questionQuantity}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleQuantityChange(item.knowledgePoint, 1)} className="h-6 w-6 p-0" disabled={item.questionQuantity >= 20}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <Badge variant="destructive" className="text-xs text-white">
                    错误 {item.mistakeCount} 次
                  </Badge>
                  <div className="text-xs text-gray-500">#{index + 1}</div>
                </div>
              </div>)}
          </div>

          <Separator />

          {/* 查询过滤器 - 三列布局 */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 第一列：过滤条件 */}
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-600 mb-3">
                  过滤条件
                </h5>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 border rounded-lg p-3 bg-gray-50">
                    <Checkbox id="filter-semester" checked={filterSemesterCourseQuestions} onCheckedChange={checked => setFilterSemesterCourseQuestions(!!checked)} />
                    <label htmlFor="filter-semester" className="cursor-pointer text-sm">
                      过滤本学期课程题目
                    </label>
                  </div>
                  <div className="flex items-center gap-2 border rounded-lg p-3 bg-gray-50">
                    <Checkbox id="filter-generated-pack" checked={filterGeneratedPackQuestions} onCheckedChange={checked => setFilterGeneratedPackQuestions(!!checked)} />
                    <label htmlFor="filter-generated-pack" className="cursor-pointer text-sm">
                      过滤已生成题集中题目
                    </label>
                  </div>
                  <div className="flex items-center gap-2 border rounded-lg p-3 bg-gray-50">
                    <Checkbox id="filter-completed" checked={filterCompletedQuestions} onCheckedChange={checked => setFilterCompletedQuestions(!!checked)} />
                    <label htmlFor="filter-completed" className="cursor-pointer text-sm">
                      过滤本学期已做过的题目
                    </label>
                  </div>
                </div>
              </div>

              {/* 第二列：题目类型 */}
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-600 mb-3">
                  题目类型
                </h5>
                <div className="flex flex-wrap gap-3">
                  {["选择题", "填空题", "解答题", "算术题"].map(questionType => <div key={questionType} className="flex items-center gap-2 border rounded-lg p-3 bg-gray-50">
                        <Checkbox id={`question-type-${questionType}`} checked={selectedQuestionTypes.has(questionType)} onCheckedChange={checked => handleQuestionTypeToggle(questionType, !!checked)} />
                        <label htmlFor={`question-type-${questionType}`} className="cursor-pointer text-sm">
                          {questionType}
                        </label>
                      </div>)}
                </div>
              </div>

              {/* 第三列：题目难度 */}
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-600 mb-3">
                  题目难度
                </h5>
                <div className="flex flex-wrap gap-3">
                  {["容易", "中等", "困难", "超难", "未知"].map(difficulty => <div key={difficulty} className="flex items-center gap-2 border rounded-lg p-3 bg-gray-50">
                        <Checkbox id={`difficulty-${difficulty}`} checked={selectedDifficultyLevels.has(difficulty)} onCheckedChange={checked => handleDifficultyLevelToggle(difficulty, !!checked)} />
                        <label htmlFor={`difficulty-${difficulty}`} className="cursor-pointer text-sm">
                          {difficulty}
                        </label>
                      </div>)}
                </div>
              </div>
            </div>
          </div>

          {/* 温馨提示和查询题目按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-start gap-2 flex-1 mr-6">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                设置的题目数量仅为该知识点的查询上限，实际生成的题目数量可能会少于设置值，这取决于题库中该知识点的可用题目数量及过滤条件，且总数不会超过50题。
              </div>
            </div>

            <Button onClick={handleQueryQuestions} disabled={selectedKnowledgePoints.size === 0 || questionsLoading} className="flex items-center gap-2 flex-shrink-0">
              <Search className="w-4 h-4" />
              {questionsLoading ? "查询中..." : `查询题目 (${selectedKnowledgePoints.size}个知识点，${getTotalQuestionQuantity()}道题目)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 题目列表组件 */}
      {hasQueriedQuestions && <QuestionsList questions={questionsData} loading={questionsLoading} studentId={studentId} classRoomId={classRoomId} subject={subject} knowledgePoints={Array.from(selectedKnowledgePoints).map(kp => {
      const data = knowledgePointsData.find(item => item.knowledgePoint === kp);
      return {
        knowledgePoint: kp,
        mistakeCount: data?.mistakeCount || 0,
        questionQuantity: data?.questionQuantity || 0
      };
    })} timeRangeDescription={timeRangeDescription} />}
    </div>;
}
