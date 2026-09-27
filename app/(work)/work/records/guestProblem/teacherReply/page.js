"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
// 非登录用户老师回复页面，展示需要老师帮助的问题列表，支持筛选、分页和回复
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getGuestTeacherReplyCountAction, getGuestTeacherReplyListAction } from "./actions.js";
import GuestTeacherReplyFilters from "./components/GuestTeacherReplyFilters.js";
import GuestTeacherReplyList from "./components/GuestTeacherReplyList.js";
export default function GuestProblemTeacherReplyPage() {
  // 分页
  const PAGE_SIZE = 20;
  const [studentName, setStudentName] = useState("");
  const [openid, setOpenid] = useState("");
  const [isNeedTeacherReply, setIsNeedTeacherReply] = useState("need");
  const [isStudentMaster, setIsStudentMaster] = useState("all");
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filters = useMemo(() => ({
    studentName,
    openid,
    isNeedTeacherReply,
    isStudentMaster,
    pageNum: currentPage - 1,
    pageSize: PAGE_SIZE
  }), [studentName, openid, isNeedTeacherReply, isStudentMaster, currentPage]);

  // 统计数量
  useEffect(() => {
    (async () => {
      const n = await getGuestTeacherReplyCountAction(filters);
      setTotal(n);
    })();
  }, [filters]);

  // 加载列表
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getGuestTeacherReplyListAction(filters);
      setItems(list);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);
  const handleReset = () => {
    setStudentName("");
    setOpenid("");
    setIsNeedTeacherReply("need");
    setIsStudentMaster("all");
    setCurrentPage(1);
  };
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);
  return <>
      <WorkHeader title={`非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE} - 老师帮助`} showBackButton backHref="/work/records" backText="返回AI学习记录" />

      <div className="container mx-auto p-6 space-y-4">
        <GuestTeacherReplyFilters studentName={studentName} setStudentName={setStudentName} openid={openid} setOpenid={setOpenid} isNeedTeacherReply={isNeedTeacherReply} setIsNeedTeacherReply={setIsNeedTeacherReply} isStudentMaster={isStudentMaster} setIsStudentMaster={setIsStudentMaster} onReset={handleReset} />

        {/* 统计信息 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共找到 <span className="font-medium text-gray-900">{total}</span>{" "}
              条记录
            </div>
            <div className="text-sm text-gray-500">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <GuestTeacherReplyList items={items} isLoading={isLoading} />
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="guest_problem_teacher_reply_page" />
            </div>}
        </div>
      </div>
    </>;
}
