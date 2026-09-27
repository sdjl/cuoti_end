"use server";



export async function createAIAgentStream(options) {
  const {
    botId,
    msg,
    history = [],
    searchEnable = true,
    files = []
  } = options;
  const agentKey = process.env.TENCENT_AGENT_KEY;
  const envId = process.env.TENCENT_ENV;
  if (!agentKey) {
    throw new Error("TENCENT_AGENT_KEY 环境变量未设置");
  }
  if (!envId) {
    throw new Error("TENCENT_ENV 环境变量未设置");
  }

  // 构建请求数据
  const requestData = {
    msg,
    history,
    searchEnable,
    files
  };
  const apiUrl = `https://${envId}.api.tcloudbasegateway.com/v1/aibot/bots/${botId}/send-message`;

  // 发送请求到AI Agent
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${agentKey}`
    },
    body: JSON.stringify(requestData)
  });
  if (!response.ok) {
    throw new Error(`AI Agent API 请求失败: ${response.status} ${response.statusText}`);
  }

  // 返回异步迭代器
  return {
    async *[Symbol.asyncIterator]() {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }
      const decoder = new TextDecoder();
      try {
        while (true) {
          const {
            done,
            value
          } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, {
            stream: true
          });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6); // 移除 "data: " 前缀

              if (jsonStr.trim() === "" || jsonStr.trim() === "[DONE]") {
                continue;
              }
              try {
                const data = JSON.parse(jsonStr);
                yield data;

                // 如果收到结束标志，退出循环
                if (data.finish_reason === "stop") {
                  return;
                }
              } catch (parseError) {
                console.error("解析JSON片段失败:", jsonStr, parseError);
                throw new Error(`AI Agent响应解析失败: ${parseError instanceof Error ? parseError.message : "未知错误"}`);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  };
}


export async function callAIAgent(options) {
  let fullContent = "";
  const stream = await createAIAgentStream(options);
  for await (const chunk of stream) {
    if (chunk.type === "text" && chunk.content) {
      fullContent += chunk.content;
    }
  }
  return fullContent || "AI Agent 未返回有效内容";
}
