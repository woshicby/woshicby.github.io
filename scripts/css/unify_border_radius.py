import os
import re

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 项目中所有CSS文件（与实际目录结构一致）
css_files = [
   os.path.join(PROJECT_ROOT, "CSS", "index", "index-dark-theme.css"),
   os.path.join(PROJECT_ROOT, "CSS", "common", "common-dark-theme.css"),
   os.path.join(PROJECT_ROOT, "CSS", "posts.css"),
   os.path.join(PROJECT_ROOT, "CSS", "index", "index-selectors.css"),
   os.path.join(PROJECT_ROOT, "CSS", "convert-md-to-json.css"),
   os.path.join(PROJECT_ROOT, "CSS", "races.css"),
   os.path.join(PROJECT_ROOT, "CSS", "tools.css"),
   os.path.join(PROJECT_ROOT, "CSS", "common.css"),
   os.path.join(PROJECT_ROOT, "CSS", "tools-common.css"),
   os.path.join(PROJECT_ROOT, "CSS", "pace-calculator.css"),
   os.path.join(PROJECT_ROOT, "CSS", "common", "common-selectors.css"),
   os.path.join(PROJECT_ROOT, "CSS", "common", "common-responsive.css"),
   os.path.join(PROJECT_ROOT, "CSS", "video.css"),
   os.path.join(PROJECT_ROOT, "CSS", "touken-forge.css"),
   os.path.join(PROJECT_ROOT, "CSS", "study.css"),
   os.path.join(PROJECT_ROOT, "CSS", "post-detail.css"),
   os.path.join(PROJECT_ROOT, "CSS", "index", "index-responsive.css"),
   os.path.join(PROJECT_ROOT, "CSS", "style-comparison.css"),
   os.path.join(PROJECT_ROOT, "CSS", "github.min.css"),
   os.path.join(PROJECT_ROOT, "CSS", "index.css"),
   os.path.join(PROJECT_ROOT, "CSS", "sports.css"),
   os.path.join(PROJECT_ROOT, "CSS", "sports-common.css"),
   os.path.join(PROJECT_ROOT, "CSS", "sports-active.css"),
   os.path.join(PROJECT_ROOT, "CSS", "sports-volume.css"),
   os.path.join(PROJECT_ROOT, "CSS", "sports-activity.css"),
   os.path.join(PROJECT_ROOT, "CSS", "sports-home.css"),
   os.path.join(PROJECT_ROOT, "CSS", "reviews.css"),
   os.path.join(PROJECT_ROOT, "CSS", "calendar.css"),
   os.path.join(PROJECT_ROOT, "CSS", "emoji-renderer.css"),
   os.path.join(PROJECT_ROOT, "CSS", "wulin-quotes.css"),
   os.path.join(PROJECT_ROOT, "CSS", "time-calculator.css"),
   os.path.join(PROJECT_ROOT, "CSS", "random-decision.css"),
   os.path.join(PROJECT_ROOT, "CSS", "moments.css"),
   os.path.join(PROJECT_ROOT, "CSS", "local-llm-api-chat.css"),
   os.path.join(PROJECT_ROOT, "CSS", "life-path-calculator.css"),
   os.path.join(PROJECT_ROOT, "CSS", "dice-tool.css"),
   os.path.join(PROJECT_ROOT, "CSS", "charts.css"),
   os.path.join(PROJECT_ROOT, "CSS", "civilization-evolution.css"),
   os.path.join(PROJECT_ROOT, "CSS", "seo-checker.css"),
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
   if os.path.exists(css_file):
       unify_border_radius(css_file)
   else:
       print(f"文件不存在: {css_file}")

print("\n所有文件处理完成!")
