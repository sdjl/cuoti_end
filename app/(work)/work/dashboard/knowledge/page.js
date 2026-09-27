"use client";

// 知识看板主页，串联班级选择、知识树与题目统计的交互流程
import Link from "next/link";
import { useState } from "react";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { calculateKnowledgePointStatsByClasses, getQuestionListByKnowledgePoint } from "./actions.js";
import ClassSelector from "./components/ClassSelector.js";
import FloatingNav from "./components/FloatingNav.js";
import KnowledgeMasteryStats from "./components/KnowledgeMasteryStats.js";
import KnowledgePointFloat from "./components/KnowledgePointFloat.js";
import KnowledgeTreeSelector from "./components/KnowledgeTreeSelector.js";
import QuestionList from "./components/QuestionList.js";
export default function KnowledgeDashboardPage() {
  const {
    user,
    loading,
    error
  } = useAuth();

  // 状态管理
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState(null);
  const [classStats, setClassStats] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // 处理班级和科目选择变化
  const handleSelectionChange = (classIds, subject) => {
    const subjectChanged = subject !== selectedSubject;
    const classIdsChanged = JSON.stringify(classIds) !== JSON.stringify(selectedClassIds);
    setSelectedSubject(subject);
    setSelectedClassIds(classIds);

    // 如果科目切换了，清空知识点选择和所有数据
    if (subjectChanged) {
      setSelectedKnowledgePoint(null);
      setClassStats([]);
      setQuestions([]);
      return;
    }

    // 如果班级切换了，且已选择知识点，则重新加载班级统计数据（不重新加载题目列表）
    if (classIdsChanged && selectedKnowledgePoint && classIds.length > 0) {
      loadClassStats(classIds, selectedKnowledgePoint.name, subject);
    }

    // 如果班级为空，清空班级统计数据
    if (classIds.length === 0) {
      setClassStats([]);
    }
  };

  // 加载班级统计数据
  const loadClassStats = async (classIds, knowledgePointName, subject) => {
    setIsLoadingStats(true);
    try {
      const stats = await calculateKnowledgePointStatsByClasses(classIds, knowledgePointName, subject);
      setClassStats(stats);
    } catch (error) {
      console.error("加载班级统计数据失败:", error);
      setClassStats([]);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // 处理知识点选择
  const handleKnowledgePointSelect = async (knowledgePoint, _path, isLeaf) => {
    // 如果是叶子节点，加载统计数据和题目列表
    if (isLeaf && selectedClassIds.length > 0 && selectedSubject) {
      // 转换为 KnowledgePointStat 格式用于显示
      const kpStat = {
        _id: knowledgePoint.name,
        name: knowledgePoint.name,
        level: knowledgePoint.level,
        totalAttempts: 0,
        correctCount: 0,
        wrongCount: 0,
        masteryRate: 0,
        studentCount: 0
      };
      setSelectedKnowledgePoint(kpStat);
      setIsLoadingStats(true);
      setIsLoadingQuestions(true);

      // 并行加载班级统计数据和题目列表
      try {
        const [stats, questionList] = await Promise.all([calculateKnowledgePointStatsByClasses(selectedClassIds, knowledgePoint.name, selectedSubject), getQuestionListByKnowledgePoint(knowledgePoint.name, selectedSubject)]);
        setClassStats(stats);
        setQuestions(questionList);
      } catch (error) {
        console.error("加载数据失败:", error);
        setClassStats([]);
        setQuestions([]);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingQuestions(false);
      }
    } else {
      // 非叶子节点，清空统计数据
      setSelectedKnowledgePoint(null);
      setClassStats([]);
      setQuestions([]);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">发生错误: {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            重新加载
          </button>
        </div>
      </div>;
  }
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未登录</p>
          <Link href="/login" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            去登录
          </Link>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="知识点学情看板" showBackButton backHref="/work" backText="返回学情看板" />

      <main className="flex-1 p-6 max-w-full overflow-hidden">
        <div className="container mx-auto max-w-7xl w-full">
          {/* 浮动知识点名称栏 - 滚动时显示 */}
          {selectedKnowledgePoint && <KnowledgePointFloat knowledgePoint={selectedKnowledgePoint} />}

          {/* 班级和科目选择 */}
          <div id="class-selector">
            <ClassSelector onSelectionChange={handleSelectionChange} />
          </div>

          {/* 知识点选择 */}
          {selectedSubject && <div id="knowledge-selector">
              <KnowledgeTreeSelector subject={selectedSubject} onKnowledgePointSelect={handleKnowledgePointSelect} />
            </div>}

          {/* 统计数据和题目列表 */}
          <div className="space-y-6">
            {/* 班级掌握情况统计 */}
            {selectedSubject && <>
                {/* 未选择班级的提示 */}
                {selectedClassIds.length === 0 && !selectedKnowledgePoint && <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
                    <div className="text-center text-gray-500">
                      请选择班级以查看统计数据
                    </div>
                  </div>}

                {/* 已选择班级但未选择知识点的提示 */}
                {selectedClassIds.length > 0 && !selectedKnowledgePoint && <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
                    <div className="text-center text-gray-500">
                      请在上方知识树中选择一个知识点
                    </div>
                  </div>}

                {/* 加载状态 */}
                {isLoadingStats && selectedKnowledgePoint && <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
                    <div className="text-center text-gray-500">
                      正在加载统计数据...
                    </div>
                  </div>}

                {/* 班级掌握情况统计数据 */}
                {!isLoadingStats && selectedKnowledgePoint && selectedClassIds.length > 0 && classStats.length > 0 && <div id="mastery-stats">
                      <KnowledgeMasteryStats data={classStats} knowledgePointName={selectedKnowledgePoint.name} />
                    </div>}

                {/* 未选择班级但已选择知识点的提示 */}
                {!isLoadingStats && selectedKnowledgePoint && selectedClassIds.length === 0 && <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
                      <div className="text-center text-gray-500">
                        请选择班级以查看统计数据
                      </div>
                    </div>}

                {/* 无统计数据提示 */}
                {!isLoadingStats && selectedKnowledgePoint && selectedClassIds.length > 0 && classStats.length === 0 && <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
                      <div className="text-center text-gray-500">
                        该知识点暂无统计数据
                      </div>
                    </div>}
              </>}

            {/* 题目列表 */}
            {selectedSubject && <>
                {/* 未选择知识点的提示 */}
                {!selectedKnowledgePoint && selectedClassIds.length > 0 && <div className="bg-white rounded-xl shadow-sm p-12 mb-6">
                    <div className="text-center text-gray-500">
                      请在上方知识树中选择一个知识点以查看题目列表
                    </div>
                  </div>}

                {/* 题目列表内容 */}
                {selectedKnowledgePoint && <div id="question-list">
                    <QuestionList questions={questions} isLoading={isLoadingQuestions} />
                  </div>}
              </>}
          </div>

          {/* 浮动导航 */}
          <FloatingNav />
        </div>
      </main>
    </div>;
}
