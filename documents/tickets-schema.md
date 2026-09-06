# 票据数据结构规范(tickets.json / ticket-images.json)

> 更新日期:2026-08-23。设计原则:**通用字段顶层平铺,类型专属字段进 `details` 对象**。

## tickets.json

### 通用字段(所有类型)

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 票据类型:`movie` / `flight` / `train` / `show` / `attraction` / `other` |
| `title` | string | 名称(电影名 / 航班号 / 车次号 / 演出名) |
| `date` | string | 开始日期时间 `YYYY-MM-DD HH:MM:SS`(按此倒序排序) |
| `location` | string | 地点或起止(影院 / 机场 / 车站),展示位 |
| `hall` | string | 厅/航站楼/席别等次级位置,展示位 |
| `seat` | string[] | 座位数组(如 `["7排8座"]`,多张票多元素) |
| `price` | number/null | 总价 |
| `platform` | string | 购票平台(猫眼/美团/去哪儿/12306/大麦网) |
| `note` | string | 备注(延误/实际时间/特殊说明) |
| `subjectId` | string | 豆瓣 subject id(仅 movie 使用,其他为空) |

### 类型专属字段(details)

每种类型一个子对象,字段互不共用,按需扩展。

#### flight(飞机)
```jsonc
"details": {
  "flight": {
    "from": "青岛胶东国际机场",        // 出发机场
    "to": "福州长乐国际机场",          // 到达机场
    "terminal": "T1",                 // 航站楼
    "gate": "74号 → 75号",            // 登机口(可含变更)
    "scheduledTime": "19:30-21:40",   // 计划时刻
    "actualTime": "20:37-22:25",      // 实际时刻
    "aircraft": "波音737-84P(WL)",    // 机型
    "registration": "B5430"           // 飞机编号
  }
}
```
> 延误场景:初始计划放 `scheduledTime`,延误后计划与实际情况写入 `note`,实际时刻放 `actualTime`。

#### train(火车,模板,待实际数据填充)
```jsonc
"details": {
  "train": {
    "from": "福州站",                 // 出发站
    "to": "厦门北站",                 // 到达站
    "seatType": "二等座",             // 席别
    "carriage": "05车",               // 车厢
    "departureTime": "14:30",         // 发车时间
    "arrivalTime": "16:02",           // 到达时间
    "duration": "1小时32分"           // 历时(可选)
  }
}
```

#### movie / show / attraction / other
无专属字段时 `details` 可省略或为空对象;如有需求(如电影导演)按需增加 `details.movie`。

### 示例(完整)
```json
{
  "type": "flight",
  "title": "FU6620",
  "date": "2026-08-21 19:30:00",
  "location": "青岛胶东国际机场 → 福州长乐国际机场",
  "hall": "T1航站楼",
  "seat": ["49K"],
  "price": 1050,
  "platform": "去哪儿",
  "note": "延误后计划20:05-22:15;实际起飞20:37 到达22:25;波音737-84P(WL) 编号B5430",
  "subjectId": "",
  "details": {
    "flight": {
      "gate": "74号 → 75号",
      "scheduledTime": "19:30-21:40",
      "actualTime": "20:37-22:25",
      "aircraft": "波音737-84P(WL)",
      "registration": "B5430"
    }
  }
}
```

## ticket-images.json

- 结构:`{ "日期8位_标题": ["images/tickets/场次/文件名.jpg", ...] }`
- key 规则:`ticket.date` 前 10 位去横线 + `_` + `ticket.title`(与 tickets.js 的匹配逻辑一致)
- 图片目录:按场次分文件夹 `images/tickets/<日期8位_标题>/`,文件名 `日期8位_标题_序号_场景.jpg`
- 场景标签:`开场前` / `播放中` / `结束后` / `未知`(按拍摄时间与场次时间推断)

## 新增类型步骤

1. `tickets.json`:设置 `type` + 顶层通用字段 + `details.<type>` 专属字段
2. `JS/pages/tickets.js` 的 `createTicketElement`:加 `else if (ticket.type === 'xxx')` 分支渲染
3. 本文件补充 schema 说明
4. 图片按场次归档 + 更新 `ticket-images.json`
