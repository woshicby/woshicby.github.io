# JSON 数据目录

网站所有数据文件(UTF-8 BOM 编码)。前端 JS 通过 `fetchJSON` 加载。

## 数据文件

### 内容类(手工维护)
| 文件 | 用途 | 维护方式 |
|------|------|---------|
| `posts-list.json` | 博文列表(权威编号) | 新增博文时登记 `{file, id}` |
| `posts-series.json` | 博文系列配置 | 手工 |
| `moments.json` | 灵感碎片(按 created_at 倒序) | 手工 |
| `tickets.json` | 票据记录(按日期倒序,subjectId 关联豆瓣) | 手工 |
| `ticket-images.json` | 票据图片映射 | `scripts/tickets/regen_ticket_images.py` |
| `review-movies.json` 等 | 书影音游剧记录(watched/read/played 等状态) | 手工 |
| `sample-posts.json` | 示例博文(博客加载失败回退) | 手工 |

### 运动数据类(脚本生成)
| 文件 | 用途 | 生成方式 |
|------|------|---------|
| `sports-activities.json` | 运动活动汇总 | `scripts/sports-sync/sync_all.py` |
| `activities_detail/` | 运动活动详情(独立目录) | 同上 |
| `imported_activities.json` | 已导入 FIT 记录 | 同上 |
| `location_cache.json` | 位置缓存 | 同上 |

### 地图数据(前端地图着色)
| 文件 | 用途 |
|------|------|
| `sports-world.zh.json` | 国家边界(zoom ≤ 3 着色) |
| `sports-china_provinces.json` | 省份边界(3 < zoom ≤ 6 着色) |
| `sports-china_cities.json` | 城市边界(zoom > 6 着色) |

### 其他
| 文件 | 用途 |
|------|------|
| `games.json` / `tools.json` | 游戏/工具集配置 |
| `race-records.json` | 赛事记录 |
| `study-data.json` | 学习页面数据 |
| `emoji-data.json` | Emoji 渲染器数据 |
| `seo-pages.json` | SEO 页面配置 |

## 规范

- **编码**:UTF-8 **BOM**(`utf-8-sig`),修改时保持一致
- **排序**:tickets/moments 按日期倒序(最新在前);posts-list 按 id 升序
- **格式**:JSON 缩进 2 空格,中文不转义
- **新增数据文件**:在根 README 项目结构登记
