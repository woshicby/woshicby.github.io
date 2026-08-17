# activities_detail 运动活动详情目录

运动活动详细数据(每活动一个 JSON,时间戳命名),由同步脚本生成。

## 来源

- **生成**:`scripts/sports-sync/sync_all.py`(从 FIT 文件提取)
- **消费**:前端 `JS/sports-activity.js`(运动详情页)
- **汇总**:`JSON/sports-activities.json`(运动主页用)

## 注意

- 本目录是**生成物**,一般不要手工修改
- 新运动数据同步后自动更新(双击桌面"运动数据同步.command")
- 文件较多(数千个),提交时按需确认
