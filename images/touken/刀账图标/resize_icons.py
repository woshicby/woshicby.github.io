#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from PIL import Image
import sys

# 确保中文显示正常
sys.stdout.reconfigure(encoding='utf-8')

# 主函数
def main():
    # 设置图标目录路径
    icons_dir = r"e:\工程文件\Git Repository\woshicby.github.io\images\touken\刀账图标"
    reference_file = "三日月宗近.jpg"
    reference_path = os.path.join(icons_dir, reference_file)
    
    # 检查参考文件是否存在
    if not os.path.exists(reference_path):
        print(f"错误: 参考文件 '{reference_file}' 不存在于目录 '{icons_dir}' 中")
        print("请检查正确的参考文件名")
        return
    
    # 获取参考图片的尺寸
    try:
        with Image.open(reference_path) as img:
            reference_size = img.size
            print(f"参考图片 '{reference_file}' 的尺寸: {reference_size[0]}x{reference_size[1]} 像素")
    except Exception as e:
        print(f"打开参考图片时出错: {str(e)}")
        return
    
    # 遍历目录中的所有图片文件
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
    total_files = 0
    resized_files = 0
    skipped_files = 0
    resized_file_list = []  # 记录调整了尺寸的文件
    
    print(f"\n开始处理目录: {icons_dir}")
    print("=" * 80)
    
    for filename in os.listdir(icons_dir):
        # 跳过非图片文件
        if not any(filename.lower().endswith(ext) for ext in image_extensions):
            continue
        
        total_files += 1
        file_path = os.path.join(icons_dir, filename)
        
        # 跳过参考文件本身
        if filename == reference_file:
            print(f"跳过: {filename} (参考文件)")
            skipped_files += 1
            continue
        
        try:
            with Image.open(file_path) as img:
                current_size = img.size
                
                # 检查是否需要调整尺寸
                if current_size != reference_size:
                    print(f"调整: {filename} - 从 {current_size[0]}x{current_size[1]} 到 {reference_size[0]}x{reference_size[1]}")
                    
                    # 调整图片尺寸（保持宽高比）
                    # 使用thumbnail方法可以保持图片比例，不会变形
                    img_copy = img.copy()
                    
                    # 计算调整后的尺寸，保持宽高比
                    width_ratio = reference_size[0] / img_copy.width
                    height_ratio = reference_size[1] / img_copy.height
                    ratio = min(width_ratio, height_ratio)
                    new_size = (int(img_copy.width * ratio), int(img_copy.height * ratio))
                    
                    # 调整尺寸
                    img_resized = img_copy.resize(new_size, Image.LANCZOS)
                    
                    # 创建新的画布，背景为透明（如果是PNG）或白色（如果是JPEG）
                    if filename.lower().endswith('.png'):
                        new_img = Image.new('RGBA', reference_size, (255, 255, 255, 0))
                    else:
                        new_img = Image.new('RGB', reference_size, (255, 255, 255))
                    
                    # 将调整后的图片粘贴到画布中央
                    paste_x = (reference_size[0] - new_size[0]) // 2
                    paste_y = (reference_size[1] - new_size[1]) // 2
                    
                    if filename.lower().endswith('.png'):
                        new_img.paste(img_resized, (paste_x, paste_y), img_resized)
                    else:
                        new_img.paste(img_resized, (paste_x, paste_y))
                    
                    # 保存调整后的图片
                    # 对于JPEG，需要确保格式正确
                    if filename.lower().endswith(('.jpg', '.jpeg')):
                        new_img.convert('RGB').save(file_path, 'JPEG', quality=95)
                    else:
                        new_img.save(file_path)
                    
                    resized_files += 1
                    resized_file_list.append(filename)
                else:
                    print(f"跳过: {filename} - 尺寸已匹配 ({current_size[0]}x{current_size[1]})")
                    skipped_files += 1
        except Exception as e:
            print(f"处理 {filename} 时出错: {str(e)}")
            skipped_files += 1
    
    # 输出汇总信息
    print("\n" + "=" * 80)
    print("图片尺寸调整完成！汇总信息如下：")
    print(f"总图片数: {total_files}")
    print(f"已调整尺寸: {resized_files}")
    print(f"跳过的文件: {skipped_files}")
    print(f"目标尺寸: {reference_size[0]}x{reference_size[1]} 像素")
    print(f"所有图标已处理完毕。")
    
    # 输出调整了尺寸的文件名单
    if resized_file_list:
        print("\n调整了尺寸的文件名单：")
        for i, filename in enumerate(resized_file_list, 1):
            print(f"{i}. {filename}")
    else:
        print("\n没有文件需要调整尺寸。")

if __name__ == "__main__":
    main()