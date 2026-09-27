import { command, count, docs, getDoc } from "../../../../../../lib/common/database.js";

// 数据库集合名称常量
const COLLECTION_NAMES = {
  STUDENT: "student",
  CLASSROOM: "classroom",
  STUDENT_GROWTH: "student_growth"
};

/**
 * 获取学生信息
 */
export async function getStudentInfoData(studentId, classId) {
  try {
    // 并行获取学生信息和班级信息
    const [student, classroom] = await Promise.all([getDoc(COLLECTION_NAMES.STUDENT, studentId), getDoc(COLLECTION_NAMES.CLASSROOM, classId)]);

    // 检查学生和班级是否存在
    if (!student || !classroom) {
      return null;
    }
    return {
      student: student,
      classroom: classroom
    };
  } catch (error) {
    console.error("获取学生信息失败:", error);
    throw error;
  }
}

/**
 * 获取学生成长记录（分页）
 */
export async function getStudentGrowthRecordsData(studentId, classId, page = 1, limit = 50, startDate, endDate) {
  try {
    // 查询条件：只显示指定类型的数据
    const _ = command();
    const allowedTypes = ["课程错题", "自主上传错题", "上传错题", "获得荣誉", "学情记录", "手动调整积分"];
    let whereCondition = {
      studentId,
      classId,
      type: _.in(allowedTypes)
    };

    // 添加时间范围筛选
    if (startDate && endDate) {
      const startTimestamp = startDate.getTime();
      const endTimestamp = endDate.getTime() + 24 * 60 * 60 * 1000 - 1; // 包含整天
      whereCondition = _.and(whereCondition, {
        created: _.gte(startTimestamp).and(_.lte(endTimestamp))
      });
    }

    // 并行获取成长记录、总数量和学生信息
    const [records, totalCount, student] = await Promise.all([
    // 获取成长记录（分页）
    docs({
      c: COLLECTION_NAMES.STUDENT_GROWTH,
      w: whereCondition,
      pageNum: page - 1,
      // docs函数的pageNum是从0开始的
      pageSize: limit,
      orderBy: {
        created: -1
      }
    }),
    // 获取总数量
    count(COLLECTION_NAMES.STUDENT_GROWTH, whereCondition),
    // 获取学生信息（用于获取总积分）
    getDoc(COLLECTION_NAMES.STUDENT, studentId)]);

    // 判断是否还有更多记录
    const skip = (page - 1) * limit;
    const hasMore = skip + records.length < totalCount;

    // 计算总积分（从学生信息中获取）
    let totalScore = 0;
    if (student) {
      const studentDoc = student;
      totalScore = studentDoc.growthData?.score || 0;
    }
    return {
      records: records,
      hasMore,
      totalCount,
      totalScore
    };
  } catch (error) {
    console.error("获取学生成长记录失败:", error);
    throw error;
  }
}
