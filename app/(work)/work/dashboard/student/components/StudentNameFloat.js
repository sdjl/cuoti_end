"use client";

// 学生看板右上浮窗，滚动时显示姓名并提供回到顶部
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { SCROLL_CONSTANTS } from "./utils.js";
export default function StudentNameFloat({
  student
}) {
  const [showStudentName, setShowStudentName] = useState(false);

  // 监听滚动事件，控制学生姓名栏的显示/隐藏
  useEffect(() => {
    const handleScroll = () => {
      setShowStudentName(window.scrollY > SCROLL_CONSTANTS.STUDENT_NAME_THRESHOLD);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return <button onClick={() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }} className={`fixed top-5 right-6 z-30 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center hover:bg-blue-700 transition-all duration-300 ${showStudentName ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`} title="返回顶部">
      <User className="h-4 w-4" />
      <span className="font-semibold text-sm">{student.name}</span>
    </button>;
}
