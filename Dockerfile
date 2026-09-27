# 使用 Alpine 基础镜像
FROM node:22-alpine AS builder

# 设置时区和环境变量，需要在编译时设置
ENV TZ=Asia/Shanghai \
    NEXT_PUBLIC_PROD_IMAGE_DOMAIN=http://pengpaiup.cn

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo ${TZ} > /etc/timezone && \
    apk del tzdata

# 设置工作目录
WORKDIR /app

# 先复制依赖相关文件（利用 Docker 缓存）
COPY package.json ./

# 安装依赖
RUN npm install

# 复制项目配置文件
COPY components.json next.config.js postcss.config.mjs tailwind.config.js ./

# 复制源代码
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY styles ./styles
COPY middleware.js ./

# 构建应用并清理缓存
RUN npm run build && \
    rm -rf .next/cache && \
    npm cache clean --force

# 生产阶段 - 使用 Alpine 镜像
FROM node:22-alpine

# 设置环境变量
ENV TZ=Asia/Shanghai \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_PROD_IMAGE_DOMAIN=http://pengpaiup.cn

# 安装运行时依赖并配置时区
# 修改 ImageMagick 策略文件，允许对 PDF 文件进行读写操作
RUN apk add --no-cache \
        imagemagick \
        ghostscript \
        tzdata \
        curl && \
    sed -i '/<policy.*pattern="PDF"/d' /etc/ImageMagick-7/policy.xml && \
    cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo ${TZ} > /etc/timezone && \
    apk del tzdata

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/lib/config/constants.js ./lib/config/constants.js

# 只安装生产依赖
RUN npm install --omit=dev && \
    npm cache clean --force

# 复制定时任务配置和启动脚本
COPY cron-task.txt ./
COPY start.sh ./

RUN chmod +x start.sh

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["sh", "start.sh"]
