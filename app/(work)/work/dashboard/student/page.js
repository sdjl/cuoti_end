"use client";

/**
 * 学生学情看板页面
 *
 * 注意：此页面查看的是某个学生在所有班级中的某个科目的综合数据，
 * 而不是这个学生在某个班级中的数据。
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getStudentClassroomsAction, getStudentKnowledgeCategories, getStudentKnowledgeStats, getStudentMistakePoints } from "./actions.js";
import AnswerRecordsList from "./components/AnswerRecordsList.js";
import FloatingNav from "./components/FloatingNav.js";
import KnowledgeCategoryAnalysis from "./components/KnowledgeCategoryAnalysis.js";
import KnowledgePointTree from "./components/KnowledgePointTree.js";
import MistakePointsChart from "./components/MistakePointsChart.js";
import PDFFilesList from "./components/PDFFilesList.js";
import QuizRecordsList from "./components/QuizRecordsList.js";
import StudentClassroomsList from "./components/StudentClassroomsList.js";
import StudentNameFloat from "./components/StudentNameFloat.js";
import StudentSearchBar from "./components/StudentSearchBar.js";
export default function StudentDashboardPage() {
  const {
    user,
    loading,
    error
  } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [knowledgeStats, setKnowledgeStats] = useState([]);
  const [knowledgeCategories, setKnowledgeCategories] = useState(null);
  const [mistakePoints, setMistakePoints] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // 处理学生和科目选择
  const handleSelectStudent = (student, subject) => {
    setSelectedStudent(student);
    setSelectedSubject(subject);
  };

  // 当选中学生和科目时加载该学生的数据
  useEffect(() => {
    if (selectedStudent && selectedSubject) {
      loadStudentData(selectedStudent._id, selectedSubject);
    }
  }, [selectedStudent, selectedSubject]);
  async function loadStudentData(studentId, subject) {
    setDataLoading(true);
    try {
      const [knowledgeResult, knowledgeCategoriesResult, mistakePointResult, classroomsResult] = await Promise.all([getStudentKnowledgeStats(studentId, subject), getStudentKnowledgeCategories(studentId, subject), getStudentMistakePoints(studentId, subject), getStudentClassroomsAction(studentId)]);
      if (knowledgeResult.success) setKnowledgeStats(knowledgeResult.data);
      if (knowledgeCategoriesResult.success) setKnowledgeCategories(knowledgeCategoriesResult.data);
      if (mistakePointResult.success) setMistakePoints(mistakePointResult.data);
      setClassrooms(classroomsResult);
    } finally {
      setDataLoading(false);
    }
  }
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
      <WorkHeader title="学生学情看板" showBackButton backHref="/work" backText="返回学情看板" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-7xl">
          {/* 学生搜索栏 */}
          <StudentSearchBar onSelectStudent={handleSelectStudent} selectedStudent={selectedStudent} selectedSubject={selectedSubject} />

          {/* 浮动学生姓名栏 - 滚动时显示 */}
          {selectedStudent && <StudentNameFloat student={selectedStudent} />}

          {/* 未选中学生时的提示 */}
          {!selectedStudent && <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">请先选择学生</h2>
              <p className="text-gray-600">
                在上方搜索框中输入学生姓名或编号，选择要查看的学生
              </p>
            </div>}

          {/* 已选中学生时显示数据 */}
          {selectedStudent && (dataLoading ? <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载学生数据...</p>
              </div> : <>
                <div className="space-y-6">
                  {/* 知识点掌握情况 - 总是显示 */}
                  <div id="knowledge-tree">
                    <KnowledgePointTree data={knowledgeStats} studentId={selectedStudent?._id} />
                  </div>

                  {/* 近期提交答卷 */}
                  <div id="answer-records">
                    <AnswerRecordsList studentId={selectedStudent._id} studentName={selectedStudent.name} classrooms={classrooms} />
                  </div>

                  {/* 知识点掌握情况分析统计 */}
                  {knowledgeCategories && <div id="knowledge-category">
                      <KnowledgeCategoryAnalysis data={knowledgeCategories} />
                    </div>}

                  {/* 错误归因统计 */}
                  {mistakePoints.length > 0 && <div id="mistake-points">
                      <MistakePointsChart data={mistakePoints} />
                    </div>}

                  {/* 近期关联文件 */}
                  {selectedSubject && <div id="pdf-files">
                      <PDFFilesList studentId={selectedStudent._id} subject={selectedSubject} />
                    </div>}

                  {/* 成长记录观察 */}
                  {selectedStudent && <div id="quiz-records">
                      <QuizRecordsList studentId={selectedStudent._id} />
                    </div>}

                  {/* 加入的班级 */}
                  {selectedStudent && selectedSubject && classrooms.length > 0 && <div id="student-classrooms">
                        <StudentClassroomsList studentId={selectedStudent._id} classrooms={classrooms} subject={selectedSubject} />
                      </div>}
                </div>

                {/* 浮动导航 */}
                <FloatingNav />
              </>)}
        </div>
      </main>
    </div>;
}
