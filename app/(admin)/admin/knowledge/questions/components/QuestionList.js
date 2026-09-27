"use client";

import { ExternalLink, FileText } from "lucide-react";
// 题目列表组件，用于显示指定知识点下的所有题目
import { useEffect, useState } from "react";
import { getQuestionsByKnowledgePoint } from "../actions.js";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";

// 全局常量：每页显示的题目数量
const QUESTIONS_PER_PAGE = 10;
export default function QuestionList({
  knowledgePoint,
  color
}) {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 加载题目数据
  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);
        const result = await getQuestionsByKnowledgePoint(knowledgePoint, currentPage, QUESTIONS_PER_PAGE);
        setQuestions(result.questions);
        setTotal(result.total);
      } catch (error) {
        console.error("加载题目失败:", error);
        setQuestions([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [knowledgePoint, currentPage]);

  // 当知识点变化时重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [knowledgePoint]);

  // 获取难度颜色
  const getDifficultyColor = difficulty => {
    switch (difficulty) {
      case "容易":
        return "bg-green-100 text-green-800";
      case "中等":
        return "bg-yellow-100 text-yellow-800";
      case "困难":
        return "bg-orange-100 text-orange-800";
      case "超难":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 获取题目类型颜色
  const getQuestionTypeColor = type => {
    switch (type) {
      case "选择题":
        return "bg-blue-100 text-blue-800";
      case "填空题":
        return "bg-purple-100 text-purple-800";
      case "解答题":
        return "bg-indigo-100 text-indigo-800";
      case "算术题":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 处理页面变更
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // 计算总页数
  const totalPages = Math.ceil(total / QUESTIONS_PER_PAGE);

  // 生成编辑链接
  const getEditUrl = (type, examPaperId, pageNumber, questionNumber) => {
    // 构建基础 URL
    let url = `/admin/exam-papers/${examPaperId}/questions/${pageNumber}/${questionNumber}/`;

    // 根据类型添加路径
    url += type === "content" ? "edit-content" : "edit-image";

    // 添加查询参数
    const params = new URLSearchParams();
    params.set("from_knowledge_page", currentPage.toString());
    return `${url}?${params.toString()}`;
  };
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2" style={{
          color
        }}>
            <FileText className="h-5 w-5" />
            <span>题目列表</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between" style={{
        color
      }}>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{knowledgePoint ? `知识点题目` : "所有题目"}</span>
            <Badge variant="secondary" style={{
            backgroundColor: `${color}20`,
            color
          }}>
              {total} 道题目
            </Badge>
          </div>
          {/* 分页控制移到右上角 */}
          {totalPages > 1 && <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="question_page" className="w-fit mx-0" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 ? <div className="text-center py-8">
            <div className="text-gray-500">
              {knowledgePoint ? "该知识点暂无相关题目" : "暂无题目数据"}
            </div>
          </div> : <div className="space-y-6">
            <div className="space-y-6">
              {questions.map(question => <div key={question._id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                  {/* 题目头部信息 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {question.questionType && <Badge className={getQuestionTypeColor(question.questionType)}>
                          {question.questionType}
                        </Badge>}
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="outline" size="sm" onClick={() => window.open(getEditUrl("content", question.examPaperId, question.pageNumber, question.questionNumber), "_blank")} title="修改题目内容">
                        <FileText className="h-4 w-4 mr-1" />
                        修改内容
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(getEditUrl("image", question.examPaperId, question.pageNumber, question.questionNumber), "_blank")} title="修改题目图片">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        修改图片
                      </Button>
                    </div>
                  </div>

                  {/* 题目图片 */}
                  {question.imageUrl && <div className="mb-4">
                      <BaseImage src={question.imageUrl} alt="题目图片" width={800} height={400} className="max-w-full h-auto rounded-lg border border-gray-200" style={{
                maxHeight: "400px"
              }} />
                    </div>}

                  {/* 关联的知识点 */}
                  {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          关联知识点：
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {question.knowledgePoints.map((point, index) => <Badge key={index} variant="outline" className="text-xs">
                              {point}
                            </Badge>)}
                        </div>
                      </div>}

                  {/* 答案 */}
                  {question.answer && question.answer.length > 0 && <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        答案：
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        {question.answer.map((ans, index) => <div key={index} className="text-sm text-green-800">
                            {ans}
                          </div>)}
                      </div>
                    </div>}

                  {/* 解析 */}
                  {question.parse && question.parse.length > 0 && <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        解析：
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        {question.parse.map((parseText, index) => <div key={index} className="text-sm text-blue-800 mb-1">
                            {parseText}
                          </div>)}
                      </div>
                    </div>}

                  {/* 容易做错的细节 */}
                  {question.easyToMistakeDetail && question.easyToMistakeDetail.length > 0 && <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          容易做错的细节：
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          {question.easyToMistakeDetail.map((detail, index) => <div key={index} className="text-sm text-red-800 mb-1 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{detail}</span>
                            </div>)}
                        </div>
                      </div>}
                </div>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
}
