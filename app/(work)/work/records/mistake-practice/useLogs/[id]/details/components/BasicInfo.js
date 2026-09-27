"use client";

// 基本信息组件，展示学生信息、题目信息、练习信息和错误分析等基础数据
export default function BasicInfo({
  details
}) {
  const {
    studentAnswerItem,
    student,
    classroom,
    questionPack,
    studentAnswer,
    examQuestion
  } = details;
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">基本信息</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 学生信息 */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700 border-b pb-1">学生信息</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-600">姓名:</span> {student.name}
            </p>
            <p>
              <span className="text-gray-600">学号:</span> {student.studentCode}
            </p>
            <p>
              <span className="text-gray-600">班级:</span> {classroom.name}
            </p>
            <p>
              <span className="text-gray-600">年级:</span> {classroom.grade}
            </p>
          </div>
        </div>

        {/* 题目信息 */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700 border-b pb-1">题目信息</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-600">题集名称:</span>{" "}
              {questionPack.name}
            </p>
            <p>
              <span className="text-gray-600">科目:</span>{" "}
              {questionPack.subject}
            </p>
            <p>
              <span className="text-gray-600">题目类型:</span>{" "}
              {studentAnswerItem.questionType}
            </p>
            {examQuestion && <p>
                <span className="text-gray-600">题目难度:</span>{" "}
                {examQuestion.difficulty}
              </p>}
          </div>
        </div>

        {/* 练习信息 */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700 border-b pb-1">练习信息</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-600">掌握状态:</span>
              <span className={`ml-1 px-2 py-1 rounded text-xs ${studentAnswerItem.isCorrectedByMistakeAgain ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {studentAnswerItem.isCorrectedByMistakeAgain ? "已掌握" : "未掌握"}
              </span>
            </p>
            {studentAnswerItem.mistakeMasteredTime && <p>
                <span className="text-gray-600">掌握时间:</span>{" "}
                {new Date(studentAnswerItem.mistakeMasteredTime).toLocaleString()}
              </p>}
            <p>
              <span className="text-gray-600">题集类型:</span>{" "}
              {studentAnswer.type}
            </p>
          </div>
        </div>

        {/* 错误分析 */}
        {studentAnswerItem.parse && studentAnswerItem.parse.length > 0 && <div className="space-y-2">
            <h3 className="font-medium text-gray-700 border-b pb-1">
              错误分析
            </h3>
            <div className="text-sm space-y-1">
              {studentAnswerItem.parse.map((analysis, index) => <p key={index} className="text-gray-600">
                  {analysis}
                </p>)}
            </div>
          </div>}
      </div>
    </div>;
}
