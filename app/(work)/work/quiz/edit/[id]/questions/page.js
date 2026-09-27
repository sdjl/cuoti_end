"use client";

import { ArrowLeft, FileText, List, Save, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 管理口述核心知识点题目页面，用于搜索、添加、删除和编辑题目
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { getQuizAction, searchQuestionsAction, updateQuizQuestionsAction } from "./actions.js";
import QuestionList from "./components/QuestionList.js";
import QuestionSearch from "./components/QuestionSearch.js";
import QuestionSearchResults from "./components/QuestionSearchResults.js";

// 题目操作状态

// 题目状态

export default function QuizQuestionsPage() {
  const params = useParams();
  const quizId = params.id;
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();

  // 状态管理
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 题目状态
  const [questionStates, setQuestionStates] = useState(new Map());
  const [originalQuestionIds, setOriginalQuestionIds] = useState([]);

  // 搜索结果
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // parse变更跟踪
  const [parseChanges, setParseChanges] = useState(new Map());

  // 位置记录功能
  const [previousScrollPosition, setPreviousScrollPosition] = useState(0);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取口述核心知识点数据
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const quizData = await getQuizAction(quizId);
        if (!quizData) {
          toast({
            title: "获取失败",
            description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}不存在或无权限访问`,
            variant: "destructive"
          });
          router.push("/work/quiz/list");
          return;
        }
        setQuiz(quizData);

        // 初始化题目状态
        const questionIds = quizData.questionIds || [];
        setOriginalQuestionIds([...questionIds]);

        // 如果有题目，获取题目详情
        if (questionIds.length > 0) {
          // 这里需要根据questionIds获取ExamQuestionDoc数据
          // 暂时先设置为空的Map，后续实现
          setQuestionStates(new Map());
        }
      } catch (error) {
        console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据失败:`, error);
        toast({
          title: "获取失败",
          description: `获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据时发生错误`,
          variant: "destructive"
        });
        router.push("/work/quiz/list");
      } finally {
        setIsLoading(false);
      }
    };
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, toast, router]);

  // 搜索题目
  const handleSearch = async params => {
    try {
      setIsSearching(true);
      const results = await searchQuestionsAction(params);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error("搜索题目失败:", error);
      toast({
        title: "搜索失败",
        description: "搜索题目时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 重置搜索
  const handleReset = () => {
    setSearchResults([]);
    setHasSearched(false);
  };

  // 添加题目到口述核心知识点
  const handleAddQuestion = question => {
    // 检查题目是否已存在
    const isQuestionExists = originalQuestionIds.includes(question._id) || questionStates.has(question._id) && questionStates.get(question._id)?.action !== "removed";
    if (isQuestionExists) {
      toast({
        title: "添加失败",
        description: "此题目已存在",
        variant: "destructive"
      });
      return;
    }
    setQuestionStates(prev => {
      const newMap = new Map(prev);
      const existingState = newMap.get(question._id);
      if (existingState) {
        // 如果之前是删除状态，现在改为正常状态
        if (existingState.action === "removed") {
          newMap.set(question._id, {
            question,
            action: null
          });
        }
      } else {
        // 新添加的题目
        newMap.set(question._id, {
          question,
          action: "added"
        });
      }
      return newMap;
    });
  };

  // 从口述核心知识点中移除题目
  const handleRemoveQuestion = questionId => {
    setQuestionStates(prev => {
      const newMap = new Map(prev);
      const existingState = newMap.get(questionId);
      if (existingState) {
        if (existingState.action === "added") {
          // 如果是新添加的，直接删除
          newMap.delete(questionId);
        } else {
          // 标记为删除
          newMap.set(questionId, {
            ...existingState,
            action: "removed"
          });
        }
      } else {
        // 如果是原始题目，标记为删除
        // 题目数据会从QuestionList的loadedQuestions中获取
        newMap.set(questionId, {
          question: undefined,
          action: "removed"
        });
      }
      return newMap;
    });
  };

  // 撤销删除题目
  const handleUndoRemove = questionId => {
    setQuestionStates(prev => {
      const newMap = new Map(prev);
      const existingState = newMap.get(questionId);
      if (existingState && existingState.action === "removed") {
        if (originalQuestionIds.includes(questionId)) {
          // 如果是原始题目，恢复为正常状态
          // 如果state中没有题目数据，清除state让组件从loadedQuestions获取
          if (!existingState.question || Object.keys(existingState.question).length === 0) {
            newMap.delete(questionId);
          } else {
            newMap.set(questionId, {
              ...existingState,
              action: null
            });
          }
        } else {
          // 如果是新添加后又删除的，恢复为新添加状态
          newMap.set(questionId, {
            ...existingState,
            action: "added"
          });
        }
      }
      return newMap;
    });
  };

  // 处理parse变更
  const handleParseChange = (questionId, parse) => {
    setParseChanges(prev => {
      const newMap = new Map(prev);

      // 获取原始parse用于比较
      const originalParse = (() => {
        const state = questionStates.get(questionId);
        if (state?.question?.parse) {
          return state.question.parse;
        }
        // 从quiz的已加载题目中查找
        // 这里暂时直接设置，实际应该比较原始数据
        return [];
      })();

      // 直接比较原始数据，不过滤空行，保持用户编辑状态
      const isChanged = parse.length !== originalParse.length || parse.some((line, index) => line !== (originalParse[index] || ""));
      if (isChanged) {
        newMap.set(questionId, parse);
      } else {
        newMap.delete(questionId);
      }
      return newMap;
    });
  };

  // 保存更改
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // 计算最终的题目ID列表
      const finalQuestionIds = [];

      // 添加原有的题目（除了被标记删除的）
      originalQuestionIds.forEach(id => {
        const state = questionStates.get(id);
        if (!state || state.action !== "removed") {
          finalQuestionIds.push(id);
        }
      });

      // 添加新添加的题目
      questionStates.forEach((state, id) => {
        if (state.action === "added") {
          finalQuestionIds.push(id);
        }
      });

      // 验证所有题目都有解析
      // 先获取所有题目的详细信息
      let allQuestionsData = [];
      try {
        const {
          getQuestionsAction
        } = await import("./actions");
        allQuestionsData = await getQuestionsAction(finalQuestionIds);
      } catch (error) {
        console.error("获取题目数据失败:", error);
        toast({
          title: "保存失败",
          description: "获取题目数据失败",
          variant: "destructive"
        });
        return;
      }

      // 验证每个题目的解析
      for (const questionId of finalQuestionIds) {
        const changedParse = parseChanges.get(questionId);
        let originalParse = [];

        // 从获取的题目数据中找原始解析
        const questionData = allQuestionsData.find(q => q._id === questionId);
        if (questionData?.parse) {
          originalParse = questionData.parse;
        }
        const currentParse = changedParse || originalParse;
        const validParse = currentParse.filter(line => line.trim() !== "");
        if (validParse.length === 0) {
          toast({
            title: "保存失败",
            description: "所有题目都必须填写解析才能保存",
            variant: "destructive"
          });
          return;
        }
      }
      const result = await updateQuizQuestionsAction(quizId, finalQuestionIds, parseChanges);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "题目更新已保存"
        });

        // 更新状态
        setOriginalQuestionIds([...finalQuestionIds]);

        // 清除操作状态
        setQuestionStates(prev => {
          const newMap = new Map();
          prev.forEach((state, id) => {
            if (finalQuestionIds.includes(id)) {
              newMap.set(id, {
                ...state,
                action: null
              });
            }
          });
          return newMap;
        });

        // 清除parse变更状态
        setParseChanges(new Map());
      } else {
        toast({
          title: "保存失败",
          description: result.error || "保存题目时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存题目失败:", error);
      toast({
        title: "保存失败",
        description: "保存题目时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 检查是否有未保存的更改
  const hasUnsavedChanges = () => {
    // 检查题目状态变化
    const hasQuestionChanges = Array.from(questionStates.values()).some(state => state.action !== null);

    // 检查解析变化
    const hasParseChanges = parseChanges.size > 0;
    return hasQuestionChanges || hasParseChanges;
  };

  // 滚动到指定区域并记录当前位置
  const scrollToSection = sectionId => {
    // 记录当前滚动位置
    setPreviousScrollPosition(window.scrollY);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  // 返回到之前的位置
  const scrollToPreviousPosition = () => {
    const currentPosition = window.scrollY;
    window.scrollTo({
      top: previousScrollPosition,
      behavior: "smooth"
    });
    // 更新记录的位置为当前位置，这样可以反复跳转
    setPreviousScrollPosition(currentPosition);
  };
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="管理题目" showBackButton={true} backHref="/work/quiz/list" backText="返回列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-6xl">
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">加载中...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>;
  }
  if (!quiz) {
    return null;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`管理题目 - ${quiz.title}`} showBackButton={true} backHref="/work/quiz/list" backText="返回列表" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          {/* 操作栏 */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              当前题目数量:{" "}
              <span className="font-medium">{originalQuestionIds.length}</span>
              {hasUnsavedChanges() && <span className="ml-2 text-orange-600">（有未保存的更改）</span>}
            </div>
            <Button onClick={handleSave} disabled={!hasUnsavedChanges() || isSaving}>
              {isSaving ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </> : <>
                  <Save className="h-4 w-4 mr-2" />
                  保存更改
                </>}
            </Button>
          </div>

          <div className="space-y-6">
            {/* 搜索题目 */}
            <Card id="search-section">
              <CardHeader>
                <CardTitle>搜索题目</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionSearch subject={quiz.subject} onSearch={handleSearch} onReset={handleReset} isSearching={isSearching} />
              </CardContent>
            </Card>

            {/* 搜索结果 */}
            {hasSearched && <Card id="search-results-section">
                <CardHeader>
                  <CardTitle>搜索结果 ({searchResults.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResults.length > 0 ? <QuestionSearchResults searchResults={searchResults} questionStates={questionStates} onAddQuestion={handleAddQuestion} /> : <div className="text-center py-8 text-gray-500">
                      <p>找不到题目</p>
                      <p className="text-sm">请尝试调整搜索条件</p>
                    </div>}
                </CardContent>
              </Card>}

            {/* 当前题目列表 */}
            <Card id="current-questions-section">
              <CardHeader>
                <CardTitle>当前题目列表</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionList questionStates={questionStates} originalQuestionIds={originalQuestionIds} onRemoveQuestion={handleRemoveQuestion} onUndoRemove={handleUndoRemove} onParseChange={handleParseChange} parseChanges={parseChanges} />
              </CardContent>
            </Card>

            {/* AI提示信息 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">重要提示</p>
                  <p>
                    小程序中AI会根据您填写的题目解析来与学生的语音回答进行比较，判断学生是否通过，因此解析是必须填写的。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 浮动导航按钮 */}
          <div className="fixed bottom-6 right-6 flex flex-col space-y-2 z-50">
            <Button size="sm" variant="outline" className="bg-white shadow-lg border-2 hover:bg-gray-50" onClick={() => scrollToSection("search-section")} title="跳转到搜索区域">
              <Search className="h-4 w-4" />
            </Button>

            {hasSearched && <Button size="sm" variant="outline" className="bg-white shadow-lg border-2 hover:bg-gray-50" onClick={() => scrollToSection("search-results-section")} title="跳转到搜索结果">
                <FileText className="h-4 w-4" />
              </Button>}

            <Button size="sm" variant="outline" className="bg-white shadow-lg border-2 hover:bg-gray-50" onClick={() => scrollToSection("current-questions-section")} title="跳转到当前题目">
              <List className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="outline" className="bg-white shadow-lg border-2 hover:bg-gray-50" onClick={scrollToPreviousPosition} title="返回上一个位置">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>;
}
