"use client";

// 学生成长记录页面，获取学生信息和成长记录数据，并传递给客户端组件展示
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getStudentGrowthRecords, getStudentInfo } from "./actions.js";
import StudentGrowthPageClient from "./components/StudentGrowthPageClient.js";

// 每页显示的记录数量
const PAGE_SIZE = 50;
export default function StudentGrowthPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.classId;
  const studentId = params.studentId;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const teacherComment = searchParams.get("teacherComment");
  const [studentInfo, setStudentInfo] = useState(null);
  const [initialRecords, setInitialRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (classId && studentId) {
      setLoading(true);
      setError(null);

      // 解析时间参数
      let startDateObj;
      let endDateObj;
      if (startDate) {
        startDateObj = new Date(startDate);
      }
      if (endDate) {
        endDateObj = new Date(endDate);
      }

      // 获取学生信息和初始成长记录
      Promise.all([getStudentInfo(studentId, classId), getStudentGrowthRecords(studentId, classId, 1, PAGE_SIZE, startDateObj, endDateObj)]).then(([studentInfoResult, initialRecordsResult]) => {
        if (!studentInfoResult || !studentInfoResult.student) {
          setError("学生信息不存在");
          return;
        }
        setStudentInfo(studentInfoResult);
        setInitialRecords(initialRecordsResult);
      }).catch(err => {
        console.error("加载数据失败:", err);
        setError("加载数据失败");
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [classId, studentId, startDate, endDate]);
  if (loading) {
    return <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>;
  }
  if (error || !studentInfo || !initialRecords) {
    return <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">{error || "学生信息不存在"}</p>
        </div>
      </div>;
  }

  // 解析时间参数
  let startDateObj;
  let endDateObj;
  if (startDate) {
    startDateObj = new Date(startDate);
  }
  if (endDate) {
    endDateObj = new Date(endDate);
  }
  return <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
      <StudentGrowthPageClient classId={classId} studentId={studentId} studentInfo={studentInfo} initialRecords={initialRecords} pageSize={PAGE_SIZE} startDate={startDateObj} endDate={endDateObj} teacherComment={teacherComment || undefined} />
    </div>;
}
