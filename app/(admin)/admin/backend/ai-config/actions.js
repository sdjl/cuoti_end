"use server";

import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getSetting, setSetting } from "../../../../../lib/utils/setting.js";
/**
 * 验证AI模板中的参数
 */
function validateTemplateParameters(template, requiredParameters) {
  const missingParameters = requiredParameters.filter(param => !template.includes(`\${${param}}`));
  return {
    valid: missingParameters.length === 0,
    missingParameters
  };
}

/**
 * 获取所有AI配置
 */
export async function getAllAIConfig() {
  try {
    const configKeys = ["ai_response_format_requirement", "ai_analysis_agent_bot_id", "test_diagnosis_agent_bot_id", "term_multi_test_diagnosis_agent_bot_id", "question_interaction_agent_bot_id", "question_analysis_prompt_template", "overall_comment_prompt_template", "mistake_practice_prompt_template", "personal_mistake_prompt_template"];
    const settings = await getSetting(configKeys);
    const config = {
      aiResponseFormatRequirement: settings.ai_response_format_requirement || "",
      aiAnalysisAgentBotId: settings.ai_analysis_agent_bot_id || "",
      testDiagnosisAgentBotId: settings.test_diagnosis_agent_bot_id || "",
      termMultiTestDiagnosisAgentBotId: settings.term_multi_test_diagnosis_agent_bot_id || "",
      questionInteractionAgentBotId: settings.question_interaction_agent_bot_id || "",
      questionAnalysisPromptTemplate: settings.question_analysis_prompt_template || "",
      overallCommentPromptTemplate: settings.overall_comment_prompt_template || "",
      mistakePracticePromptTemplate: settings.mistake_practice_prompt_template || "",
      personalMistakePromptTemplate: settings.personal_mistake_prompt_template || ""
    };
    return {
      success: true,
      data: config
    };
  } catch (error) {
    console.error("获取AI配置失败:", error);
    return {
      success: false,
      message: `获取失败: ${error.message}`
    };
  }
}

/**
 * 更新所有AI配置
 * 设计思想：为了减少对数据库的操作次数，此函数会先获取当前的配置值，
 * 然后与新的配置值进行比较，只更新那些实际发生变化的配置项。
 * 如果某个配置值没有改动，则不会发起对数据库的写入操作。
 */
