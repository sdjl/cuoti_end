"use client";

// 坐标显示组件，用于显示题目的原始坐标和新坐标信息
export function CoordinatesDisplay({
  originalCoordinates,
  newCoordinates
}) {
  return <div className="w-full max-w-800 bg-gray-100 p-4 rounded-md">
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="font-medium">左边界</div>
        <div className="font-medium">上边界</div>
        <div className="font-medium">右边界</div>
        <div className="font-medium">下边界</div>

        {/* 原始坐标 */}
        {originalCoordinates && <>
            <div>{originalCoordinates.leftTop.x}</div>
            <div>{originalCoordinates.leftTop.y}</div>
            <div>{originalCoordinates.rightBottom.x}</div>
            <div>{originalCoordinates.rightBottom.y}</div>
          </>}

        {/* 新坐标 */}
        {newCoordinates && <>
            <div className="font-semibold text-blue-600">
              {newCoordinates.leftTop.x}
            </div>
            <div className="font-semibold text-blue-600">
              {newCoordinates.leftTop.y}
            </div>
            <div className="font-semibold text-blue-600">
              {newCoordinates.rightBottom.x}
            </div>
            <div className="font-semibold text-blue-600">
              {newCoordinates.rightBottom.y}
            </div>
          </>}
      </div>
    </div>;
}
