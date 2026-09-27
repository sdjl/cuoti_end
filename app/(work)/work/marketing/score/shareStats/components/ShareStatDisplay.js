"use client";

// 分享统计展示组件，根据筛选条件展示班级或学生的分享统计数据
import ClassroomShareTable from "./ClassroomShareTable.js";
import ShareStatCharts from "./ShareStatCharts.js";
import StudentShareLogTable from "./StudentShareLogTable.js";
export default function ShareStatDisplay({
  scope,
  classroomData,
  studentData,
  loading,
  error
}) {
  // 错误状态
  if (error) {
    return <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-2">
            加载数据时出现错误
          </div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>;
  }

  // 加载状态
  if (loading) {
    return <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>
        </div>
        <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg"></div>
      </div>;
  }

  // 按班级统计
  if (scope === "classroom" && classroomData) {
    return <div className="space-y-6">
        {/* 统计图表 */}
        <ShareStatCharts data={classroomData} type="classroom" />

        {/* 班级统计表格 */}
        <ClassroomShareTable data={classroomData} />
      </div>;
  }

  // 按学生统计
  if (scope === "student" && studentData) {
    return <div className="space-y-6">
        {/* 统计图表 */}
        <ShareStatCharts data={studentData.statistics} type="student" />

        {/* 学生日志详情表格 */}
        <StudentShareLogTable data={studentData.logs} studentName={studentData.statistics.studentName} />
      </div>;
  }

  // 无数据状态
  return <div className="space-y-6">
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          请先设置筛选条件并点击查询按钮
        </div>
        <div className="text-gray-400 text-sm mt-2">
          选择统计范围、班级和时间后查看分享统计数据
        </div>
      </div>
    </div>;
}
