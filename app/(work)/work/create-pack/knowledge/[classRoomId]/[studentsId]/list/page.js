"use client";

// 定制题集列表页面，用于显示和管理指定学生的所有定制题集
import { useParams } from "next/navigation";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import QuestionPackList from "./components/QuestionPackList.js";
import StudentInfoCard from "./components/StudentInfoCard.js";
export default function CustomPackListPage() {
  const params = useParams();
  const classRoomId = params.classRoomId;
  const studentsId = params.studentsId;
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="定制题集列表" showBackButton={true} backHref={`/work/create-pack/knowledge/${classRoomId}/${studentsId}/create`} backText="返回生成题集" />

      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-6">
          {/* 学生信息卡片 */}
          <StudentInfoCard studentId={studentsId} classRoomId={classRoomId} />

          {/* 定制题集列表 */}
          <QuestionPackList studentId={studentsId} classRoomId={classRoomId} />
        </div>
      </main>
    </div>;
}
