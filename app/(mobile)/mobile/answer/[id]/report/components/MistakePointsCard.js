"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
// 犯错分析卡片组件，展示学生的错误归因分析，支持分页显示
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Carousel, CarouselContent, CarouselItem } from "../../../../../../../components/ui/carousel.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function MistakePointsCard({
  data
}) {
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(0);
  const cardRef = useRef(null);

  // 每页显示4个错误归因
  const itemsPerPage = 4;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // 将数据按页分组
  const getPageData = () => {
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      const startIndex = i * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      pages.push(data.slice(startIndex, endIndex));
    }
    return pages;
  };
  const pageData = getPageData();
  useEffect(() => {
    if (!api) {
      return;
    }
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
      // 滑动时自动滚动到"犯错分析"组件位置
      if (cardRef.current) {
        cardRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  }, [api]);

  // 如果没有错误归因数据，直接返回null，不显示组件
  if (data.length === 0) {
    return null;
  }
  return <Card className="w-full" ref={cardRef}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            犯错分析
          </div>
          <span className="text-sm font-normal text-gray-500">
            {data.length}个{DISPLAY_TEXT.ERROR_ATTRIBUTION}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 只有一页数据时，直接显示，不使用carousel */}
        {totalPages === 1 ? <div className="space-y-4">
            {data.map(mistakePoint => <div key={mistakePoint._id} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">
                    ⚠️ {mistakePoint.name}
                  </h3>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {mistakePoint.wrongQuestionCount}题
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {mistakePoint.description}
                </p>
              </div>)}
          </div> : (/* 多页数据使用carousel */
      <div className="space-y-4">
            <Carousel setApi={setApi} className="w-full" opts={{
          align: "start",
          loop: false
        }}>
              <CarouselContent>
                {pageData.map((pageItems, pageIndex) => <CarouselItem key={pageIndex}>
                    <div className="space-y-4">
                      {pageItems.map(mistakePoint => <div key={mistakePoint._id} className="border-l-4 border-red-500 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">
                              ⚠️ {mistakePoint.name}
                            </h3>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              {mistakePoint.wrongQuestionCount}题
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {mistakePoint.description}
                          </p>
                        </div>)}
                    </div>
                  </CarouselItem>)}
              </CarouselContent>
            </Carousel>

            {/* 分页指示器 */}
            <div className="flex items-center justify-center pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {Array.from({
              length: totalPages
            }).map((_, index) => <button key={index} onClick={() => api?.scrollTo(index)} className={`w-2 h-2 rounded-full transition-colors ${index === current ? "bg-red-600" : "bg-gray-300"}`} />)}
              </div>
            </div>
          </div>)}

        {/* 提示信息 */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡{" "}
            {data.length > itemsPerPage ? `共有 ${data.length} 个${DISPLAY_TEXT.ERROR_ATTRIBUTION}，可以左右滑动查看更多` : "建议针对以上问题进行专项练习，重点掌握相关概念和解题方法"}
          </p>
        </div>
      </CardContent>
    </Card>;
}