export async function updateAllAIConfig(config) {
  try {
    // 验证单题AI分析提示词模板
    if (config.questionAnalysisPromptTemplate) {
      const requiredParams = ["standardAnswers", "standardParse", "studentAudioContents", "studentImageInfo"];
      const validation = validateTemplateParameters(config.questionAnalysisPromptTemplate, requiredParams);
      if (!validation.valid) {
        return {
          success: false,
          message: `单题AI分析提示词模板缺少必要参数：${validation.missingParameters.map(p => `\${${p}}`).join("、")}`
        };
      }
    }

    // 验证整体评语AI分析提示词模板
    if (config.overallCommentPromptTemplate) {
      const requiredParams = ["teacherComments"];
      const validation = validateTemplateParameters(config.overallCommentPromptTemplate, requiredParams);
      if (!validation.valid) {
        return {
          success: false,
          message: `整体评语AI分析提示词模板缺少必要参数：${validation.missingParameters.map(p => `\${${p}}`).join("、")}`
        };
      }
    }

    // 验证课程错题AI分析提示词模板
    if (config.mistakePracticePromptTemplate) {
      const requiredParams = ["questionInfo", "studentAnswer"];
      const validation = validateTemplateParameters(config.mistakePracticePromptTemplate, requiredParams);
      if (!validation.valid) {
        return {
          success: false,
          message: `${DISPLAY_TEXT.COURSE_MISTAKE}AI分析提示词模板缺少必要参数：${validation.missingParameters.map(p => `\${${p}}`).join("、")}`
        };
      }
    }

    // 验证自主上传错题AI分析提示词模板
    if (config.personalMistakePromptTemplate) {
      const requiredParams = ["questionInfo", "studentAnswer"];
      const validation = validateTemplateParameters(config.personalMistakePromptTemplate, requiredParams);
      if (!validation.valid) {
        return {
          success: false,
          message: `${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}AI分析提示词模板缺少必要参数：${validation.missingParameters.map(p => `\${${p}}`).join("、")}`
        };
      }
    }

    // 先获取当前的配置值用于比较
    const currentConfigResult = await getAllAIConfig();
    if (!currentConfigResult.success || !currentConfigResult.data) {
      return {
        success: false,
        message: "无法获取当前配置，更新失败"
      };
    }
    const currentConfig = currentConfigResult.data;
    const updatePromises = [];
    const changedFields = [];

    // 比较每个配置项，只更新发生变化的项
    if (config.aiResponseFormatRequirement !== currentConfig.aiResponseFormatRequirement) {
      updatePromises.push(setSetting("ai_response_format_requirement", config.aiResponseFormatRequirement));
      changedFields.push("AI解析返回格式要求");
    }
    if (config.aiAnalysisAgentBotId !== currentConfig.aiAnalysisAgentBotId) {
      updatePromises.push(setSetting("ai_analysis_agent_bot_id", config.aiAnalysisAgentBotId));
      changedFields.push("试卷解析Bot ID");
    }
    if (config.testDiagnosisAgentBotId !== currentConfig.testDiagnosisAgentBotId) {
      updatePromises.push(setSetting("test_diagnosis_agent_bot_id", config.testDiagnosisAgentBotId));
      changedFields.push("单次测验诊断Bot ID");
    }
    if (config.termMultiTestDiagnosisAgentBotId !== currentConfig.termMultiTestDiagnosisAgentBotId) {
      updatePromises.push(setSetting("term_multi_test_diagnosis_agent_bot_id", config.termMultiTestDiagnosisAgentBotId));
      changedFields.push("学期多次测验诊断Bot ID");
    }
    if (config.questionInteractionAgentBotId !== currentConfig.questionInteractionAgentBotId) {
      updatePromises.push(setSetting("question_interaction_agent_bot_id", config.questionInteractionAgentBotId));
      changedFields.push("题目互动问答生成Bot ID");
    }
    if (config.questionAnalysisPromptTemplate !== currentConfig.questionAnalysisPromptTemplate) {
      updatePromises.push(setSetting("question_analysis_prompt_template", config.questionAnalysisPromptTemplate));
      changedFields.push("单题AI分析提示词模板");
    }
    if (config.overallCommentPromptTemplate !== currentConfig.overallCommentPromptTemplate) {
      updatePromises.push(setSetting("overall_comment_prompt_template", config.overallCommentPromptTemplate));
      changedFields.push("整体评语AI分析提示词模板");
    }
    if (config.mistakePracticePromptTemplate !== currentConfig.mistakePracticePromptTemplate) {
      updatePromises.push(setSetting("mistake_practice_prompt_template", config.mistakePracticePromptTemplate));
      changedFields.push(`${DISPLAY_TEXT.COURSE_MISTAKE}AI分析提示词模板`);
    }
    if (config.personalMistakePromptTemplate !== currentConfig.personalMistakePromptTemplate) {
      updatePromises.push(setSetting("personal_mistake_prompt_template", config.personalMistakePromptTemplate));
      changedFields.push(`${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}AI分析提示词模板`);
    }

    // 如果没有任何变化，直接返回成功
    if (updatePromises.length === 0) {
      return {
        success: true,
        message: "配置没有变化，无需更新"
      };
    }

    // 执行更新操作
    const results = await Promise.all(updatePromises);
    const failedUpdates = results.filter(result => !result.success);
    if (failedUpdates.length > 0) {
      const errorMessages = failedUpdates.map(result => result.message).join("; ");
      return {
        success: false,
        message: `部分配置更新失败: ${errorMessages}`
      };
    }
    return {
      success: true,
      message: `已更新 ${changedFields.length} 项配置: ${changedFields.join("、")}`
    };
  } catch (error) {
    console.error("更新AI配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}

/**
 * 获取单题AI分析提示词模板默认值
 */
export async function getQuestionAnalysisTemplateDefault() {
  return `你是一位专业的老师，现在需要你分析一道题目的学生解答情况。

题目信息：
- 标准答案：\${standardAnswers}
- 题目解析：\${standardParse}

学生解答过程：\${studentAudioContents}

\${studentImageInfo}

请根据以上信息，提供两个方面的分析：

1. 解答思路点评：站在评论学生解答思路与标准解题思路是否一致的角度，分析哪些地方正确，哪些地方错误，解题方法是否合适。

2. 模仿老师评语：用老师对学生说话的语气，写一段给家长看的评语，体现老师的专业性和关爱，内容可以包括学习态度、解题能力、需要改进的地方等。

请严格按照以下格式返回：

解答思路点评：[这里写解答思路点评内容]

模仿老师评语：[这里写模仿老师评语内容]`;
}

/**
 * 获取整体评语AI分析提示词模板默认值
 */
export async function getOverallCommentTemplateDefault() {
  return `你是一位专业的老师，现在需要你根据各个题目的单独评语，整理出一个完整的整体评语。

各题目的老师评语如下：
\${teacherComments}

请根据以上各题目的评语，整理出一个完整、连贯的整体评语。整体评语应该：
1. 总结学生在本次测验中的整体表现
2. 指出学生的优点和需要改进的地方
3. 给出具体的学习建议
4. 语言要专业、温和，适合给家长看

请直接返回整理后的整体评语内容，不需要其他格式或说明。`;
}

/**
 * 获取课程错题AI分析提示词模板默认值
 */
export async function getMistakePracticeTemplateDefault() {
  return `你是一位专业的老师，现在需要你根据题目信息和学生的答案信息，生成一段模仿老师口气的评语。

题目信息：
\${questionInfo}

学生答案信息：
\${studentAnswer}

请根据以上信息，用老师对学生说话的语气，写一段评价学生回答的评语。评语应该：
1. 分析学生回答的正确性和问题所在
2. 体现老师的专业性和关爱
3. 给出具体的改进建议
4. 语言温和亲切，适合直接给学生看

请直接返回老师评语内容，不需要其他格式或说明。`;
}

/**
 * 获取自主上传错题AI分析提示词模板默认值
 */
export async function getPersonalMistakeTemplateDefault() {
  return `你是一位专业的老师，现在需要你根据题目信息和学生的答案信息，生成一段模仿老师口气的评语。

题目信息：
\${questionInfo}

学生答案信息：
\${studentAnswer}

请根据以上信息，用老师对学生说话的语气，写一段评价学生回答的评语。评语应该：
1. 分析学生回答的正确性和问题所在
2. 体现老师的专业性和关爱
3. 给出具体的改进建议
4. 语言温和亲切，适合直接给学生看

请直接返回老师评语内容，不需要其他格式或说明。`;
}
