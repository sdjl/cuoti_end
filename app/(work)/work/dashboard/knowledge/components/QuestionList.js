"use client";

/**
 * 题目列表组件
 *
 * 依赖的 Server Action:
 * - app/(work)/work/dashboard/knowledge/componentsServerActions/questionListActions.ts
 */
import { FileText, RotateCcw, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
export default function QuestionList({
  questions,
  isLoading = false
}) {
  // 输入状态（用户输入但未搜索）
  const [keywordInput, setKeywordInput] = useState("");
  const [difficultyInput, setDifficultyInput] = useState("all");
  const [questionTypeInput, setQuestionTypeInput] = useState("all");
  const [sortByInput, setSortByInput] = useState("wrongCount");

  // 实际过滤状态（点击搜索后生效）
  const [keyword, setKeyword] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [questionType, setQuestionType] = useState("all");
  const [sortBy, setSortBy] = useState("wrongCount");

  // 处理搜索
  const handleSearch = () => {
    setKeyword(keywordInput);
    setDifficulty(difficultyInput);
    setQuestionType(questionTypeInput);
    setSortBy(sortByInput);
  };

  // 处理重置
  const handleReset = () => {
    setKeywordInput("");
    setDifficultyInput("all");
    setQuestionTypeInput("all");
    setSortByInput("wrongCount");
    setKeyword("");
    setDifficulty("all");
    setQuestionType("all");
    setSortBy("wrongCount");
  };

  // 过滤和排序
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = [...questions];

    // 关键词过滤
    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(q => q.questionText?.toLowerCase().includes(lowerKeyword) || q.knowledgePoints?.some(kp => kp.toLowerCase().includes(lowerKeyword)) || q.answer?.some(ans => ans.toLowerCase().includes(lowerKeyword)));
    }

    // 难度过滤
    if (difficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    // 题目类型过滤
    if (questionType !== "all") {
      filtered = filtered.filter(q => q.questionType === questionType);
    }

    // 排序
    if (sortBy === "wrongCount") {
      filtered.sort((a, b) => b.wrongCount - a.wrongCount);
    } else {
      filtered.sort((a, b) => (b.created || 0) - (a.created || 0));
    }
    return filtered;
  }, [questions, keyword, difficulty, questionType, sortBy]);
  if (isLoading) {
    return <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
        <div className="text-center text-gray-500">正在加载题目列表...</div>
      </div>;
  }
  if (questions.length === 0) {
    return <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
        <div className="text-center text-gray-500">该知识点暂无题目</div>
      </div>;
  }
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">题目列表</h2>
        <span className="text-sm text-gray-500 ml-auto">
          共 {filteredAndSortedQuestions.length} 道题目
        </span>
      </div>

      {/* 过滤器 - 响应式布局 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* 关键词搜索 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <Input placeholder="搜索题目内容、知识点、答案..." value={keywordInput} onChange={e => setKeywordInput(e.target.value)} className="flex-1 min-w-0" />
          </div>

          {/* 过滤和排序选项 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 难度过滤 */}
            <Select value={difficultyInput} onValueChange={setDifficultyInput}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部难度</SelectItem>
                <SelectItem value="容易">容易</SelectItem>
                <SelectItem value="中等">中等</SelectItem>
                <SelectItem value="困难">困难</SelectItem>
                <SelectItem value="超难">超难</SelectItem>
                <SelectItem value="未知">未知</SelectItem>
              </SelectContent>
            </Select>

            {/* 题目类型过滤 */}
            <Select value={questionTypeInput} onValueChange={setQuestionTypeInput}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="选择题">选择题</SelectItem>
                <SelectItem value="填空题">填空题</SelectItem>
                <SelectItem value="解答题">解答题</SelectItem>
                <SelectItem value="算术题">算术题</SelectItem>
              </SelectContent>
            </Select>

            {/* 排序方式 */}
            <Select value={sortByInput} onValueChange={value => setSortByInput(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wrongCount">按错误次数排序</SelectItem>
                <SelectItem value="created">按创建时间排序</SelectItem>
              </SelectContent>
            </Select>

            {/* 搜索按钮 */}
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 lg:px-6">
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>

            {/* 重置按钮 */}
            <Button onClick={handleReset} variant="outline" className="px-4 lg:px-6">
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
          </div>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="space-y-6 max-w-full">
        {filteredAndSortedQuestions.map(question => <div key={question._id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors max-w-full">
            {/* 上部：题目图片 */}
            {question.imageUrl && <div className="w-full bg-white flex items-center justify-center p-4 max-w-full overflow-hidden">
                <div className="relative max-w-full">
                  <Image src={question.imageUrl} alt={`题目`} width={800} height={600} className="object-contain max-h-[400px] w-auto max-w-full" unoptimized />
                </div>
              </div>}

            {/* 分割线 */}
            <div className="border-t border-gray-200"></div>

            {/* 中部：题目信息 */}
            <div className="p-4 bg-white max-w-full overflow-hidden">
              {/* 题目类型、难度和查看错题按钮 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded flex-shrink-0">
                  {question.questionType}
                </span>
                <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${question.difficulty === "容易" ? "bg-green-100 text-green-700" : question.difficulty === "中等" ? "bg-yellow-100 text-yellow-700" : question.difficulty === "困难" ? "bg-orange-100 text-orange-700" : question.difficulty === "超难" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                  {question.difficulty}
                </span>
                <div className="ml-auto flex-shrink-0">
                  <Link href={`/work/dashboard/knowledge/${question._id}`} target="_blank" rel="noopener noreferrer">
                    <button className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors whitespace-nowrap">
                      查看错题
                    </button>
                  </Link>
                </div>
              </div>

              {/* 答案 */}
              {question.answer && question.answer.length > 0 && <div className="mb-3 break-words">
                  <span className="text-xs font-semibold text-gray-600">
                    答案：
                  </span>
                  <span className="text-sm text-gray-700">
                    {question.answer.join("；")}
                  </span>
                </div>}

              {/* 知识点 */}
              {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="mb-3 flex items-start flex-wrap gap-1">
                    <span className="text-xs font-semibold text-gray-600 flex-shrink-0">
                      知识点：
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {question.knowledgePoints.map((kp, idx) => <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded break-all">
                          {kp}
                        </span>)}
                    </div>
                  </div>}
            </div>

            {/* 下部：统计数据 */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 max-w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                <div className="text-center min-w-0">
                  <div className="text-xs text-gray-500 mb-1">做题次数</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {question.totalAttempts}
                  </div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-xs text-gray-500 mb-1">正确次数</div>
                  <div className="text-lg font-semibold text-green-600">
                    {question.correctCount}
                  </div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-xs text-gray-500 mb-1">错误次数</div>
                  <div className="text-lg font-semibold text-red-600">
                    {question.wrongCount}
                  </div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-xs text-gray-500 mb-1">正确率</div>
                  <div className="text-lg font-semibold text-green-600">
                    {question.correctRate}%
                  </div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-xs text-gray-500 mb-1">错误率</div>
                  <div className="text-lg font-semibold text-red-600">
                    {question.wrongRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>)}
      </div>

      {/* 无结果提示 */}
      {filteredAndSortedQuestions.length === 0 && <div className="text-center py-12 text-gray-500">
          没有找到符合条件的题目
        </div>}
    </div>;
}
