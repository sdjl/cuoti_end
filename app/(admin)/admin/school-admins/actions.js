"use server";

import { getSchools, getSchoolsCount } from "../../../../lib/collection/school.js";
import { getWxUsersByOpenids } from "../../../../lib/utils/wxUser.js";
/**
 * 获取学校校长列表
 */
export async function getSchoolAdminsAction(params) {
  try {
    const {
      pageNum,
      pageSize,
      keyword,
      region,
      status,
      adminFilter
    } = params;

    // 如果有校长筛选条件，需要分别处理
    let schools;
    if (adminFilter && adminFilter !== "all") {
      // 先使用school.ts的函数获取基础筛选条件
      const baseSchools = await getSchools({
        pageNum: 0,
        // 获取所有数据用于二次筛选
        pageSize: 10000,
        // 设置一个大数
        keyword,
        region,
        status
      });

      // 然后根据校长条件筛选
      const filteredSchools = baseSchools.filter(school => {
        if (adminFilter === "hasAdmin") {
          return school.adminOpenids && school.adminOpenids.length > 0;
        } else if (adminFilter === "noAdmin") {
          return !school.adminOpenids || school.adminOpenids.length === 0;
        }
        return true;
      });

      // 手动分页
      const startIndex = pageNum * pageSize;
      const endIndex = startIndex + pageSize;
      schools = filteredSchools.slice(startIndex, endIndex);
    } else {
      // 没有校长筛选，直接使用school.ts的函数
      schools = await getSchools({
        pageNum,
        pageSize,
        keyword,
        region,
        status
      });
    }

    // 收集所有校长的openid并去重
    const allAdminOpenids = new Set();
    schools.forEach(school => {
      if (school.adminOpenids && school.adminOpenids.length > 0) {
        school.adminOpenids.forEach(openid => {
          allAdminOpenids.add(openid);
        });
      }
    });

    // 一次性获取所有校长数据
    const allAdmins = await getWxUsersByOpenids(Array.from(allAdminOpenids));

    // 创建openid到用户数据的映射
    const adminMap = new Map();
    allAdmins.forEach(admin => {
      adminMap.set(admin.openid, admin);
    });

    // 为每个学校分配对应的校长数据
    const schoolsWithAdmins = schools.map(school => {
      const admins = [];
      if (school.adminOpenids && school.adminOpenids.length > 0) {
        school.adminOpenids.forEach(openid => {
          const admin = adminMap.get(openid);
          if (admin) {
            admins.push(admin);
          }
        });
      }
      return {
        ...school,
        admins
      };
    });
    return {
      success: true,
      data: schoolsWithAdmins
    };
  } catch (error) {
    console.error("获取学校校长列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取数据时发生未知错误"
    };
  }
}

/**
 * 获取学校校长总数
 */
export async function getSchoolAdminsCountAction(params) {
  try {
    const {
      keyword,
      region,
      status,
      adminFilter
    } = params;

    // 如果有校长筛选条件，需要分别处理
    if (adminFilter && adminFilter !== "all") {
      // 先获取基础筛选后的所有学校
      const allSchools = await getSchools({
        pageNum: 0,
        pageSize: 10000,
        keyword,
        region,
        status
      });

      // 根据校长条件筛选
      const filteredSchools = allSchools.filter(school => {
        if (adminFilter === "hasAdmin") {
          return school.adminOpenids && school.adminOpenids.length > 0;
        } else if (adminFilter === "noAdmin") {
          return !school.adminOpenids || school.adminOpenids.length === 0;
        }
        return true;
      });
      return {
        success: true,
        data: filteredSchools.length
      };
    } else {
      // 没有校长筛选，直接使用school.ts的函数
      const total = await getSchoolsCount({
        keyword,
        region,
        status
      });
      return {
        success: true,
        data: total
      };
    }
  } catch (error) {
    console.error("获取学校校长总数失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取总数时发生未知错误"
    };
  }
}
