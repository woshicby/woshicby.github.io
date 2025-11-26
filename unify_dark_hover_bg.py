import glob
import re

def main():
    # 匹配夜间模式悬停效果的background-color
    pattern = re.compile(
        r'(body\.dark-theme\s+[^:]+:hover\s*\{\s*[^}]*?)background-color:\s*var\(--[^)]+\);',
        re.DOTALL
    )
    replacement = r'\1background-color: var(--dark-primary-hover-color);'

    # 遍历所有CSS文件
    css_files = glob.glob('**/*.css', recursive=True)
    
    print(f"找到 {len(css_files)} 个CSS文件")
    
    for css_file in css_files:
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified_content, count = pattern.subn(replacement, content)
            
            if count > 0:
                with open(css_file, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                print(f"{css_file}: 替换了 {count} 处")
        
        except UnicodeDecodeError:
            print(f"{css_file}: 编码错误，跳过")
        except Exception as e:
            print(f"{css_file}: 处理错误 - {e}")

if __name__ == "__main__":
    main()
