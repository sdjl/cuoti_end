"use client";

// 使用说明组件，显示绑定二维码的使用方法和注意事项
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { BIND_PASSWORD_VALIDITY_DAYS } from "../page.js";
export default function UsageInstructions() {
  return <Card>
      <CardHeader>
        <CardTitle>使用说明</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-gray-600">
        <div>1. 点击&ldquo;生成绑定二维码&rdquo;按钮生成专属二维码</div>
        <div>
          2. 二维码有效期为{BIND_PASSWORD_VALIDITY_DAYS}
          天，过期后需要重新生成
        </div>
        <div>3. 学生使用微信扫描二维码即可完成绑定</div>
        <div>4. 可以随时删除或重新生成二维码</div>
        <div>5. 重新生成时，旧的二维码会立即失效</div>
        <div>6. 老师可以扫码快速切换学生身份</div>
      </CardContent>
    </Card>;
}
