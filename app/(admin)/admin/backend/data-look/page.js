"use client";

// 数据查看页面，提供通过数据类型和ID查询并展示各种数据记录的功能
import { useState } from "react";
import { useToast } from "../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getClassroomById, getCourseById, getExamPaperById, getMistakePointById, getQuestionById, getQuestionPackById, getSchoolById, getStudentById, getUserById, getWxUserById } from "./actions.js";
import ClassroomDisplay from "./components/ClassroomDisplay.js";
import CourseDisplay from "./components/CourseDisplay.js";
import DataDisplay from "./components/DataDisplay.js";
import ExamPaperDisplay from "./components/ExamPaperDisplay.js";
import MistakePointDisplay from "./components/MistakePointDisplay.js";
import QueryInput from "./components/QueryInput.js";
import QuestionDisplay from "./components/QuestionDisplay.js";
import QuestionPackDisplay from "./components/QuestionPackDisplay.js";
import SchoolDisplay from "./components/SchoolDisplay.js";
import StudentDisplay from "./components/StudentDisplay.js";
import WxUserDisplay from "./components/WxUserDisplay.js";
export default function DataLookPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const {
    toast
  } = useToast();
  const handleQuery = async (dataType, id) => {
    setLoading(true);
    setResult(null);
    try {
      let response;
      switch (dataType) {
        case "exam_paper":
          response = await getExamPaperById(id);
          break;
        case "classroom":
          response = await getClassroomById(id);
          break;
        case "student":
          response = await getStudentById(id);
          break;
        case "question":
          response = await getQuestionById(id);
          break;
        case "course":
          response = await getCourseById(id);
          break;
        case "mistake_point":
          response = await getMistakePointById(id);
          break;
        case "question_pack":
          response = await getQuestionPackById(id);
          break;
        case "school":
          response = await getSchoolById(id);
          break;
        case "user":
          response = await getUserById(id);
          break;
        case "wx_user":
          response = await getWxUserById(id);
          break;
        default:
          throw new Error("不支持的数据类型");
      }
      setResult({
        dataType,
        id,
        data: response.data,
        success: response.success,
        error: response.error
      });
      if (!response.success) {
        toast({
          title: "查询失败",
          description: response.error || "未知错误",
          variant: "destructive"
        });
      } else if (!response.data) {
        toast({
          title: "查询结果",
          description: "未找到对应的数据",
          variant: "default"
        });
      } else {
        toast({
          title: "查询成功",
          description: `成功获取${getDataTypeLabel(dataType)}数据`,
          variant: "default"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      setResult({
        dataType,
        id,
        data: null,
        success: false,
        error: errorMessage
      });
      toast({
        title: "查询失败",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getDataTypeLabel = dataType => {
    const labels = {
      exam_paper: "试卷",
      question: "题目",
      question_pack: "题集",
      school: "校园",
      classroom: "班级",
      student: "学生",
      course: "课程",
      mistake_point: DISPLAY_TEXT.ERROR_ATTRIBUTION,
      user: "用户",
      wx_user: "微信用户"
    };
    return labels[dataType];
  };
  const renderDataDisplay = () => {
    if (!result || !result.success || !result.data) {
      return null;
    }
    const {
      dataType,
      data
    } = result;
    switch (dataType) {
      case "exam_paper":
        return <ExamPaperDisplay data={data} />;
      case "classroom":
        return <ClassroomDisplay data={data} />;
      case "student":
        return <StudentDisplay data={data} />;
      case "course":
        return <CourseDisplay data={data} />;
      case "mistake_point":
        return <MistakePointDisplay data={data} />;
      case "question":
        return <QuestionDisplay data={data} />;
      case "question_pack":
        return <QuestionPackDisplay data={data} />;
      case "school":
        return <SchoolDisplay data={data} />;
      case "wx_user":
        return <WxUserDisplay data={data} />;
      default:
        return <DataDisplay title={`${getDataTypeLabel(dataType)}数据`} data={data} dataType={dataType} />;
    }
  };
  return <div className="container mx-auto space-y-6">
      {/* 查询输入 */}
      <QueryInput onQuery={handleQuery} loading={loading} />

      {/* 查询结果 */}
      <div className="space-y-4">
        {loading && <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">查询中...</div>
          </div>}

        {result && !loading && (result.success && result.data ? renderDataDisplay() : <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="font-semibold text-red-800 mb-2">查询失败</h3>
              {result.error ? <p className="text-red-600 text-sm">{result.error}</p> : <p className="text-red-600 text-sm">
                  未找到ID为 {result.id} 的{getDataTypeLabel(result.dataType)}
                  数据
                </p>}
            </div>)}

        {!result && !loading && <div className="flex justify-center items-center h-32 text-muted-foreground">
            请选择数据类型并输入ID进行查询
          </div>}
      </div>
    </div>;
}
