"use client";

import { RotateCcw, Trash2 } from "lucide-react";
// 题目列表组件，用于显示和管理口述核心知识点中的题目
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Textarea } from "../../../../../../../../components/ui/textarea.js";

// 题目操作状态

// 题目状态

export default function QuestionList({
  questionStates,
  originalQuestionIds,
  onRemoveQuestion,
  onUndoRemove,
  onParseChange,
  parseChanges
}) {
  const [loadedQuestions, setLoadedQuestions] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // 获取需要显示的题目列表
  const getDisplayQuestions = () => {
    const displayList = [];

    // 添加原有的题目（包括被标记删除的，因为要显示"即将删除"状态）
    originalQuestionIds.forEach(id => {
      const state = questionStates.get(id);
      const questionData = loadedQuestions.get(id) || state?.question;
      displayList.push({
        id,
        question: questionData,
        action: state?.action || null,
        isLoaded: loadedQuestions.has(id) || !!state?.question && !!questionData
      });
    });

    // 添加新添加的题目（但不包括被删除的新添加题目）
    questionStates.forEach((state, id) => {
      if (state.action === "added" && !originalQuestionIds.includes(id)) {
        displayList.push({
          id,
          question: state.question,
          action: state.action,
          isLoaded: true
        });
      }
    });
    return displayList;
  };

  // 加载题目详情
  useEffect(() => {
    const loadQuestionDetails = async () => {
      const needLoadIds = originalQuestionIds.filter(id => !loadedQuestions.has(id) && !questionStates.has(id));
      if (needLoadIds.length === 0) {
        return;
      }
      try {
        setIsLoading(true);
        // 动态导入actions来避免循环依赖
        const {
          getQuestionsAction
        } = await import("../actions");
        const questions = await getQuestionsAction(needLoadIds);

        // 将加载的题目设置到状态中
        if (questions && questions.length > 0) {
          const newLoadedQuestions = new Map(loadedQuestions);
          questions.forEach(question => {
            newLoadedQuestions.set(question._id, question);
          });
          setLoadedQuestions(newLoadedQuestions);
        }
      } catch (error) {
        console.error("加载题目详情失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestionDetails();
  }, [originalQuestionIds]);

  // 监听保存成功事件，更新已修改的解析到loadedQuestions中
  useEffect(() => {
    // 当parseChanges被清空时（说明保存成功了），更新loadedQuestions
    if (parseChanges.size === 0 && loadedQuestions.size > 0) {
      // 这里不需要做什么，因为parseChanges已经被清空了
      // 但我们需要确保下次加载时能获取到最新数据
    }
  }, [parseChanges, loadedQuestions]);

  // 新增：更新已加载题目的解析内容
  const updateLoadedQuestionParse = (questionId, parse) => {
    setLoadedQuestions(prev => {
      const newMap = new Map(prev);
      const question = newMap.get(questionId);
      if (question) {
        newMap.set(questionId, {
          ...question,
          parse
        });
      }
      return newMap;
    });
  };

  // 监听parseChanges，当保存成功清空后，更新loadedQuestions
  useEffect(() => {
    // 保存前先记录哪些题目有修改
    const modifiedIds = new Set(parseChanges.keys());
    return () => {
      // 如果parseChanges被清空了（保存成功），更新对应的loadedQuestions
      if (parseChanges.size === 0 && modifiedIds.size > 0) {
        setLoadedQuestions(prev => {
          const newMap = new Map(prev);
          modifiedIds.forEach(id => {
            const question = newMap.get(id);
            const state = questionStates.get(id);
            if (question && state?.question) {
              // 使用questionStates中的最新数据更新
              newMap.set(id, state.question);
            }
          });
          return newMap;
        });
      }
    };
  }, [parseChanges, questionStates]);
  const displayQuestions = getDisplayQuestions();

  // 检查是否有题目正在加载
  const hasLoadingQuestions = displayQuestions.some(item => !item.isLoaded);

  // 获取状态标记
  const getActionBadge = action => {
    switch (action) {
      case "added":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            新添加
          </Badge>;
      case "removed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            即将删除
          </Badge>;
      default:
        return null;
    }
  };
  if (displayQuestions.length === 0) {
    return <div className="text-center py-8 text-gray-500">
        <p>暂无题目</p>
        <p className="text-sm">请搜索并添加题目</p>
      </div>;
  }

  // 处理解析变更时同步更新loadedQuestions
  const handleParseChange = (questionId, parse) => {
    onParseChange(questionId, parse);

    // 如果这个修改被保存了，也要更新loadedQuestions
    // 这会在下一个渲染周期生效
    if (parseChanges.size === 0 || !parseChanges.has(questionId)) {
      updateLoadedQuestionParse(questionId, parse);
    }
  };
  return <div className="space-y-4">
      {/* 统一的加载提示 */}
      {isLoading && hasLoadingQuestions && <div className="flex items-center justify-center py-8">
          <div className="flex items-center text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            <span className="text-sm">正在加载题目详情...</span>
          </div>
        </div>}

      {!(isLoading && hasLoadingQuestions) && displayQuestions.map((item, index) => {
      // 获取当前显示的解析内容
      const currentParse = (() => {
        // 优先使用已修改的解析
        const changedParse = parseChanges.get(item.id);
        if (changedParse !== undefined) {
          return changedParse;
        }
        // 否则使用题目中的解析
        return item.question?.parse || [];
      })();
      return <div key={item.id} className={`border rounded-lg p-4 ${item.action === "removed" ? "opacity-50 bg-gray-50" : "bg-white"}`}>
              {/* 题目内容 */}
              {item.isLoaded && item.question ? <div>
                  {/* 第一行：题目图片 - 全宽度 */}
                  <div className="w-full mb-4">
                    {item.question.imageUrl && <BaseImage src={item.question.imageUrl} alt="题目图片" width={item.question.imageWidth || 800} height={item.question.imageHeight || 600} className="w-full" />}
                  </div>

                  {/* 解析编辑区域 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      题目解析
                    </label>
                    <Textarea value={currentParse.join("\n")} onChange={e => {
              const lines = e.target.value.split("\n");
              handleParseChange(item.id, lines);
            }} placeholder="请输入题目解析，每行一个解析内容..." rows={3} disabled={item.action === "removed"} className={item.action === "removed" ? "opacity-50" : ""} />
                    {parseChanges.has(item.id) && <div className="text-xs text-blue-600 mt-1">
                        * 解析已修改，点击保存生效
                      </div>}
                  </div>

                  {/* 信息行：左边序号、难度、答案、知识点，右边状态标记和删除按钮 */}
                  <div className="flex justify-between items-center">
                    {/* 左侧：序号、难度、答案、知识点 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600">
                        题目 {index + 1}
                      </span>
                      <Badge variant="outline">
                        {item.question.difficulty}
                      </Badge>

                      {/* 答案显示 */}
                      {item.question.answer && item.question.answer.length > 0 && <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">答案:</span>
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                              {item.question.answer.join("、")}
                            </Badge>
                          </div>}

                      {item.question.knowledgePoints && item.question.knowledgePoints.length > 0 && <div className="flex gap-1">
                            {item.question.knowledgePoints.map((point, idx) => <Badge key={idx} variant="secondary" className="text-xs">
                                {point}
                              </Badge>)}
                          </div>}
                    </div>

                    {/* 右侧：状态标记和操作按钮 */}
                    <div className="flex items-center gap-2">
                      {getActionBadge(item.action)}

                      {item.action !== "removed" && <Button variant="outline" size="sm" onClick={() => onRemoveQuestion(item.id)} title="删除题目">
                          <Trash2 className="h-3 w-3" />
                        </Button>}

                      {item.action === "removed" && <Button variant="outline" size="sm" onClick={() => {
                if (onUndoRemove) {
                  onUndoRemove(item.id);
                }
              }} title="撤销删除">
                          <RotateCcw className="h-3 w-3" />
                        </Button>}
                    </div>
                  </div>
                </div> :
        // 不显示单独的加载提示，使用统一的加载提示
        !isLoading && <div className="flex items-center justify-center py-4">
                    <div className="text-sm text-gray-400">
                      题目详情加载中...
                    </div>
                  </div>}
            </div>;
    })}
    </div>;
}
