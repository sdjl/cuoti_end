"use client";

// 积分排行榜列表组件，展示学生的积分排名列表
import { Trophy } from "lucide-react";
// 是否隐藏其他学生姓名（全局变量）
const HIDE_OTHER_STUDENT_NAMES = true;


function hideStudentName(name, currentStudentName) {
  // 如果功能未开启或者是当前用户，直接返回原名
  if (!HIDE_OTHER_STUDENT_NAMES || name === currentStudentName) {
    return name;
  }

  // 如果姓名长度小于2，直接返回原名
  if (name.length < 2) {
    return name;
  }

  // 如果姓名是2个字，隐藏第二个字
  if (name.length === 2) {
    return `${name.charAt(0)}*`;
  }

  // 如果姓名超过2个字，隐藏中间一个字
  const chars = name.split("");
  const middleIndex = Math.floor(chars.length / 2);
  chars[middleIndex] = "*";
  return chars.join("");
}
export function ScoreRankingList({
  rankingType,
  displayRankingData,
  allRankingData,
  currentStudentRank,
  displayLimit,
  isMiniProgram
}) {
  return <div className="demo-content space-y-4">
      {/* 我的排名 - 只在小程序环境中显示 */}
      {isMiniProgram && currentStudentRank && <div className="bg-white rounded-lg border-l-4 border-orange-500 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {currentStudentRank.rank}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">排名</span>
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <p className="font-bold text-gray-900">
                    {hideStudentName(currentStudentRank.studentName, currentStudentRank.studentName)}
                  </p>
                  <p className="text-sm text-gray-500">我的排名</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    {currentStudentRank.score}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rankingType === "monthly" ? "本月新增" : "总积分"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {/* 未上榜提示 - 只在小程序环境中显示 */}
      {isMiniProgram && !currentStudentRank && <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">
              您当前未进入前{displayLimit}名
            </p>
          </div>
        </div>}

      {/* 排行榜列表 */}
      {displayRankingData.length > 0 ? <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              排行榜 - 前{Math.min(displayLimit, allRankingData.length)}名
              {allRankingData.length > displayLimit && ` (共${allRankingData.length}名学生)`}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {displayRankingData.map((student, index) => <div key={student.studentId} className={`p-4 transition-colors ${index < 3 ? "bg-orange-50/50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center min-w-[40px]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${student.rank === 1 ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300" : student.rank === 2 ? "bg-gray-100 text-gray-700 border-2 border-gray-300" : student.rank === 3 ? "bg-orange-100 text-orange-700 border-2 border-orange-300" : "bg-gray-50 text-gray-600"}`}>
                        {student.rank}
                      </div>
                    </div>
                    <div className="border-l border-gray-200 pl-4">
                      <p className="font-semibold text-gray-900">
                        {hideStudentName(student.studentName, currentStudentRank?.studentName)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-600">
                      {student.score}
                    </p>
                    <p className="text-xs text-gray-500">积分</p>
                  </div>
                </div>
              </div>)}
          </div>
        </div> : (/* 空状态 */
    <div className="bg-white rounded-lg p-8 text-center">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无排行数据
          </h3>
          <p className="text-gray-500 text-sm">
            该年级{rankingType === "monthly" ? "本月" : ""}
            还没有学生获得积分
          </p>
        </div>)}
    </div>;
}
