"use client";

import { Check, X } from "lucide-react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
// 查看荣誉申请详情对话框组件，用于展示荣誉申请的完整信息
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { dateToString } from "../../../../../../../lib/common/time.js";
const getStatusBadge = status => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">待审核</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800">已通过</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className="text-white">
          已取消
        </Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
const openImageInNewTab = imageUrl => {
  window.open(imageUrl, "_blank");
};
export default function ViewApplicationDialog({
  open,
  onOpenChange,
  application
}) {
  if (!application) {
    return null;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>荣誉申请详情</DialogTitle>
          <DialogDescription>查看学生的荣誉申请详细信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">班级</label>
              <div className="mt-1">
                {application.classroom?.name || "未知班级"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                学生姓名
              </label>
              <div className="mt-1">
                {application.student?.name || "未知学生"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                学生编号
              </label>
              <div className="mt-1">
                {application.student?.studentCode || "未知编号"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                申请状态
              </label>
              <div className="mt-1">{getStatusBadge(application.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                申请的荣誉
              </label>
              <div className="mt-1 font-medium">{application.honorName}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                考试名称
              </label>
              <div className="mt-1">{application.examName || "-"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                展示在荣誉榜
              </label>
              <div className="mt-1 flex items-center">
                {application.showInSchoolHonorBoard ? <>
                    <Check className="h-4 w-4 text-green-600 mr-1" />
                    <span>是</span>
                  </> : <>
                    <X className="h-4 w-4 text-gray-400 mr-1" />
                    <span>否</span>
                  </>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">科目</label>
              <div className="mt-1">{application.subject || "-"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">分数</label>
              <div className="mt-1">
                {application.examScore !== undefined && application.examScore !== null ? application.examScore : "-"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                申请时间
              </label>
              <div className="mt-1">
                {dateToString(new Date(application.created))}
              </div>
            </div>
          </div>

          {/* 学生备注 */}
          {application.studentRemark && <div>
              <label className="text-sm font-medium text-gray-500">
                学生备注
              </label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                {application.studentRemark}
              </div>
            </div>}

          {/* 老师评语 */}
          {application.teacherRemark && <div>
              <label className="text-sm font-medium text-gray-500">
                老师评语
              </label>
              <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                {application.teacherRemark}
              </div>
            </div>}

          {/* 学生上传的照片 */}
          {application.studentPhoto && application.studentPhoto.length > 0 && <div>
              <label className="text-sm font-medium text-gray-500 mb-3 block">
                学生上传的照片（点击可在新窗口打开）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {application.studentPhoto.map((photo, index) => <div key={photo.imageFileID || index} className="relative group cursor-pointer" onClick={() => openImageInNewTab(photo.imageUrl)}>
                    <BaseImage src={photo.imageUrl} alt={`申请照片 ${index + 1}`} width={100} height={100} className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        点击查看大图
                      </span>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* 如果没有照片 */}
          {(!application.studentPhoto || application.studentPhoto.length === 0) && <div>
              <label className="text-sm font-medium text-gray-500">
                学生上传的照片
              </label>
              <div className="mt-1 p-8 bg-gray-50 rounded-lg text-center text-gray-500">
                学生未上传照片
              </div>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
}
