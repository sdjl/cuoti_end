"use client";


export async function uploadCosFile(file, key, signature, token, cosFileId, uploadUrl) {
  // 构造 multipart/form-data
  const formData = new FormData();
  formData.append("key", key);
  formData.append("Signature", signature);
  formData.append("x-cos-security-token", token);
  formData.append("x-cos-meta-fileid", cosFileId);
  formData.append("file", file);
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    throw new Error(`上传文件失败: ${response.statusText}`);
  }

  // COS 上传成功后没有返回内容，所以这里不返回任何值
}
