/**
 * 客户端辅助函数
 */

/**
 * 将题目序号数组转换为题目ID数组，并创建错题数据
 */
export function convertQuestionNumbersToIds(questionNumbers, questionIds, existingWrongQuestions) {
  return questionNumbers.map(number => {
    const questionId = questionIds[number - 1];
    const existing = existingWrongQuestions.find(q => q.questionId === questionId);
    return {
      questionId,
      mistakePointIds: existing?.mistakePointIds || []
    };
  });
}

/**
 * 将错题数据转换为题目序号数组
 */
export function convertQuestionIdsToNumbers(wrongQuestions, questionIds) {
  return wrongQuestions.map(question => {
    const index = questionIds.indexOf(question.questionId);
    return index >= 0 ? index + 1 : -1;
  }).filter(number => number > 0).sort((a, b) => a - b);
}

/**
 * 根据题目ID获取题目序号
 */
export function getQuestionNumberById(questionIds, questionId) {
  const index = questionIds.indexOf(questionId);
  return index >= 0 ? index + 1 : 0;
}
