"use client";

import { useEffect, useState } from "react";
import { getMiniprogramConfigFromDB } from "../app/(admin)/admin/backend/miniprogram-config/datas.js";

// 系统设置类型


export function useSystemSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // 直接调用 Server Action 获取小程序配置
        const config = await getMiniprogramConfigFromDB();
        if (config) {
          // 提取需要的设置值
          const systemSettings = {
            logoUrl: config.systemLogo?.logoUrl,
            logoVersion: config.systemLogo?.logoVersion,
            contactsQrcodeUrl: config.contacts?.qrcodeUrl,
            contactsQrcodeVersion: config.contacts?.qrcodeVersion
          };
          setSettings(systemSettings);
        } else {
          // 如果配置为空，设置为空对象（不是错误状态）
          setSettings({});
        }
      } catch (err) {
        console.error("获取系统设置失败:", err);
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  return {
    settings,
    loading,
    error,
    // 刷新设置的方法
    refresh: () => {
      setLoading(true);
      setError(null);
      // 重新触发 useEffect
      setSettings({});
    }
  };
}
