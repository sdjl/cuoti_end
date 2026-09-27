"use client";

// 错题练习老师帮助页面，展示需要老师帮助的学生错题记录列表，支持筛选、分页和老师回复功能
import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getMyClassOptionsAction, getTeacherReplyCountAction, getTeacherReplyListAction } from "./actions.js";
import TeacherReplyFilters from "./components/TeacherReplyFilters.js";
import TeacherReplyList from "./components/TeacherReplyList.js";
// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function MistakePracticeTeacherReplyPage() {
  const [studentCode, setStudentCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isNeedTeacherReply, setIsNeedTeacherReply] = useState("need");
  const [classId, setClassId] = useState("all");
  const [isStudentMaster, setIsStudentMaster] = useState("all");
  const [classOptions, setClassOptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 读取当前用户的班级供过滤器选择
  useEffect(() => {
    (async () => {
      const options = await getMyClassOptionsAction();
      setClassOptions(options);
    })();
  }, []);
  const filters = useMemo(() => ({
    studentCode,
    studentName,
    isNeedTeacherReply,
    classId,
    isStudentMaster,
    pageNum: currentPage - 1,
    pageSize: PAGE_SIZE
  }), [studentCode, studentName, isNeedTeacherReply, classId, isStudentMaster, currentPage]);

  // 统计数量
  useEffect(() => {
    (async () => {
      const n = await getTeacherReplyCountAction(filters);
      setTotal(n);
    })();
  }, [filters]);

  // 加载列表
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getTeacherReplyListAction(filters);
      setItems(list);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);
  const handleReset = () => {
    setStudentCode("");
    setStudentName("");
    setIsNeedTeacherReply("need");
    setClassId("all");
    setIsStudentMaster("all");
    setCurrentPage(1);
  };
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);
  return <>
      <WorkHeader title={`${DISPLAY_TEXT.COURSE_MISTAKE} - 老师帮助`} showBackButton backHref="/work/records" backText="返回AI学习记录" />

      <div className="container mx-auto p-6 space-y-4">
        <TeacherReplyFilters studentCode={studentCode} setStudentCode={setStudentCode} studentName={studentName} setStudentName={setStudentName} isNeedTeacherReply={isNeedTeacherReply} setIsNeedTeacherReply={setIsNeedTeacherReply} classId={classId} setClassId={setClassId} isStudentMaster={isStudentMaster} setIsStudentMaster={setIsStudentMaster} classOptions={classOptions} onReset={handleReset} />

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
          <TeacherReplyList items={items} isLoading={isLoading} />
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="teacher_reply_page" />
            </div>}
        </div>
      </div>
    </>;
}
