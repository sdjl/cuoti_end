"use client";

// 非登录用户基本信息组件，展示学生信息和题目基本信息
export default function GuestBasicInfo({
  details
}) {
  const {
    guestProblemQuestion,
    guestStudentInfo
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
              <span className="text-gray-600">姓名:</span>{" "}
              {guestStudentInfo.studentInfo.studentName}
            </p>
            <p>
              <span className="text-gray-600">OpenID:</span>{" "}
              {guestProblemQuestion.openid}
            </p>
            <p>
              <span className="text-gray-600">学校:</span>{" "}
              {guestStudentInfo.studentInfo.schoolName || "未填写"}
            </p>
            <p>
              <span className="text-gray-600">年级:</span>{" "}
              {guestStudentInfo.studentInfo.grade || "未填写"}
            </p>
            {guestStudentInfo.studentInfo.studentPhone && <p>
                <span className="text-gray-600">电话:</span>{" "}
                {guestStudentInfo.studentInfo.studentPhone}
              </p>}
          </div>
        </div>

        {/* 题目信息 */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700 border-b pb-1">题目信息</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-600">科目:</span>{" "}
              {guestProblemQuestion.subject}
            </p>
            <p>
              <span className="text-gray-600">题目难度:</span>{" "}
              {getDifficultyText(guestProblemQuestion.difficulty)}
            </p>
            <p>
              <span className="text-gray-600">创建时间:</span>{" "}
              {new Date(guestProblemQuestion.created).toLocaleString()}
            </p>
            {guestProblemQuestion.masteredTime && <p>
                <span className="text-gray-600">掌握时间:</span>{" "}
                {new Date(guestProblemQuestion.masteredTime).toLocaleString()}
              </p>}
            <p>
              <span className="text-gray-600">掌握状态:</span>{" "}
              <span className={`px-2 py-1 rounded text-xs ${guestProblemQuestion.isStudentMaster ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                {guestProblemQuestion.isStudentMaster ? "已掌握" : "未掌握"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>;
}
