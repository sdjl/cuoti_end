"use client";

import Link from "next/link";
// 校园管理设置页面，用于查看和切换当前管理的校园
import { useEffect, useState } from "react";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getMySchools, switchCurrentSchool } from "./actions.js";
function SchoolCard({
  school,
  isCurrent,
  onSwitch,
  isSwitching,
  isPrincipal
}) {
  return <div className={`bg-white rounded-xl p-6 border-2 transition-all duration-200 ${isCurrent ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10" : "border-gray-200 hover:border-primary/50 hover:shadow-md"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-lg font-bold ${isCurrent ? "text-primary" : "text-gray-800"}`}>
              {school.name}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isPrincipal ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
              {isPrincipal ? "校长" : "老师"}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            <span className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {school.region}
            </span>
          </p>
          {school.address && <p className="text-sm text-gray-500 mb-2">{school.address}</p>}
          {school.phone && <p className="text-sm text-gray-500 mb-2">
              <span className="inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {school.phone}
              </span>
            </p>}
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${school.status === "正常" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {school.status}
          </div>
        </div>
        <div className="flex flex-col items-end">
          {isCurrent && <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium mb-2">
              当前管理
            </div>}
          {!isCurrent && <button onClick={() => onSwitch(school._id)} disabled={isSwitching} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSwitching ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90"}`}>
              {isSwitching ? "切换中..." : "切换管理"}
            </button>}
        </div>
      </div>
      {school.description && <p className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded-lg">
          {school.description}
        </p>}
    </div>;
}
export default function CurrentSchoolPage() {
  const {
    user,
    loading,
    error
  } = useAuth();
  const {
    toast
  } = useToast();
  const [principalSchools, setPrincipalSchools] = useState([]);
  const [teacherSchools, setTeacherSchools] = useState([]);
  const [currentSchool, setCurrentSchool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // 使用对象记录每个校园的切换状态
  const [switchingSchools, setSwitchingSchools] = useState({});

  // 获取用户管理的校园列表
  useEffect(() => {
    const fetchSchools = async () => {
      if (!user?.openid) return;
      try {
        setIsLoading(true);

        // 从 workSetting 中获取当前校园
        const workSetting = user.workSetting;
        const current = workSetting?.currentSchool || null;
        setCurrentSchool(current);

        // 调用Server Action来获取用户管理的校园列表
        const result = await getMySchools();
        if (result.success) {
          setPrincipalSchools(result.principalSchools);
          setTeacherSchools(result.teacherSchools);
        } else {
          toast({
            title: "获取失败",
            description: result.message,
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("获取校园列表失败:", err);
        toast({
          title: "获取失败",
          description: "无法获取校园列表，请刷新页面重试",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchools();
  }, [user, toast]);

  // 切换当前管理的校园
  const handleSwitchSchool = async schoolId => {
    // 检查该校园是否已经在切换中
    if (switchingSchools[schoolId]) return;
    try {
      // 设置该校园为切换中状态
      setSwitchingSchools(prev => ({
        ...prev,
        [schoolId]: true
      }));
      const result = await switchCurrentSchool(schoolId);
      if (result.success) {
        // 找到切换的校园
        const switchedSchool = [...principalSchools, ...teacherSchools].find(s => s._id === schoolId);
        if (switchedSchool) {
          setCurrentSchool(switchedSchool);
        }
        toast({
          title: "切换成功",
          description: `已切换到 ${switchedSchool?.name || "目标校园"}`
        });

        // 不刷新页面，直接在当前页面更新状态
      } else {
        toast({
          title: "切换失败",
          description: result.message || "切换校园失败，请重试",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("切换校园失败:", err);
      toast({
        title: "切换失败",
        description: "网络错误，请重试",
        variant: "destructive"
      });
    } finally {
      // 清除该校园的切换状态
      setSwitchingSchools(prev => {
        const newState = {
          ...prev
        };
        delete newState[schoolId];
        return newState;
      });
    }
  };
  const totalSchools = principalSchools.length + teacherSchools.length;
  if (loading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">发生错误: {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            重新加载
          </button>
        </div>
      </div>;
  }
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未登录</p>
          <Link href="/login" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            去登录
          </Link>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <WorkHeader title="校园管理设置" showBackButton={true} backHref="/work/setting" backText="返回设置" />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {/* 页面标题和描述 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              校园管理设置
            </h2>
            <p className="text-gray-600">
              您可以在这里查看和切换您有管理权限的校园。当前选择的校园将作为您在管理系统中的默认操作对象。
            </p>
          </div>

          {totalSchools === 0 ? <div className="bg-white rounded-xl p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                暂无管理权限
              </h4>
              <p className="text-gray-600 mb-4">
                您目前没有任何校园的管理权限，请联系系统管理员为您分配权限。
              </p>
              <Link href="/work" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                返回工作台
              </Link>
            </div> : <div className="space-y-8">
              {/* 我是校长的校园列表 */}
              {principalSchools.length > 0 && <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      我是校长 ({principalSchools.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {principalSchools.map(school => <SchoolCard key={school._id} school={school} isCurrent={currentSchool?._id === school._id} onSwitch={handleSwitchSchool} isSwitching={switchingSchools[school._id] || false} isPrincipal={true} />)}
                  </div>
                </div>}

              {/* 我是老师的校园列表 */}
              {teacherSchools.length > 0 && <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      我是老师 ({teacherSchools.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherSchools.map(school => <SchoolCard key={school._id} school={school} isCurrent={currentSchool?._id === school._id} onSwitch={handleSwitchSchool} isSwitching={switchingSchools[school._id] || false} isPrincipal={false} />)}
                  </div>
                </div>}
            </div>}

          {/* 帮助信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-lg font-medium text-blue-800 mb-2">
                  使用说明
                </h4>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• 当前管理校园决定了您在系统中的默认操作范围</li>
                  <li>• 切换校园后，您的管理界面将显示该校园的相关数据</li>
                  <li>• 校长拥有校园的完整管理权限，老师拥有教学相关权限</li>
                  <li>• 只有被分配管理权限的校园才会在此列表中显示</li>
                  <li>• 如需更多校园管理权限，请联系系统管理员</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
