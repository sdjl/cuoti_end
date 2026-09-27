"use client";

// 为学生定制题集页面，用于查询学生的薄弱知识点并生成定制题集
import { useParams } from "next/navigation";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import StudentInfoCard from "./components/StudentInfoCard.js";
import WeakKnowledgeQuery from "./components/WeakKnowledgeQuery.js";
export default function CreatePackDetailPage() {
  const params = useParams();
  const classRoomId = params.classRoomId;
  const studentsId = params.studentsId;
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="为学生定制题集" showBackButton={true} backHref={`/work/create-pack/knowledge`} backText="返回选择学生" />

      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-6">
          {/* 学生基础信息卡片 */}
          <StudentInfoCard studentId={studentsId} classRoomId={classRoomId} />

          {/* 薄弱知识点查询组件 */}
          <WeakKnowledgeQuery studentId={studentsId} classRoomId={classRoomId} />
        </div>
      </main>
    </div>;
}
