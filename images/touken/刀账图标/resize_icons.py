#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from PIL import Image
import sys

# 确保中文显示正常
sys.stdout.reconfigure(encoding='utf-8')

def remove_white_borders(img, tolerance=0):
    """
    移除图片四周的白色边框
    tolerance: 容差，0表示完全白色，值越大允许的非白色像素越多
    """
    # 转换为RGBA模式以便处理透明度
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 获取图像数据
    data = img.getdata()
    
    # 定义白色判断函数
    def is_white(pixel, tolerance):
        r, g, b, a = pixel if len(pixel) == 4 else (*pixel, 255)
        # 检查是否是透明或接近白色的像素
        return a < 10 or (r > 255 - tolerance and g > 255 - tolerance and b > 255 - tolerance)
    
    # 找到边界
    width, height = img.size
    left, right, top, bottom = width, 0, height, 0
    
    # 扫描所有像素找到非白边区域
    for y in range(height):
        for x in range(width):
            pixel = data[y * width + x]
            if not is_white(pixel, tolerance):
                left = min(left, x)
                right = max(right, x)
                top = min(top, y)
                bottom = max(bottom, y)
    
    # 检查是否找到了非白边区域
    if left < right and top < bottom:
        # 裁剪图片到边界
        return img.crop((left, top, right + 1, bottom + 1)), True
    else:
        # 如果全是白边，返回原图
        return img, False

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
    trimmed_files = 0
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
                
                # 移除白边
                trimmed_img, was_trimmed = remove_white_borders(img, tolerance=10)
                trimmed_size = trimmed_img.size
                
                # 如果裁剪后尺寸发生变化，记录
                if was_trimmed and trimmed_size != current_size:
                    print(f"裁剪: {filename} - 从 {current_size[0]}x{current_size[1]} 裁剪到 {trimmed_size[0]}x{trimmed_size[1]}")
                    trimmed_files += 1
                
                # 拉伸到目标尺寸
                if trimmed_size != reference_size:
                    print(f"拉伸: {filename} - 从 {trimmed_size[0]}x{trimmed_size[1]} 到 {reference_size[0]}x{reference_size[1]}")
                    img_resized = trimmed_img.resize(reference_size, Image.LANCZOS)
                    
                    # 保存调整后的图片
                    if filename.lower().endswith(('.jpg', '.jpeg')):
                        img_resized.convert('RGB').save(file_path, 'JPEG', quality=95)
                    else:
                        img_resized.save(file_path)
                    
                    resized_files += 1
                    resized_file_list.append(filename)
                else:
                    # 如果裁剪后的尺寸已经符合目标尺寸，保存裁剪后的图片
                    if was_trimmed:
                        if filename.lower().endswith(('.jpg', '.jpeg')):
                            trimmed_img.convert('RGB').save(file_path, 'JPEG', quality=95)
                        else:
                            trimmed_img.save(file_path)
                        resized_files += 1
                        resized_file_list.append(filename)
                    print(f"跳过: {filename} - 尺寸已匹配 ({trimmed_size[0]}x{trimmed_size[1]})")
                    skipped_files += 1
        except Exception as e:
            print(f"处理 {filename} 时出错: {str(e)}")
            skipped_files += 1
    
    # 输出汇总信息
    print("\n" + "=" * 80)
    print("图片尺寸调整完成！汇总信息如下：")
    print(f"总图片数: {total_files}")
    print(f"已裁剪白边: {trimmed_files}")
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