"use client";

// 展示当前知识点名称的返回顶部按钮，随滚动切换显隐
import { useEffect, useState } from "react";
import { SCROLL_CONSTANTS } from "./utils.js";
export default function KnowledgePointFloat({
  knowledgePoint
}) {
  const [showKnowledgeName, setShowKnowledgeName] = useState(false);

  // 监听滚动事件，控制知识点名称栏的显示/隐藏
  useEffect(() => {
    const handleScroll = () => {
      setShowKnowledgeName(window.scrollY > SCROLL_CONSTANTS.KNOWLEDGE_NAME_THRESHOLD);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return <button onClick={() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }} className={`fixed top-5 right-6 z-30 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 ${showKnowledgeName ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`} title="返回顶部">
      <span className="font-semibold text-sm">{knowledgePoint.name}</span>
    </button>;
}
