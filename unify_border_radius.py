import os
import re

# 获取当前目录下所有CSS文件
css_files = [
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\index\\index-dark-theme.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\common\\common-dark-theme.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\posts.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\index\\index-selectors.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\convert-md-to-json.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\sports.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\tools.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\common.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\tools-common\\tools-common-selectors.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\pace-calculator\\pace-calculator-selectors.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\common\\common-selectors.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\common\\common-responsive.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\video.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\touken-forge.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\tools-common.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\study.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\post-detail.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\index\\index-responsive.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\style-comparison.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\github.min.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\tools-common\\tools-common-dark-theme.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\pace-calculator.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\tools-common\\tools-common-responsive.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\pace-calculator\\pace-calculator-dark-theme.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\pace-calculator\\pace-calculator-responsive.css",
    "c:\\工程文件\\Git Repository\\woshicby.github.io\\CSS\\index.css"
]

# 正则表达式匹配border-radius属性
pattern = re.compile(r'border-radius:\s*[^;]+;')

# 替换为统一的border-radius值
replacement = 'border-radius: var(--border-radius-md);'

def unify_border_radius(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 执行替换
        modified_content = pattern.sub(replacement, content)
        
        # 如果内容有变化，写入文件
        if modified_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            print(f"已更新: {file_path}")
        else:
            print(f"无变化: {file_path}")
            
    except Exception as e:
        print(f"处理文件时出错 {file_path}: {e}")

# 处理所有CSS文件
for css_file in css_files:
    unify_border_radius(css_file)

print("\n所有文件处理完成!")