"use client";

/**
 * 题集信息和提交统计组件
 *
 * 显示内容：
 * - 题集基本信息（名称、班级、课程、科目、题目数量）
 * - 学生提交统计（已选择学生数、未保存数、已保存数）
 */
export default function QuestionPackInfo({
  questionPack,
  classRoom,
  course,
  totalStudents,
  savedStudentsCount,
  unsavedStudentsCount
}) {
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {questionPack.name}
          </h2>
          <div className="text-sm text-gray-600">
            班级：{classRoom.name} | 课程：{course.name} | 科目：
            {course.subject} | 题目数量：{questionPack.questionIds.length} 道
          </div>
        </div>

        {/* 统计数据 */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalStudents}
            </div>
            <div className="text-xs text-gray-600">已选择学生</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {unsavedStudentsCount}
            </div>
            <div className="text-xs text-gray-600">未保存</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {savedStudentsCount}
            </div>
            <div className="text-xs text-gray-600">已保存</div>
          </div>
        </div>
      </div>
    </div>;
}
