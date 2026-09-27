"use client";

/**
 * 学生列表组件
 *
 * 显示内容：
 * - 选中的学生卡片列表
 * - 学生状态指示器（已保存、有错题未保存）
 * - 支持点击学生卡片进行错题录入
 */
import StudentCard from "./StudentCard.js";
export default function StudentList({
  selectedStudents,
  studentAnswers,
  selectedStudentId,
  onStudentClick
}) {
  return <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          选中的学生 ({selectedStudents.length})
        </h3>
        <div className="text-sm text-gray-600">
          点击学生卡片录入错题（上传图片时会保存答卷中图片部分）
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {selectedStudents.map(student => {
          const studentAnswer = studentAnswers.find(answer => answer.studentId === student._id);
          const hasErrors = (studentAnswer?.wrongQuestions?.length ?? 0) > 0;
          const isSaved = studentAnswer?.isSaved;
          return <div key={student._id} className="relative">
                <StudentCard student={student} isSelected={selectedStudentId === student._id} isSaved={isSaved || false} onClick={() => onStudentClick(student._id)} />
                {isSaved && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                {hasErrors && !isSaved && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>}
              </div>;
        })}
        </div>
      </div>
    </div>;
}
