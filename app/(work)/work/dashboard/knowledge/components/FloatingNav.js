"use client";

// 知识看板固定悬浮导航，支持锚点定位及收起展开交互
import { BookOpen, FileText, TrendingUp, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { debounce, SCROLL_CONSTANTS } from "./utils.js";
const navItems = [{
  id: "class-selector",
  label: "选择班级",
  icon: <Users className="w-4 h-4" />
}, {
  id: "knowledge-selector",
  label: "知识点树",
  icon: <BookOpen className="w-4 h-4" />
}, {
  id: "mastery-stats",
  label: "掌握情况",
  icon: <TrendingUp className="w-4 h-4" />
}, {
  id: "question-list",
  label: "题目列表",
  icon: <FileText className="w-4 h-4" />
}];
export default function FloatingNav() {
  const [activeSection, setActiveSection] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      }));

      // 找到当前在视口中的section
      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= SCROLL_CONSTANTS.NAV_ACTIVE_OFFSET && rect.bottom >= SCROLL_CONSTANTS.NAV_ACTIVE_OFFSET) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    // 使用防抖优化滚动性能
    const debouncedHandleScroll = debounce(handleScroll, 100);
    window.addEventListener("scroll", debouncedHandleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", debouncedHandleScroll);
  }, []);
  const scrollToSection = id => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - SCROLL_CONSTANTS.SCROLL_TOP_OFFSET;
      window.scrollTo({
        top,
        behavior: "smooth"
      });
    }
  };
  if (!isVisible) {
    return null;
  }
  return <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300" onMouseEnter={() => setIsExpanded(true)} onMouseLeave={() => setIsExpanded(false)}>
      <div className="bg-white rounded-l-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex flex-col">
          {/* 关闭按钮 */}
          <button onClick={() => setIsVisible(false)} className="flex items-center justify-center px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-b border-gray-100 transition-colors" title="隐藏导航">
            <X className="w-4 h-4" />
          </button>

          {navItems.map(item => <button key={item.id} onClick={() => scrollToSection(item.id)} className={`flex items-center px-3 py-3 transition-all duration-200 ${activeSection === item.id ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-50"} border-t border-gray-100`} title={item.label}>
              <div className="flex-shrink-0">{item.icon}</div>
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isExpanded ? "w-24 opacity-100 ml-3" : "w-0 opacity-0 ml-0"}`}>
                {item.label}
              </span>
            </button>)}
        </div>
      </div>
    </div>;
}
