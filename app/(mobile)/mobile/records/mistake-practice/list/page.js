"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
// 错题练习会话列表页面，展示学生的所有错题练习会话记录
import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card } from "../../../../../../components/ui/card.js";
import { validateStudentPassword } from "../../../../../../lib/utils/student.js";
import { fetchStudentSessions } from "./datas.js";
import "./style.css";
import SessionListItemCard from "./components/SessionListItemCard.js";
const PAGE_SIZE = 20;
function SessionListPageContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") || "";
  const password = searchParams.get("password") || "";
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [pageNum, setPageNum] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        setValidating(true);
        setError("");
        const ok = await validateStudentPassword(studentId, password);
        setValidated(ok);
        if (!ok) setError("操作密码错误或学生不存在");
      } catch {
        setError("验证失败");
      } finally {
        setValidating(false);
      }
    })();
  }, [studentId, password]);
  const loadPage = useCallback(async nextPageNum => {
    if (!validated) return;
    try {
      setLoading(true);
      const res = await fetchStudentSessions({
        studentId,
        pageNum: nextPageNum,
        pageSize: PAGE_SIZE
      });
      if (nextPageNum === 0) {
        setItems(res.items);
      } else {
        setItems(prev => [...prev, ...res.items]);
      }
      setHasMore(res.hasMore);
      setPageNum(nextPageNum);
    } finally {
      setLoading(false);
    }
  }, [validated, studentId]);
  useEffect(() => {
    if (validated) loadPage(0);
  }, [validated, loadPage]);
  if (validating) {
    return <div className="demo-mobile-container">
        <div className="demo-content py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>;
  }
  if (!validated) {
    return <div className="demo-mobile-container">
        <div className="demo-content py-12">
          <Card className="p-6 bg-white">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span>验证失败</span>
            </div>
            <div className="text-sm text-gray-600">
              {error || "无效的请求参数"}
            </div>
          </Card>
        </div>
      </div>;
  }
  return <div className="demo-mobile-container">
      <div className="demo-content py-4 space-y-3">
        {items.map(({
        session,
        answerItem,
        question
      }) => <SessionListItemCard key={session._id} session={session} answerItem={answerItem} question={question} password={password} />)}

        <div className="py-4">
          {hasMore ? <Button className="w-full" disabled={loading} onClick={() => loadPage(pageNum + 1)}>
              {loading ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载中...
                </> : "加载更多"}
            </Button> : <div className="text-center text-xs text-gray-400">没有更多了</div>}
        </div>
      </div>
    </div>;
}
export default function SessionListPage() {
  return <Suspense fallback={<div className="demo-mobile-container">
          <div className="demo-content py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        </div>}>
      <SessionListPageContent />
    </Suspense>;
}
