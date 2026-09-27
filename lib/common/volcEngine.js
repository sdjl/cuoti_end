"use server";

/**
 * 火山方舟大模型API调用接口
 * 主要用于图片理解功能
 * 参考文档：https://www.volcengine.com/docs/82379/1494384
 */

// ==================== 使用示例 ====================

/*
// 示例1：分析单张图片
const result1 = await analyzeImage(
  'https://example.com/image.jpg',
  '这张图片中有什么物体？',
  {
    detail: 'high',
    systemPrompt: '你是一个专业的图像分析专家'
  }
);

// 示例2：使用自定义消息列表
const messages: Message[] = [
  {
    role: 'system',
    content: '你是一个友好的AI助手，擅长分析图片内容'
  },
  {
    role: 'user',
    content: await buildImageMessage(
      'https://example.com/image1.jpg',
      '这是什么场景？',
      'high'
    )
  }
];
const result2 = await chatWithImages(messages, {
  temperature: 0.7,
  maxTokens: 2000
});
*/

// ==================== 类型定义 ====================

/**
 * 消息角色类型
 */
/**
 * 文本消息部分
 */
/**
 * 图片消息部分
 */
/**
 * 多模态消息内容类型
 */
/**
 * 系统消息
 */
/**
 * 用户消息
 */
/**
 * 助手消息
 */
/**
 * 工具消息
 */
/**
 * 消息类型
 */
/**
 * 响应格式类型
 */
/**
 * 聊天完成请求参数
 */
/**
 * 聊天完成响应的选择项
 */
/**
 * Token使用情况
 */
/**
 * 聊天完成响应
 */
/**
 * 错误响应
 */
// ==================== 辅助函数 ====================

function getApiKey() {
  const apiKey = process.env.VOLCENGINE_API_KEY;
  if (!apiKey) {
    throw new Error("环境变量 VOLCENGINE_API_KEY 未设置");
  }
  return apiKey;
}


export async function buildImageMessage(imageUrl, text, detail = "low") {
  return [{
    type: "image_url",
    image_url: {
      url: imageUrl,
      detail: detail
    }
  }, {
    type: "text",
    text: text
  }];
}

// ==================== 主要API函数 ====================


export async function chatCompletion(request) {
  const apiKey = getApiKey();
  const apiUrl = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API错误: ${errorData.error.message}`);
    }

    // 如果是流式输出，需要特殊处理
    if (request.stream) {
      return await handleStreamResponse(response);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`调用火山方舟API失败: ${error.message}`);
    }
    throw new Error("调用火山方舟API时发生未知错误");
  }
}


async function handleStreamResponse(response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法获取响应流");
  }
  const decoder = new TextDecoder();
  let fullContent = "";
  let responseId = "";
  let model = "";
  let created = 0;
  let finishReason = "";
  try {
    while (true) {
      const {
        done,
        value
      } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, {
        stream: true
      });
      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();

        // 处理SSE格式的数据行
        if (trimmedLine.startsWith("data: ")) {
          const dataContent = trimmedLine.slice(6); // 移除 'data: ' 前缀

          // 检查是否是结束标记
          if (dataContent === "[DONE]") {
            break;
          }
          try {
            const jsonData = JSON.parse(dataContent);

            // 提取基本信息
            if (jsonData.id && !responseId) {
              responseId = jsonData.id;
            }
            if (jsonData.model && !model) {
              model = jsonData.model;
            }
            if (jsonData.created && !created) {
              created = jsonData.created;
            }

            // 提取内容增量
            if (jsonData.choices?.[0]) {
              const choice = jsonData.choices[0];

              // 累积内容
              if (choice.delta?.content) {
                fullContent += choice.delta.content;
              }

              // 记录结束原因
              if (choice.finish_reason) {
                finishReason = choice.finish_reason;
              }
            }
          } catch (parseError) {
            console.warn("解析流式数据块失败:", parseError, "数据:", dataContent);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // 构建完整的响应对象
  const completeResponse = {
    id: responseId || "unknown",
    model: model || "unknown",
    service_tier: "default",
    created: created || Date.now(),
    object: "chat.completion",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: fullContent
      },
      finish_reason: finishReason || "stop",
      logprobs: null
    }],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      prompt_tokens_details: {
        cached_tokens: 0
      },
      completion_tokens_details: {
        reasoning_tokens: 0
      }
    }
  };
  return completeResponse;
}


export async function analyzeImage(imageUrl, prompt = "请详细描述这张图片的内容", options) {
  // 默认使用视觉理解模型
  const model = options?.model || "doubao-1.5-vision-pro-32k";

  // 构建消息列表
  const messages = [];

  // 添加系统消息（如果有）
  if (options?.systemPrompt) {
    messages.push({
      role: "system",
      content: options.systemPrompt
    });
  }

  // 添加用户消息（包含图片和提示词）
  messages.push({
    role: "user",
    content: await buildImageMessage(imageUrl, prompt, options?.detail)
  });

  // 构建请求参数
  const request = {
    model: model,
    messages: messages,
    stream: false,
    // 不使用流式输出
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 1
  };

  // 调用API
  const response = await chatCompletion(request);

  // 返回AI的回答
  if (response.choices && response.choices.length > 0) {
    return response.choices[0].message.content;
  }
  throw new Error("API返回了空的响应");
}


export async function chatWithImages(messages, options) {
  // 默认使用视觉理解模型
  const model = options?.model || "doubao-1-5-vision-pro-32k-250115";

  // 构建请求参数
  const request = {
    model: model,
    messages: messages,
    stream: false,
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature,
    top_p: options?.topP,
    frequency_penalty: options?.frequencyPenalty,
    presence_penalty: options?.presencePenalty,
    response_format: options?.responseFormat
  };

  // 调用API并返回完整响应
  return await chatCompletion(request);
}

// 导出所有类型，方便外部使用
