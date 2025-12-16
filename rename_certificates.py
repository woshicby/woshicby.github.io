import os
import re

# 设置证书文件夹路径（使用原始字符串避免转义问题）
certificates_folder = r"images\finisher_certificates"

# 遍历文件夹中的所有文件
for filename in os.listdir(certificates_folder):
    # 检查文件名是否匹配"YYYYMMDD-ID.扩展名"格式
    match = re.match(r'^(\d{8})-(\d+)\.(\w+)$', filename)
    if match:
        # 提取日期和扩展名
        date_part = match.group(1)
        extension = match.group(3)
        
        # 构建新文件名
        new_filename = f"{date_part}.{extension}"
        
        # 构建完整的旧路径和新路径
        old_path = os.path.join(certificates_folder, filename)
        new_path = os.path.join(certificates_folder, new_filename)
        
        # 重命名文件
        try:
            os.rename(old_path, new_path)
            print(f"重命名成功: {filename} -> {new_filename}")
        except Exception as e:
            print(f"重命名失败: {filename} -> {new_filename}, 错误: {e}")
    else:
        print(f"跳过非匹配格式的文件: {filename}")

print("\n重命名操作完成！")