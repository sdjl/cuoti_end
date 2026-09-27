"use client";

// 自主上传错题基本信息组件，展示学生基本信息和题目基本信息，包括学生姓名、学号、班级、年级、科目、难度等
export default function BasicInfo({
  details
}) {
  const {
    problemQuestion,
    student,
    classroom
  } = details;
  const getDifficultyText = difficulty => {
    switch (difficulty) {
      case "容易":
        return "简单";
      case "中等":
        return "中等";
      case "困难":
        return "困难";
      case "超难":
        return "超难";
      case "未知":
        return "未知";
      default:
        return "未知";
    }
  };
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
              <span className="text-gray-600">科目:</span>{" "}
              {problemQuestion.subject}
            </p>
            <p>
              <span className="text-gray-600">题目难度:</span>{" "}
              {getDifficultyText(problemQuestion.difficulty)}
            </p>
            <p>
              <span className="text-gray-600">创建时间:</span>{" "}
              {new Date(problemQuestion.created).toLocaleString()}
            </p>
            {problemQuestion.masteredTime && <p>
                <span className="text-gray-600">掌握时间:</span>{" "}
                {new Date(problemQuestion.masteredTime).toLocaleString()}
              </p>}
          </div>
        </div>
      </div>
    </div>;
}
