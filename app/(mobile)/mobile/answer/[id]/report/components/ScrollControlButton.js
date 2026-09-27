"use client";

import { ArrowDown, ArrowUp, ChevronUp } from "lucide-react";
// 滚动控制按钮组件，提供返回顶部、上一个和下一个部分的快速导航功能
import { useCallback, useEffect, useState } from "react";
export default function ScrollControlButton({
  wrongQuestionsCount
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  // 监听滚动，当滚动超过300px时显示按钮
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);

      // 根据滚动位置确定当前所在的部分
      const sections = [document.querySelector(".glass-header-container"), document.querySelector("[data-section='knowledge-points']"), document.querySelector("[data-section='mistake-points']"), ...Array.from(document.querySelectorAll("[data-section='question-detail']"))];
      let current = 0;
      sections.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100) {
            current = index;
          }
        }
      });
      setCurrentSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, []);

  // 滚动到上一个部分
  const scrollToPrevious = useCallback(() => {
    const sections = [document.querySelector(".glass-header-container"), document.querySelector("[data-section='knowledge-points']"), document.querySelector("[data-section='mistake-points']"), ...Array.from(document.querySelectorAll("[data-section='question-detail']"))];
    const targetIndex = Math.max(0, currentSection - 1);
    const targetSection = sections[targetIndex];
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [currentSection]);

  // 滚动到下一个部分
  const scrollToNext = useCallback(() => {
    const sections = [document.querySelector(".glass-header-container"), document.querySelector("[data-section='knowledge-points']"), document.querySelector("[data-section='mistake-points']"), ...Array.from(document.querySelectorAll("[data-section='question-detail']"))];
    const targetIndex = Math.min(sections.length - 1, currentSection + 1);
    const targetSection = sections[targetIndex];
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [currentSection]);
  if (!isVisible) {
    return null;
  }
  return <div className="fixed bottom-6 right-4 z-50">
      {/* 默认显示的按钮组 */}
      <div className="flex flex-col gap-2">
        {/* 置顶按钮 */}
        <button onClick={scrollToTop} className="flex items-center justify-center w-10 h-10 bg-blue-50/90 text-blue-600 rounded-full shadow-lg hover:bg-blue-100/90 transition-colors backdrop-blur-sm border border-blue-200/50">
          <ChevronUp className="w-5 h-5" />
        </button>

        {/* 上一个按钮 */}
        <button onClick={scrollToPrevious} disabled={currentSection === 0} className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-colors backdrop-blur-sm ${currentSection === 0 ? "bg-gray-50/70 text-gray-400 border border-gray-200/50" : "bg-emerald-50/90 text-emerald-600 hover:bg-emerald-100/90 border border-emerald-200/50"}`}>
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* 下一个按钮 */}
        <button onClick={scrollToNext} disabled={currentSection >= 2 + wrongQuestionsCount} className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-colors backdrop-blur-sm ${currentSection >= 2 + wrongQuestionsCount ? "bg-gray-50/70 text-gray-400 border border-gray-200/50" : "bg-orange-50/90 text-orange-600 hover:bg-orange-100/90 border border-orange-200/50"}`}>
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </div>;
}
