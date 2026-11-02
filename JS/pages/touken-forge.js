/**
 * 刀剑乱舞锻刀模拟器
 *
 * 2026-10-22 重构:
 * - 配置数据全部外置到 JSON/touken-forge-config.json(刀剑/概率/隐藏保底/限锻事件),
 *   维护人员改 JSON 即可, 本文件只保留逻辑
 * - 顶部下拉框选择锻造模式: 日常锻刀 / 限锻(支持多套限锻配置)
 * - 各模式存档独立(touken:save:<configId>), 每个存档含 configId 字段标识所属配置
 * - 限锻规则见 bwiki维护/规格/限时锻刀特别版.md, 隐藏保底见 bwiki维护/规格/隐藏保底.md
 * - 十连锻刀: 一次扣 10 份资源, 10 把共享总倒计时(以最长一把为准), 加速符一次结算整批
 * - 锻造中(未加速)结果框: 显示未知刀帐(default_sword.jpg = bwiki 刀帐未上传.jpg) + 逐把倒计时
 * - 限锻刀分享卡: 批量出多把时依次弹出
 *
 * 2026-10-23 扩展:
 * - bwiki 限锻存档全量导入为限锻事件(102 条, 2020.05-2023.01): formula=allNNN 即四资源均为 NNN 的精确公式;
 *   formula=null 为无公式事件(限锻刀并入所属刀种池, 按普通锻刀锻造, 不累计显现积分);
 *   swordNames 为群体事件(天下五剑, 出任一即算限锻刀)
 * - 自动锻刀(移植自 bwiki MediaWiki:Building.js GodSummon): 数量 N + 速度 ms/把, 逐把出结果,
 *   每把走完整锻刀机制(资源扣除/官方公式/隐藏保底/限锻规则), 锻刀时间不等真实时间;
 *   自动模式不弹限锻分享卡(改日志+结果格金框标识)
 */

// ============================================================
// 常量与全局状态
// ============================================================

const CONFIG_URL = './JSON/touken-forge-config.json'; // 配置文件地址
const MODE_KEY = 'toukenMode';                        // 记忆上次选择的模式
const DAILY_MODE_ID = 'daily';                        // 日常锻刀的模式 ID
const RES_KEYS = ['charcoal', 'steel', 'coolant', 'whetstone'];
const RES_NAMES = { charcoal: '木炭', steel: '玉刚', coolant: '冷却材', whetstone: '砥石' };

let config = null;              // 解析后的完整配置(JSON)
let currentModeId = DAILY_MODE_ID; // 当前选中的模式 ID(daily 或限锻事件 ID)
let isForging = false;          // 是否锻造中
let forgeTimer = null;          // 倒计时计时器
let forgeBatch = [];            // 进行中的锻造批次: [{result, tlSource, startedAt, forgeTime}]
let currentResources = {};      // 本次锻造使用的资源
let currentForgingResult = null;// 当前锻造结果(批次中的最后一把)
let lastTimeLimitSource = null; // 本次若出限锻刀, 记录来源(特殊概率/显现积分保底)
let tlCardQueue = [];           // 限锻刀分享卡待弹队列(十连出多把限锻刀时依次弹出)

// DOM 元素引用(DOMContentLoaded 时初始化)
let elements = {};

// ============================================================
// 存档层: 每个模式一份独立存档
// 存档结构:
// {
//   "configId": "daily" | 限锻事件 ID,   // 标识存档属于哪个锻刀配置
//   "configTitle": "日常锻刀" | 事件名,
//   "version": 1,
//   "resources": { charcoal, steel, coolant, whetstone },
//   "stats": { forgeCount, deleteCount },
//   "collection": { [刀名]: { count, image, rarity } },
//   "timeLimit": { points, specialCount, guaranteeCount }  // 日常存档中恒为 0
// }
// ============================================================

function modeSaveKey(modeId) {
   return `touken:save:${modeId}`;
}

// 新建一个模式的初始存档
function newSave(modeId, modeTitle) {
   const resources = {};
   for (const r of RES_KEYS) resources[r] = config.resources.initial;
   return {
      configId: modeId,
      configTitle: modeTitle,
      version: 1,
      resources,
      stats: { forgeCount: 0, deleteCount: 0 },
      collection: {},
      timeLimit: { points: 0, specialCount: 0, guaranteeCount: 0 }
   };
}

// 读取(或新建)某模式的存档; 解析失败时回退新存档(原文件保留不覆盖)
function loadSave(modeId) {
   const raw = localStorage.getItem(modeSaveKey(modeId));
   if (raw) {
      try {
         const s = JSON.parse(raw);
         if (s && s.configId === modeId && s.resources && s.stats && typeof s.collection === 'object') {
            // 补全旧版存档可能缺少的字段
            const fresh = newSave(modeId, modeTitle(modeId));
            fresh.resources = { ...fresh.resources, ...s.resources };
            fresh.stats = { ...fresh.stats, ...s.stats };
            fresh.collection = s.collection;
            fresh.timeLimit = { ...fresh.timeLimit, ...(s.timeLimit || {}) };
            fresh.configTitle = s.configTitle || modeTitle(modeId);
            return fresh;
         }
      } catch (e) {
         console.error(`存档 ${modeId} 解析失败, 将新建(原文件保留):`, e);
      }
   }
   return newSave(modeId, modeTitle(modeId));
}

// 保存当前模式存档(内存缓存 → localStorage)
let cachedSave = null;

function saveState() {
   localStorage.setItem(modeSaveKey(currentModeId), JSON.stringify(curState()));
}

// 当前模式存档(同一模式内复用同一对象, 保证锻造过程中的修改不被覆盖; 切换模式时失效)
function curState() {
   if (!cachedSave || cachedSave.configId !== currentModeId) {
      cachedSave = loadSave(currentModeId);
   }
   return cachedSave;
}

// 旧版存档迁移: 旧键(toukenResources/toukenStats/toukenCollection)→ 新格式(touken:save:daily)
// 顺序: 先读旧值 → 写入新存档 → 再删旧键
function migrateLegacySaves() {
   const dailyKey = modeSaveKey(DAILY_MODE_ID);
   if (localStorage.getItem(dailyKey)) return;
   const legacyKeys = ['toukenResources', 'toukenStats', 'toukenCollection']
      .filter(k => localStorage.getItem(k) !== null);
   if (!legacyKeys.length) return;

   const save = newSave(DAILY_MODE_ID, modeTitle(DAILY_MODE_ID));
   const res = safeParse(localStorage.getItem('toukenResources'));
   if (res) {
      for (const r of RES_KEYS) {
         if (Number.isSafeInteger(res[r])) save.resources[r] = res[r];
      }
   }
   const st = safeParse(localStorage.getItem('toukenStats'));
   if (st) {
      save.stats.forgeCount = Number(st.forgeCount) || 0;
      save.stats.deleteCount = Number(st.deleteCount) || 0;
   }
   const col = safeParse(localStorage.getItem('toukenCollection'));
   if (col && typeof col === 'object') save.collection = col;

   localStorage.setItem(dailyKey, JSON.stringify(save));
   legacyKeys.forEach(k => localStorage.removeItem(k));
   logEvent('旧版存档已迁移为新格式(日常锻刀)');
}

function safeParse(raw) {
   try { return JSON.parse(raw); } catch (e) { return null; }
}

// ============================================================
// 配置加载与模式列表
// ============================================================

// 比较运算符(用于 officialFormulaRules / heuristic 的 when 条件)
const CMP_OPS = {
   lt: (a, v) => a < v,
   lte: (a, v) => a <= v,
   gt: (a, v) => a > v,
   gte: (a, v) => a >= v,
   eq: (a, v) => a === v
};

// 判断资源是否满足 when 条件, 形如 { charcoal: ["gte", 500], ... }
function whenMatches(resources, when) {
   return Object.entries(when).every(([res, [op, v]]) =>
      CMP_OPS[op] && CMP_OPS[op](resources[res], v));
}

// 模式下拉框选项: 日常锻刀 + 各限锻事件
function modeOptions() {
   const opts = [{ id: DAILY_MODE_ID, title: '日常锻刀' }];
   for (const e of config.timeLimit.events) {
      opts.push({ id: e.id, title: `限锻 · ${e.title}` });
   }
   return opts;
}

function modeTitle(modeId) {
   const opt = modeOptions().find(o => o.id === modeId);
   return opt ? opt.title : modeId;
}

// 当前模式的限锻事件(日常模式返回 null)
function curEvent() {
   if (currentModeId === DAILY_MODE_ID) return null;
   return config.timeLimit.events.find(e => e.id === currentModeId) || null;
}

// 当前限锻事件的限锻刀名列表(群体事件如天下五剑为多把, 普通事件为单元素)
function curEventSwords() {
   const e = curEvent();
   if (!e) return [];
   return e.swordNames || [e.swordName];
}

// 刀的刀种(配置查找)
function swordTypeOf(name) {
   for (const [t, d] of Object.entries(config.swordTypes)) {
      if (d.swords.some(s => s.name === name)) return t;
   }
   return null;
}

// 刀的稀有度(配置查找, 默认 common)
function rarityOfName(name) {
   const t = swordTypeOf(name);
   const s = t && config.swordTypes[t].swords.find(s => s.name === name);
   return s ? s.rarity : 'common';
}

// 当前模式下某刀种的刀池: 基础池 + 无公式限锻事件下该事件的限锻刀并入所属刀种池
// (当前 45 条无公式事件的刀均已在基础池内, 此函数保持通用: 若配置了新刀也能正确并入)
function poolSwordsForType(type) {
   const swords = config.swordTypes[type].swords.slice();
   const event = curEvent();
   if (event && !event.formula) {
      for (const n of curEventSwords()) {
         if (!swords.some(s => s.name === n) && swordTypeOf(n) === type) {
            const rarity = rarityOfName(n);
            swords.push({ name: n, image: iconPath(n), rarity, forgeTime: config.rarity.forgeTimes[rarity] });
         }
      }
   }
   return swords;
}

// 加载并校验配置
async function loadConfig() {
   const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
   if (!res.ok) throw new Error(`HTTP ${res.status}`);
   const data = await res.json();
   validateConfig(data);
   config = data;
   // 派生字段: 图标路径(按刀名约定)与锻造时间(按稀有度)
   for (const d of Object.values(config.swordTypes)) {
      for (const s of d.swords) {
         s.image = iconPath(s.name);
         s.forgeTime = config.rarity.forgeTimes[s.rarity] || 10;
      }
   }
}

// 配置校验: 缺关键字段/非法值直接抛错
function validateConfig(c) {
   const need = (cond, name) => { if (!cond) throw new Error(`配置无效: ${name}`); };
   need(c.resources, 'resources');
   need(c.rarity, 'rarity');
   need(c.swordTypes, 'swordTypes');
   need(c.timeLimit, 'timeLimit');
   need(Number.isFinite(c.resources.min) && Number.isFinite(c.resources.max) && c.resources.min <= c.resources.max, `resources.min/max 非法`);
   need(Number.isFinite(c.resources.initial) && c.resources.initial > 0, `resources.initial 非法`);
   for (const [type, d] of Object.entries(c.swordTypes)) {
      need(d.name, `swordTypes.${type}.name`);
      need(Array.isArray(d.swords) && d.swords.length, `swordTypes.${type}.swords 为空`);
      for (const s of d.swords) {
         need(s.name, `swordTypes.${type} 存在无 name 的刀剑`);
         need(c.rarity.forgeTimes[s.rarity] !== undefined, `swordTypes.${type}.${s.name} 稀有度 ${s.rarity} 未在 rarity.forgeTimes 定义`);
      }
   }
   need(Number.isFinite(c.timeLimit.pointsPerForge), 'timeLimit.pointsPerForge');
   need(Number.isFinite(c.timeLimit.guaranteePoints), 'timeLimit.guaranteePoints');
   const ids = new Set();
   const poolNames = new Set(Object.values(c.swordTypes).flatMap(d => d.swords.map(s => s.name)));
   for (const e of (c.timeLimit.events || [])) {
      need(e.id, '限锻事件缺 id');
      need(e.title, '限锻事件缺 title');
      const hasSingle = typeof e.swordName === 'string' && e.swordName.length > 0;
      const hasGroup = Array.isArray(e.swordNames) && e.swordNames.length >= 2;
      need(hasSingle || hasGroup, `限锻事件 ${e.id} 缺 swordName/swordNames`);
      if (hasGroup) e.swordNames.forEach(s => need(typeof s === 'string' && s, `限锻事件 ${e.id} swordNames 存在空刀名`));
      need(Number.isFinite(e.specialProbability) && e.specialProbability >= 0 && e.specialProbability <= 100, `限锻事件 ${e.id} specialProbability 非法`);
      // 公式: 精确四资源组合, 或 null(无公式事件: 限锻刀并入所属刀种池)
      if (e.formula != null) {
         for (const r of RES_KEYS) {
            need(Number.isFinite(e.formula[r]), `限锻事件 ${e.id} 缺公式资源 ${r}(公式为精确四资源组合)`);
            if (e.formula[r] < c.resources.min || e.formula[r] > c.resources.max) {
               throw new Error(`配置无效: 限锻事件 ${e.id} 公式资源 ${r}=${e.formula[r]} 超出 ${c.resources.min}-${c.resources.max}`);
            }
         }
      } else {
         need(e.specialProbability === 0, `限锻事件 ${e.id} 无公式时 specialProbability 须为 0`);
         // 无公式事件的限锻刀要并入所属刀种池, 必须在刀池中
         const names = e.swordNames || [e.swordName];
         for (const n of names) need(poolNames.has(n), `无公式限锻事件 ${e.id} 的刀 ${n} 不在刀池中`);
      }
      if (ids.has(e.id)) throw new Error(`配置无效: 限锻事件 id 重复 ${e.id}`);
      ids.add(e.id);
   }
}

// 刀剑图标路径(与现有图片目录约定一致)
function iconPath(name) {
   return `../images/touken/刀账图标/${name}.jpg`;
}

// ============================================================
// 概率引擎
// ============================================================

// 官方公式命中判断(按规则顺序, 第一个 when 全满足的生效)
function pickOfficialTable(resources) {
   for (const rule of config.officialFormulaRules || []) {
      const table = config.officialFormulas?.[rule.table];
      if (table && whenMatches(resources, rule.when)) return table;
   }
   return null;
}

function applyBoost(tp, boost) {
   for (const [type, factor] of Object.entries(boost)) {
      if (type in tp) tp[type] *= factor;
   }
}

// 计算各刀种概率: 官方公式表 > 本地启发式(baseProbability × 资源总量分档 × 特殊组合, 归一化)
function computeTypeProbabilities(resources) {
   const tp = {};
   for (const type of Object.keys(config.swordTypes)) tp[type] = 0;

   const table = pickOfficialTable(resources);
   if (table) {
      for (const [type, p] of Object.entries(table)) tp[type] = p;
      return tp;
   }

   const h = config.heuristic;
   for (const [type, d] of Object.entries(config.swordTypes)) tp[type] = d.baseProbability;
   const total = RES_KEYS.reduce((sum, r) => sum + resources[r], 0);
   let applied = false;
   for (const tier of h.tiers) {
      if (total < tier.maxTotal) { applyBoost(tp, tier.boost); applied = true; break; }
   }
   if (!applied) applyBoost(tp, h.highBoost);
   for (const combo of h.specialCombos) {
      if (whenMatches(resources, combo.when)) applyBoost(tp, combo.boost);
   }
   const sum = Object.values(tp).reduce((a, b) => a + b, 0);
   for (const type of Object.keys(tp)) tp[type] /= sum;
   return tp;
}

// 隐藏保底(移植自 bwiki MediaWiki:Building.js GodSummon):
// 按配置数组顺序优先, 对"本次锻造前的累计次数"取模; 目标刀种不在当前公式刀池内则跳过
function pickPityType(totalForgesBefore, typeProbabilities) {
   for (const p of config.pity || []) {
      if (typeProbabilities[p.type] > 0 && totalForgesBefore % p.mod === p.value) {
         return p.type;
      }
   }
   return null;
}

// 稀有度加权随机选刀
function weightedPick(swords) {
   const total = swords.reduce((sum, s) => sum + (config.rarity.weights[s.rarity] || 1.0), 0);
   let r = Math.random() * total;
   for (const s of swords) {
      const w = config.rarity.weights[s.rarity] || 1.0;
      if (r < w) return s;
      r -= w;
   }
   return swords[0];
}

// ============================================================
// 限时锻刀
// ============================================================

// 限锻公式判定: 四资源与事件公式完全相等(精确匹配, 非区间); 无公式事件恒为 false
function matchesEventFormula(resources) {
   const event = curEvent();
   if (!event || !event.formula) return false;
   return RES_KEYS.every(r => resources[r] === event.formula[r]);
}

// 渲染限锻信息面板(只读; 日常模式隐藏)
function renderTimeLimitPanel() {
   const section = elements.timeLimitSection;
   if (!section) return;
   const event = curEvent();
   if (!event) {
      section.style.display = 'none';
      return;
   }
   section.style.display = 'block';
   const f = event.formula;
   const swords = curEventSwords();
   elements.tlSwordName.textContent = event.swordNames ? swords.join('、') : event.swordName;
   if (f) {
      elements.tlFormula.textContent = `木炭 ${f.charcoal} / 玉刚 ${f.steel} / 冷却材 ${f.coolant} / 砥石 ${f.whetstone}`;
      elements.tlSpecialProb.textContent = event.specialProbability;
      elements.tlGuarantee.textContent = config.timeLimit.guaranteePoints;
      elements.timeLimitStats.style.display = 'flex';
   } else {
      // 无公式事件: 限锻刀并入所属刀种池, 无显现积分
      elements.tlFormula.textContent = `无特殊公式（限锻刀按所属${config.swordTypes[swordTypeOf(swords[0])].name}池普通锻刀）`;
      elements.tlSpecialProb.textContent = '—';
      elements.tlGuarantee.textContent = '—';
      elements.timeLimitStats.style.display = 'none';
   }
   const st = curState().timeLimit;
   elements.tlPoints.textContent = st.points;
   elements.tlSpecialCount.textContent = st.specialCount;
   elements.tlGuaranteeCount.textContent = st.guaranteeCount;
}

// ============================================================
// 锻造主流程
// ============================================================

// 读取资源输入框
function readResourceInputs() {
   const resources = {};
   for (const r of RES_KEYS) {
      const el = document.getElementById(`${r}Input`);
      resources[r] = el ? Math.max(0, parseInt(el.value) || 0) : 0;
   }
   return resources;
}

// 验证资源在配置允许范围内
function validateResources(resources) {
   for (const [type, value] of Object.entries(resources)) {
      if (value < config.resources.min || value > config.resources.max) {
         alert(`${RES_NAMES[type]} 资源必须在 ${config.resources.min}-${config.resources.max} 之间`);
         return false;
      }
   }
   return true;
}

// 开始锻造(单把; 锻造中不可点击, 需回到准备状态)
function startForging() {
   if (isForging || !config) return;
   console.group('开始锻造流程');

   const resources = readResourceInputs();
   if (!validateResources(resources)) {
      console.groupEnd();
      return;
   }

   const state = curState();
   for (const [r, amt] of Object.entries(resources)) {
      if (state.resources[r] < amt) {
         alert('资源不足！');
         console.groupEnd();
         return;
      }
   }

   // 扣除资源
   for (const [r, amt] of Object.entries(resources)) {
      state.resources[r] -= amt;
   }
   saveState();
   updateAllResourceDisplays();

   const forgedCount = state.stats.forgeCount + 1;
   const entry = rollForge(resources);
   entry.startedAt = Date.now();
   forgeBatch.push(entry);
   logEvent(`开始第 ${forgedCount} 次锻刀[${modeTitle(currentModeId)}]，使用资源：木炭 ${resources.charcoal}，玉刚 ${resources.steel}，冷却材 ${resources.coolant}，砥石 ${resources.whetstone}`);
   enterForgingUI();
   console.groupEnd();
}

// 十连锻刀: 一次性使用 9 份填写的资源, 启动 10 次锻刀(较单独锻刀×10 省 1 份)
// 每把按当前模式规则独立判定; 锻造中不可点击, 需回到准备状态
const TENFOLD_COUNT = 10;      // 启动的锻刀次数
const TENFOLD_COST = 9;        // 消耗资源份数(10 把省 1 份)

let tenFoldSeq = 0;            // 十连批次编号(加速符计费: 每批省 1 个)

function tenFoldForging() {
   if (isForging || !config) return;
   console.group('十连锻刀');

   const resources = readResourceInputs();
   if (!validateResources(resources)) {
      console.groupEnd();
      return;
   }

   const state = curState();
   for (const [r, amt] of Object.entries(resources)) {
      if (state.resources[r] < amt * TENFOLD_COST) {
         alert('资源不足！十连锻刀需要 9 份资源');
         console.groupEnd();
         return;
      }
   }

   // 一次性扣除 9 份资源
   for (const [r, amt] of Object.entries(resources)) {
      state.resources[r] -= amt * TENFOLD_COST;
   }
   saveState();
   updateAllResourceDisplays();

   const now = Date.now();
   const bundleId = ++tenFoldSeq;
   for (let i = 0; i < TENFOLD_COUNT; i++) {
      const entry = rollForge(resources);
      entry.startedAt = now;
      entry.tenFold = bundleId;   // 标记所属十连批次(加速符计费: 每批省 1 个)
      forgeBatch.push(entry);
   }
   logEvent(`开始十连锻刀[${modeTitle(currentModeId)}]，一次性使用 ${TENFOLD_COST} 份资源启动 ${TENFOLD_COUNT} 次锻刀（较单锻×10 省 1 份）：木炭 ${resources.charcoal * TENFOLD_COST}，玉刚 ${resources.steel * TENFOLD_COST}，冷却材 ${resources.coolant * TENFOLD_COST}，砥石 ${resources.whetstone * TENFOLD_COST}`);
   enterForgingUI();
   console.groupEnd();
}

// 单次锻刀 roll: 计数+1、限锻规则(若限锻模式且公式精确匹配)、按概率/隐藏保底选刀
// 前提: 调用方已完成资源校验与扣除; 返回 {result, tlSource}
function rollForge(resources) {
   const state = curState();
   state.stats.forgeCount++;
   currentResources = resources;

   // ---- 限时锻刀 roll(限锻模式): 资源四组合与事件公式完全相等 ----
   // 规则见 bwiki维护/规格/限时锻刀特别版.md
   const event = curEvent();
   lastTimeLimitSource = null;
   let timeLimitHit = false;
   if (event && matchesEventFormula(resources)) {
      const st = state.timeLimit;
      st.points += config.timeLimit.pointsPerForge;
      if (st.points >= config.timeLimit.guaranteePoints) {
         // 显现积分保底: 直接出限锻刀, 显现积分清零
         st.points = 0;
         st.guaranteeCount++;
         lastTimeLimitSource = '显现积分保底';
         timeLimitHit = true;
      } else if (Math.random() * 100 < event.specialProbability) {
         // 特殊概率命中
         st.specialCount++;
         lastTimeLimitSource = '特殊概率';
         timeLimitHit = true;
      }
      saveState();
      renderTimeLimitPanel();
      if (!autoForgeActive) logEvent(`限锻锻造: 显现积分 +${config.timeLimit.pointsPerForge}(当前 ${st.points}/${config.timeLimit.guaranteePoints})`);
   }

   let result;
   if (timeLimitHit) {
      // 限锻刀: 不进普通刀池, 按传说处理(群体事件: 组内均匀随机一把)
      const names = curEventSwords();
      const name = names[Math.floor(Math.random() * names.length)];
      result = {
         name,
         image: iconPath(name),
         rarity: 'legendary',
         forgeTime: config.rarity.forgeTimes.legendary,
         isTimeLimitSword: true
      };
   } else {
      // 1. 计算各刀种概率
      const typeProbabilities = computeTypeProbabilities(resources);

      // 2. 根据概率选择刀种(含隐藏保底; 保底目标不在当前公式刀池内则跳过)
      const totalForgesBefore = state.stats.forgeCount - 1;
      const pityType = pickPityType(totalForgesBefore, typeProbabilities);
      let selectedType;
      if (pityType) {
         selectedType = pityType;
         logEvent(`隐藏保底: 累计 ${totalForgesBefore} 次锻造, 强制 ${config.swordTypes[pityType].name}`);
      } else {
         const random = Math.random();
         let cumulativeProbability = 0;
         for (const type of Object.keys(typeProbabilities)) {
            cumulativeProbability += typeProbabilities[type];
            if (random <= cumulativeProbability) {
               selectedType = type;
               break;
            }
         }
      }

      // 3. 从选定刀种中按稀有度权重选择具体刀剑(锻造时长已由 loadConfig 按稀有度注入;
      //    刀池含无公式限锻事件并入的限锻刀)
      const swords = poolSwordsForType(selectedType);
      result = weightedPick(swords);
   }

   currentForgingResult = result;
   saveState();
   return { result, tlSource: lastTimeLimitSource };
}

// 进入/刷新锻造态: 共享总倒计时(以批次中最长一把为准), 结果框显示未知刀帐+各自倒计时
function enterForgingUI() {
   if (!forgeBatch.length) return;
   if (!isForging) {
      isForging = true;
      elements.forgeButton.disabled = true;      // 锻造中: 开始锻造/十连锻刀/自动锻刀禁用
      elements.tenFoldButton.disabled = true;
      elements.autoForgeButton.disabled = true;
      elements.autoStopButton.style.display = 'none';
      elements.speedUpButton.style.display = 'block';
      elements.speedUpButton.onclick = () => completeForging('speedup');   // 加速符: 立即结算整批
      elements.forgeStatus.textContent = '锻造中...';
      elements.forgeTimer.style.display = 'block';
      forgeTimer = setInterval(tickForge, 1000);
   }
   updateUseFormulaBtn();
   renderForgingProgress();
}

// 批次中第 index 把锻造的剩余秒数
function forgeRemaining(index) {
   const e = forgeBatch[index];
   if (!e) return 0;
   const total = Number(e.result.forgeTime) || 0;
   return Math.max(0, total - Math.floor((Date.now() - e.startedAt) / 1000));
}

// 批次总剩余 = 所有锻造中最长的剩余时间
function batchTotalRemaining() {
   let max = 0;
   for (let i = 0; i < forgeBatch.length; i++) max = Math.max(max, forgeRemaining(i));
   return max;
}

// 加速符计费: 每把 1 个, 每批十连省 1 个(10 把 = 9 个; 与单锻混合时按批分别计)
function batchSpeedUpCost() {
   const bundles = new Set(forgeBatch.filter(e => e.tenFold).map(e => e.tenFold));
   return forgeBatch.length - bundles.size;
}

function tickForge() {
   if (batchTotalRemaining() <= 0) {
      completeForging();
      return;
   }
   renderForgingProgress();
}

// bwiki"刀账未上传"占位图(未知刀帐)
const UNKNOWN_SWORD_IMG = './images/touken/default_sword.jpg';

// 锻造中结果框: 未知刀帐图 + 倒计时
// 单把: 大图 + 刀名位置倒计时; 十连: 10 个(空图+各自倒计时), 总倒计时另见 forgeTimer
function renderForgingProgress() {
   elements.resultContainer.style.display = 'flex';
   elements.forgeTimer.textContent = formatTime(batchTotalRemaining());
   elements.speedUpButton.textContent = `使用加速符 ×${batchSpeedUpCost()}`;
   if (forgeBatch.length === 1) {
      // 单把: 大图 + 刀名位置倒计时
      elements.resultContainer.classList.remove('result-section-grid');
      elements.resultImage.style.display = '';
      elements.resultImage.src = UNKNOWN_SWORD_IMG;
      elements.resultImage.alt = '锻造中';
      elements.resultGrid.style.display = 'none';
      elements.resultName.innerHTML = '';
      elements.resultName.textContent = `锻造中 · ${formatTime(forgeRemaining(0))}`;
      return;
   }
   // 十连: 10 个(空图 + 各自倒计时), 各把时长可不同
   elements.resultContainer.classList.add('result-section-grid');
   elements.resultImage.style.display = 'none';
   elements.resultName.innerHTML = '';
   elements.resultGrid.style.display = 'grid';
   // 格子是上一批结算残留(刀图)或数量不符 → 重建为空图槽位
   const firstSlot = elements.resultGrid.children[0];
   if (elements.resultGrid.children.length !== forgeBatch.length ||
      (firstSlot && firstSlot.className !== 'forge-progress-slot')) {
      elements.resultGrid.innerHTML = '';
      forgeBatch.forEach((e, i) => {
         const slot = document.createElement('div');
         slot.className = 'forge-progress-slot';
         const img = document.createElement('img');
         img.className = 'slot-image';
         img.src = UNKNOWN_SWORD_IMG;
         img.alt = '锻造中';
         const timer = document.createElement('span');
         timer.className = 'slot-timer';
         slot.append(img, timer);
         elements.resultGrid.appendChild(slot);
      });
   }
   for (let i = 0; i < elements.resultGrid.children.length; i++) {
      const timer = elements.resultGrid.children[i].children[1];
      const rem = forgeRemaining(i);
      timer.textContent = rem <= 0 ? `第${i + 1}把 · 完成` : `第${i + 1}把 ${fmtClock(rem)}`;
   }
}

// ============================================================
// 限锻刀获得结果页(分享卡: 统计数据 + 保存为图片 + 继续)
// ============================================================

let lastTimeLimitCard = null;   // 最近一次结果页数据(测试断言用)

function roundRectPath(ctx, x, y, w, h, r) {
   ctx.beginPath();
   ctx.moveTo(x + r, y);
   ctx.arcTo(x + w, y, x + w, y + h, r);
   ctx.arcTo(x + w, y + h, x, y + h, r);
   ctx.arcTo(x, y + h, x, y, r);
   ctx.arcTo(x, y, x + w, y, r);
   ctx.closePath();
}

function pad2(n) {
   return String(n).padStart(2, '0');
}

function closeTimeLimitCard() {
   const overlay = document.getElementById('timeLimitCardOverlay');
   if (overlay) overlay.remove();
}

// 获得限锻刀时展示结果页(特殊概率/显现积分保底, 首次或重复, 每次获得都显示)
function showTimeLimitResultCard(result, source) {
   const state = curState();
   const tl = state.timeLimit;
   const time = new Date();
   const cardData = {
      eventTitle: modeTitle(currentModeId),
      swordName: result.name,
      source,                              // 特殊概率 / 显现积分保底
      specialCount: tl.specialCount,
      guaranteeCount: tl.guaranteeCount,
      totalTL: tl.specialCount + tl.guaranteeCount,
      forgeCount: state.stats.forgeCount,
      points: tl.points,
      pointsMax: config.timeLimit.guaranteePoints,
      time
   };
   lastTimeLimitCard = cardData;

   const W = 720, H = 1020;
   const FONT = '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';

   const draw = (iconImg) => {
      const ctx = canvas.getContext('2d');
      // 背景
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1b2130');
      bg.addColorStop(1, '#12151f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // 金色边框
      ctx.strokeStyle = 'rgba(201,168,106,0.55)';
      ctx.lineWidth = 3;
      roundRectPath(ctx, 14, 14, W - 28, H - 28, 18);
      ctx.stroke();

      ctx.textAlign = 'center';
      // 标题
      ctx.fillStyle = '#c9a86a';
      ctx.font = `600 30px ${FONT}`;
      ctx.fillText('限时锻刀特别版', W / 2, 78);
      ctx.fillStyle = '#9aa3b5';
      ctx.font = `400 24px ${FONT}`;
      ctx.fillText(cardData.eventTitle, W / 2, 122);

      // 刀剑图(300×300 框内按原图比例适配, 不拉伸)
      const box = 300, ix = (W - box) / 2, iy = 160;
      if (iconImg && iconImg.width > 0) {
         ctx.save();
         roundRectPath(ctx, ix, iy, box, box, 20);
         ctx.clip();
         const s = Math.min(box / iconImg.width, box / iconImg.height);
         const dw = iconImg.width * s, dh = iconImg.height * s;
         ctx.drawImage(iconImg, ix + (box - dw) / 2, iy + (box - dh) / 2, dw, dh);
         ctx.restore();
      } else {
         ctx.fillStyle = 'rgba(255,255,255,0.06)';
         roundRectPath(ctx, ix, iy, box, box, 20);
         ctx.fill();
      }
      ctx.strokeStyle = 'rgba(201,168,106,0.7)';
      ctx.lineWidth = 2;
      roundRectPath(ctx, ix, iy, box, box, 20);
      ctx.stroke();

      // 刀名
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 52px ${FONT}`;
      ctx.fillText(cardData.swordName, W / 2, 540);
      ctx.fillStyle = '#c9a86a';
      ctx.font = `400 24px ${FONT}`;
      ctx.fillText('限锻刀剑', W / 2, 584);

      // 分隔线
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(90, 624);
      ctx.lineTo(W - 90, 624);
      ctx.stroke();

      // 本次获得方式
      ctx.fillStyle = '#9aa3b5';
      ctx.font = `400 22px ${FONT}`;
      ctx.fillText('本次获得方式', W / 2, 668);
      ctx.fillStyle = '#e6c25a';
      ctx.font = `700 44px ${FONT}`;
      ctx.fillText(cardData.source, W / 2, 720);

      // 统计行(标签左 / 数值右)
      const rows = [
         ['限锻刀(特殊概率出)', cardData.specialCount],
         ['限锻刀(显现积分保底出)', cardData.guaranteeCount],
         ['累计获得限锻刀', cardData.totalTL],
         ['累计锻刀次数', cardData.forgeCount],
         ['当前显现积分', `${cardData.points} / ${cardData.pointsMax}`]
      ];
      ctx.font = `400 24px ${FONT}`;
      let ry = 772;
      for (const [label, value] of rows) {
         ctx.textAlign = 'left';
         ctx.fillStyle = '#9aa3b5';
         ctx.fillText(label, 110, ry);
         ctx.textAlign = 'right';
         ctx.fillStyle = '#e8e2d0';
         ctx.fillText(String(value), W - 110, ry);
         ry += 38;
      }

      // 底部时间 + 水印
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6b7488';
      ctx.font = `400 20px ${FONT}`;
      ctx.fillText(
         `${time.getFullYear()}-${pad2(time.getMonth() + 1)}-${pad2(time.getDate())} ${pad2(time.getHours())}:${pad2(time.getMinutes())} · 锻刀模拟器`,
         W / 2, 976
      );
   };

   const canvas = document.createElement('canvas');
   canvas.width = W;
   canvas.height = H;
   draw(null);
   // 刀图标加载完成后重绘带图版本(加载失败保持占位)
   const img = new Image();
   img.onload = () => draw(img);
   img.onerror = () => {};
   img.src = iconPath(result.name);

   // 按钮: 保存为图片 / 继续锻造
   const actions = document.createElement('div');
   actions.className = 'tl-card-actions';
   const saveBtn = document.createElement('button');
   saveBtn.className = 'tl-card-save';
   saveBtn.textContent = '保存为图片';
   saveBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `限锻-${result.name}-${time.getFullYear()}${pad2(time.getMonth() + 1)}${pad2(time.getDate())}-${pad2(time.getHours())}${pad2(time.getMinutes())}.png`;
      a.click();
   };
   const contBtn = document.createElement('button');
   contBtn.className = 'tl-card-continue';
   contBtn.textContent = '继续锻造';
   contBtn.onclick = () => {
      if (tlCardQueue.length) showNextTimeLimitCard();  // 队列还有(十连多把限锻刀) → 弹下一张
      else closeTimeLimitCard();
   };
   actions.append(saveBtn, contBtn);

   const overlay = document.createElement('div');
   overlay.id = 'timeLimitCardOverlay';
   overlay.className = 'tl-card-overlay';
   overlay.append(canvas, actions);
   closeTimeLimitCard();   // 同一时间只保留最新一张
   document.body.appendChild(overlay);
}

// 完成锻造: 加速符点击(reason='speedup')或总倒计时结束 → 整批结算
// 每把: 显示结果、入刀账、记日志; 限锻刀分享卡依次弹出(十连可能多把)
function completeForging(reason) {
   if (!forgeBatch.length) return;
   // 清除计时器
   if (forgeTimer) {
      clearInterval(forgeTimer);
      forgeTimer = null;
   }
   isForging = false;

   const speedUpCost = batchSpeedUpCost();
   const batch = forgeBatch.splice(0);
   tlCardQueue = [];
   if (reason === 'speedup') {
      logEvent(`使用加速符 ×${speedUpCost}, 完成 ${batch.length} 次锻刀`);
   }
   for (const entry of batch) {
      addToCollection(entry.result);
      // 记录锻造完成日志
      if (entry.result.isTimeLimitSword) {
         logEvent(`限锻完成: 获得限锻刀 ${entry.result.name}(${entry.tlSource})`);
         // 获得限锻刀 → 加入分享卡队列(每次获得都显示, 显现积分保底时积分已清零可重新积累)
         tlCardQueue.push({ result: entry.result, source: entry.tlSource });
      } else {
         logEvent(`锻刀完成，获得刀剑：${entry.result.name}`);
      }
   }
   if (batch.length === TENFOLD_COUNT) {
      logEvent(`十连锻刀完成: 共 ${TENFOLD_COUNT} 把刀剑入帐`);
   }
   renderStats();

   // 结果展示: 单把 = 显示该刀; 十连 = 10 把刀图+刀名全部显示在结果格
   if (batch.length === 1) {
      showResult(batch[0].result);
   } else {
      renderBatchResultGrid(batch);
   }

   // 重置 UI 状态
   elements.speedUpButton.style.display = 'none';
   elements.forgeButton.disabled = false;
   elements.tenFoldButton.disabled = false;
   elements.autoForgeButton.disabled = false;
   elements.autoStopButton.style.display = 'none';
   elements.forgeStatus.textContent = '准备锻造';
   elements.forgeTimer.style.display = 'none';
   elements.forgeTimer.textContent = '';
   updateUseFormulaBtn();

   // 限锻刀分享卡: 依次弹出
   showNextTimeLimitCard();
}

// 十连结算: 结果格显示全部刀剑(刀图+刀名), 稀有度隐藏不展示
function renderBatchResultGrid(batch) {
   elements.resultContainer.style.display = 'flex';
   elements.resultContainer.classList.add('result-section-grid');
   elements.resultImage.style.display = 'none';
   elements.resultName.innerHTML = '';
   elements.resultGrid.innerHTML = '';
   elements.resultGrid.style.display = 'grid';
   for (const entry of batch) {
      const cell = document.createElement('div');
      cell.className = 'forge-result-cell';
      const img = document.createElement('img');
      img.className = 'cell-image';
      img.src = entry.result.image;
      img.alt = entry.result.name;
      const name = document.createElement('span');
      name.className = 'cell-name';
      name.textContent = entry.result.name;
      cell.append(img, name);
      elements.resultGrid.appendChild(cell);
   }
}

// 弹出分享卡队列中的下一张(队列空则不弹)
function showNextTimeLimitCard() {
   const item = tlCardQueue.shift();
   if (item) showTimeLimitResultCard(item.result, item.source);
}

// 显示结果(单把)
function showResult(sword) {
   elements.resultContainer.classList.remove('result-section-grid');
   elements.resultImage.style.display = '';
   elements.resultImage.src = sword.image;
   elements.resultImage.alt = sword.name;
   elements.resultName.textContent = sword.name;
   elements.resultGrid.style.display = 'none';
   elements.resultContainer.style.display = 'flex';
}

// 添加到收藏(当前模式的独立刀账; 自动锻刀大批量时 render=false 由调用方批量重渲染)
function addToCollection(sword, render = true) {
   const state = curState();
   if (!state.collection[sword.name]) {
      state.collection[sword.name] = {
         count: 1,
         image: sword.image,
         rarity: sword.rarity
      };
   } else {
      state.collection[sword.name].count++;
   }
   saveState();
   if (render) renderCollection();
}

// 刀解刀剑(返还随机资源)
function deleteSword(swordName) {
   console.group('刀解刀剑');
   if (!confirm(`确定要刀解 ${swordName} 吗？`)) {
      console.groupEnd();
      return;
   }
   const state = curState();
   if (state.collection[swordName]) {
      const returned = {};
      for (const r of RES_KEYS) {
         returned[r] = Math.floor(Math.random() * 1000);
         state.resources[r] += returned[r];
      }
      if (state.collection[swordName].count > 1) {
         state.collection[swordName].count--;
      } else {
         delete state.collection[swordName];
      }
      state.stats.deleteCount++;
      saveState();
      updateAllResourceDisplays();
      renderCollection();
      logEvent(`刀解刀剑：${swordName}，返还资源：木炭 ${returned.charcoal}，玉刚 ${returned.steel}，冷却材 ${returned.coolant}，砥石 ${returned.whetstone}`);
   }
   console.groupEnd();
}

// 刀解批量公共步骤: 按刀解数量 N 逐把返还随机资源(与单把刀解同规则), 累计刀解数
function applyBulkDissolve(state, n) {
   const returned = {};
   for (const r of RES_KEYS) returned[r] = 0;
   for (let i = 0; i < n; i++) {
      for (const r of RES_KEYS) {
         const v = Math.floor(Math.random() * 1000);
         returned[r] += v;
         state.resources[r] += v;
      }
      state.stats.deleteCount++;
   }
   return returned;
}

// 只留一把: 该刀的多把副本里只留 1 把, 多余副本刀解(不影响其他刀剑)
function keepOnlySword(swordName) {
   const state = curState();
   const data = state.collection[swordName];
   if (!data) return;
   const deleteCount = Math.max(0, data.count - 1);
   if (deleteCount === 0) {
      alert(`「${swordName}」只有 1 把, 无需只留一把`);
      return;
   }
   if (!confirm(`只留「${swordName}」1 把, 刀解该刀多余 ${deleteCount} 把？（按常规返还随机资源）`)) return;
   const returned = applyBulkDissolve(state, deleteCount);
   data.count = 1;
   saveState();
   updateAllResourceDisplays();
   renderStats();
   renderCollection();
   logEvent(`只留一把：${swordName} 仅留 1 把, 刀解 ${deleteCount} 把, 返还资源：木炭 ${returned.charcoal}，玉刚 ${returned.steel}，冷却材 ${returned.coolant}，砥石 ${returned.whetstone}`);
}

// 全部刀解: 刀解当前模式刀账里所有刀剑(逐把返还随机资源, 刀解数逐把累计)
function deleteAllSwords() {
   const state = curState();
   let total = 0;
   for (const data of Object.values(state.collection)) total += data.count;
   if (!total) {
      alert('刀剑收藏已空, 无需刀解');
      return;
   }
   if (!confirm(`刀解[${modeTitle(currentModeId)}]的全部 ${total} 把刀剑？（按常规返还随机资源, 此操作不可恢复）`)) return;
   const returned = applyBulkDissolve(state, total);
   state.collection = {};
   saveState();
   updateAllResourceDisplays();
   renderStats();
   renderCollection();
   logEvent(`全部刀解：刀解 ${total} 把, 返还资源：木炭 ${returned.charcoal}，玉刚 ${returned.steel}，冷却材 ${returned.coolant}，砥石 ${returned.whetstone}`);
}

// ============================================================
// UI 渲染
// ============================================================

function updateResourceDisplay(resourceType) {
   const el = document.getElementById(`${resourceType}Value`);
   if (el) el.textContent = curState().resources[resourceType];
}

function updateAllResourceDisplays() {
   for (const r of RES_KEYS) updateResourceDisplay(r);
}

function renderStats() {
   const st = curState().stats;
   if (elements.forgeCount) elements.forgeCount.textContent = st.forgeCount;
   if (elements.deleteCount) elements.deleteCount.textContent = st.deleteCount;
}

// 渲染刀账(当前模式)
function renderCollection() {
   const container = elements.collectionList;
   if (!container) return;
   container.innerHTML = '';
   const collection = curState().collection;
   let total = 0;
   for (const [name, data] of Object.entries(collection)) {
      total += data.count;
      const item = document.createElement('div');
      item.className = 'collection-item';
      item.innerHTML = `
          <img src="${data.image}" alt="${name}" class="collection-item-image">
          <div class="collection-item-name">${name}</div>
          <div class="collection-item-count">x${data.count}</div>
          <div class="collection-item-actions">
             <button class="delete-sword-btn" data-sword-name="${name}">刀解</button>
             <button class="keep-only-btn" data-sword-name="${name}">只留一把</button>
             <button class="delete-all-btn">全部刀解</button>
          </div>
       `;
      container.appendChild(item);
      item.querySelector('.delete-sword-btn').addEventListener('click', () => deleteSword(name));
      item.querySelector('.keep-only-btn').addEventListener('click', () => keepOnlySword(name));
      item.querySelector('.delete-all-btn').addEventListener('click', () => deleteAllSwords());
   }
   if (elements.collectionCount) elements.collectionCount.textContent = total;
}

// 资源输入框失焦时修正到合法范围
function validateResourceInput(e) {
   const input = e.target;
   let value = parseInt(input.value) || 0;
   value = Math.max(config.resources.min, Math.min(config.resources.max, value));
   input.value = value;
}

function resetResourceInputs() {
   for (const r of RES_KEYS) {
      const el = document.getElementById(`${r}Input`);
      if (el) el.value = config.resources.min;
   }
}

// 使用限锻公式: 一键填入当前限锻事件的精确四资源组合(仅限锻模式且有公式时可用)
function applyLimitedFormula() {
   const event = curEvent();
   if (!event || !event.formula || isForging) return;
   for (const r of RES_KEYS) {
      const el = document.getElementById(`${r}Input`);
      if (el) el.value = event.formula[r];
   }
   logEvent(`已使用限锻公式: 木炭 ${event.formula.charcoal} / 玉刚 ${event.formula.steel} / 冷却材 ${event.formula.coolant} / 砥石 ${event.formula.whetstone}`);
   updateUseFormulaBtn();   // 填入后已匹配公式 → 按钮自动隐藏
}

// "使用限锻公式"按钮显隐: 仅限锻模式且有公式、非锻造中、且四资源尚未与公式完全匹配时显示
function updateUseFormulaBtn() {
   const el = elements.useFormulaBtn;
   if (!el) return;
   const event = curEvent();
   const show = !!event && !!event.formula && !isForging && !matchesEventFormula(readResourceInputs());
   el.style.display = show ? 'inline-block' : 'none';
}

// 整体渲染(切模式/初始化时)
function renderAll() {
   resetResourceInputs();
   updateAllResourceDisplays();
   renderStats();
   renderCollection();
   renderTimeLimitPanel();
   updateUseFormulaBtn();
}

// ============================================================
// 模式选择
// ============================================================

function renderModeSelector() {
   const sel = elements.modeSelect;
   sel.innerHTML = '';
   for (const opt of modeOptions()) {
      const o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.title;
      sel.appendChild(o);
   }
   sel.value = currentModeId;
}

// 切换锻造模式(各模式存档独立)
function selectMode(modeId) {
   if (!modeOptions().some(o => o.id === modeId)) return;
   if (modeId === currentModeId) return;
   if (isForging) {
      alert('锻造进行中, 请完成后切换模式');
      return;
   }
   saveState(); // 先存当前模式
   currentModeId = modeId;
   cachedSave = null; // 失效旧模式缓存, 下次 curState 加载新模式存档
   localStorage.setItem(MODE_KEY, modeId);
   renderAll();
   elements.resultContainer.style.display = 'none';
   elements.forgeStatus.textContent = '准备就绪';
   logEvent(`已切换到 ${modeTitle(modeId)}`);
}

// ============================================================
// 自动锻刀(移植自 bwiki MediaWiki:Building.js GodSummon: 数量 N + 速度 ms, 逐把出结果)
// 每把走完整本地锻刀机制(资源扣除/官方公式/隐藏保底/限锻规则), 锻刀时间不等真实时间,
// 结果节奏由速度(ms/把)控制; 资源不足自动按可负担数量缩减; 自动模式不弹限锻分享卡
// (限锻刀改日志 + 结果格金框标识)
// ============================================================
const AUTO_FORGE_MAX = 1000;     // 数量 N 上限
const AUTO_SPEED_MIN = 10;       // 速度下限(ms/把)
const AUTO_SPEED_MAX = 60000;    // 速度上限(ms/把)
let autoForgeActive = false;     // 自动锻刀进行中(亦用于抑制 rollForge 的逐把积分日志)
let autoTimers = [];             // 待执行的 setTimeout 句柄(停止时全部清除)
let autoProgress = { done: 0, total: 0, speed: 100 };
let autoTlCount = 0;             // 本轮已出限锻刀数

function clampInt(v, lo, hi) {
   const n = parseInt(v, 10);
   if (!Number.isFinite(n)) return lo;
   return Math.max(lo, Math.min(hi, n));
}

// 开始自动锻刀: 校验资源输入 → 按可负担数量截断 N → 逐把定时启动
function startAutoForging() {
   if (isForging || autoForgeActive || !config) return;
   const resources = readResourceInputs();
   if (!validateResources(resources)) return;

   const state = curState();
   const total = clampInt(elements.autoCountInput.value, 1, AUTO_FORGE_MAX);
   const speed = clampInt(elements.autoSpeedInput.value, AUTO_SPEED_MIN, AUTO_SPEED_MAX);
   // 每把消耗一份填写的四资源; 资源不足时缩减 N(0 = 无法启动)
   let affordable = total;
   for (const r of RES_KEYS) {
      affordable = Math.min(affordable, Math.floor(state.resources[r] / resources[r]));
   }
   if (affordable <= 0) {
      alert('资源不足, 无法启动自动锻刀');
      return;
   }
   if (affordable < total) {
      alert(`资源不足, 最多可支持 ${affordable} 把, 已按 ${affordable} 把启动`);
   }

   // 启动
   autoForgeActive = true;
   isForging = true;
   autoProgress = { done: 0, total: affordable, speed };
   autoTlCount = 0;
   elements.forgeButton.disabled = true;
   elements.tenFoldButton.disabled = true;
   elements.autoForgeButton.disabled = true;
   elements.autoStopButton.style.display = 'inline-block';
   elements.speedUpButton.style.display = 'none';
   elements.forgeStatus.textContent = `自动锻刀 0/${autoProgress.total}`;
   elements.forgeTimer.style.display = 'block';
   elements.resultContainer.style.display = 'flex';
   elements.resultContainer.classList.add('result-section-grid');
   elements.resultImage.style.display = 'none';
   elements.resultName.innerHTML = '';
   elements.resultGrid.style.display = 'grid';
   elements.resultGrid.innerHTML = '';
   updateUseFormulaBtn();
   logEvent(`开始自动锻刀[${modeTitle(currentModeId)}]: ${autoProgress.total} 把 @ ${speed}ms/把, 每把消耗 木炭 ${resources.charcoal} / 玉刚 ${resources.steel} / 冷却材 ${resources.coolant} / 砥石 ${resources.whetstone}`);
   for (let i = 0; i < affordable; i++) {
      autoTimers.push(setTimeout(() => autoForgeStep(resources), i * speed));
   }
}

// 自动锻刀单步: 资源校验 → 扣一份资源 → rollForge → 入刀账(每 10 把重渲染一次) → 结果格(保留最近 10 格)
function autoForgeStep(resources) {
   if (!autoForgeActive) return;
   const state = curState();
   for (const r of RES_KEYS) {
      if (state.resources[r] < resources[r]) {
         stopAutoForging('自动锻刀提前结束: 资源不足');
         return;
      }
   }
   for (const r of RES_KEYS) state.resources[r] -= resources[r];
   const entry = rollForge(resources);
   const render = (autoProgress.done + 1) % 10 === 0;
   addToCollection(entry.result, render);
   updateAllResourceDisplays();
   if (entry.result.isTimeLimitSword) {
      autoTlCount++;
      logEvent(`自动锻刀限锻刀: ${entry.result.name}(${entry.tlSource})`);
   }
   appendAutoCell(entry.result);
   autoProgress.done++;
   elements.forgeStatus.textContent = `自动锻刀 ${autoProgress.done}/${autoProgress.total}`;
   const remainMs = (autoProgress.total - autoProgress.done) * autoProgress.speed;
   elements.forgeTimer.textContent = remainMs > 0 ? fmtClock(Math.ceil(remainMs / 1000)) : '00:00';
   if (autoProgress.done >= autoProgress.total) {
      finishAutoForging();
   }
}

// 结果格追加一格(限锻刀金框标识), 超出 10 格时移出最早一格(始终展示最近 10 把)
function appendAutoCell(sword) {
   const cell = document.createElement('div');
   cell.className = 'forge-result-cell' + (sword.isTimeLimitSword ? ' tl-special' : '');
   const img = document.createElement('img');
   img.className = 'cell-image';
   img.src = sword.image;
   img.alt = sword.name;
   const name = document.createElement('span');
   name.className = 'cell-name';
   name.textContent = sword.name;
   cell.append(img, name);
   elements.resultGrid.appendChild(cell);
   while (elements.resultGrid.children.length > 10) {
      elements.resultGrid.removeChild(elements.resultGrid.children[0]);
   }
}

// 停止自动锻刀(手动): 清除剩余定时任务, 已锻出的保留
function stopAutoForging(reason) {
   if (!autoForgeActive) return;
   autoTimers.forEach(clearTimeout);
   autoTimers = [];
   autoForgeActive = false;
   isForging = false;
   saveState();
   renderCollection();
   renderStats();
   renderTimeLimitPanel();
   elements.forgeStatus.textContent = `自动锻刀已停止 · 完成 ${autoProgress.done}/${autoProgress.total} 把`;
   finishAutoUI();
   if (reason) logEvent(reason);
   logEvent(`自动锻刀已停止: 完成 ${autoProgress.done}/${autoProgress.total} 把, 限锻刀 ${autoTlCount} 把`);
}

// 自动锻刀全部完成
function finishAutoForging() {
   autoTimers.forEach(clearTimeout);
   autoTimers = [];
   autoForgeActive = false;
   isForging = false;
   saveState();
   renderCollection();
   renderStats();
   renderTimeLimitPanel();
   finishAutoUI();
   logEvent(`自动锻刀完成: 共 ${autoProgress.done} 把, 限锻刀 ${autoTlCount} 把, 消耗 ${autoProgress.done} 份资源`);
   elements.forgeStatus.textContent = `自动锻刀完成 · 共 ${autoProgress.done} 把`;
}

// 自动锻刀结束后的 UI 复位(与 completeForging 的复位一致, 但状态文案由调用方设置)
function finishAutoUI() {
   elements.autoStopButton.style.display = 'none';
   elements.forgeButton.disabled = false;
   elements.tenFoldButton.disabled = false;
   elements.autoForgeButton.disabled = false;
   elements.forgeTimer.style.display = 'none';
   updateUseFormulaBtn();
}

// ============================================================
// 日志
// ============================================================

let lastLogMessage = null;

function logEvent(message) {
   const now = new Date();
   const timestamp = now.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
   }).replace(/\//g, '-');

   const logArea = document.getElementById('logArea');
   if (!logArea) return;

   // 相邻重复消息去重
   if (message === lastLogMessage) return;
   lastLogMessage = message;

   const logEntry = document.createElement('div');
   logEntry.className = 'log-entry';
   logEntry.textContent = `[${timestamp}] ${message}`;
   logArea.appendChild(logEntry);
   logArea.scrollTop = logArea.scrollHeight;
}

// ============================================================
// 数据管理(刀剑收藏/日志/全量导出导入, 刀剑收藏针对当前模式)
// ============================================================

function downloadJson(data, filename) {
   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url);
}

function fileTimestamp() {
   const d = new Date();
   const p = n => String(n).padStart(2, '0');
   return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function readTextFile(input, onLoaded) {
   const file = input.files[0];
   if (!file) return;
   const reader = new FileReader();
   reader.onload = event => {
      try {
         onLoaded(JSON.parse(event.target.result));
      } catch (error) {
         alert('导入失败！请确保上传的是有效的 JSON 文件。');
         console.error('导入错误:', error);
      }
      input.value = '';
   };
   reader.readAsText(file);
}

function initDataManagement() {
   // ---- 刀剑收藏(当前模式) ----
   document.getElementById('clearSwordsBtn')?.addEventListener('click', () => {
      if (confirm(`确定要清空[${modeTitle(currentModeId)}]的刀剑收藏吗？此操作不可恢复！`)) {
         const state = curState();
         state.collection = {};
         saveState();
         renderCollection();
         alert('刀剑收藏已清空！');
      }
   });

   document.getElementById('exportSwordsBtn')?.addEventListener('click', () => {
      const state = curState();
      downloadJson({
         configId: state.configId,
         configTitle: state.configTitle,
         collection: state.collection,
         exportDate: new Date().toISOString()
      }, `刀剑锻造-刀剑收藏_${state.configId}_${fileTimestamp()}.json`);
   });

   document.getElementById('importSwordsBtn')?.addEventListener('click', () => {
      document.getElementById('importSwordsFile')?.click();
   });

   document.getElementById('importSwordsFile')?.addEventListener('change', (e) => {
      readTextFile(e.target, (data) => {
         if (!data.collection || typeof data.collection !== 'object') {
            alert('无效的刀剑文件格式！');
            return;
         }
         if (data.configId && data.configId !== currentModeId) {
            alert(`注意: 该收藏来自[${data.configId}]模式, 将导入到当前[${modeTitle(currentModeId)}]模式。`);
         }
         if (!confirm(`确定要导入刀剑吗？当前[${modeTitle(currentModeId)}]的刀剑将被覆盖！`)) return;
         const state = curState();
         state.collection = data.collection;
         saveState();
         renderCollection();
         alert('刀剑导入成功！');
      });
   });

   // ---- 日志(界面级, 不属于任一模式) ----
   document.getElementById('clearLogBtn')?.addEventListener('click', () => {
      if (confirm('确定要清空所有日志吗？此操作不可恢复！')) {
         const logArea = document.getElementById('logArea');
         if (logArea) logArea.innerHTML = '';
         lastLogMessage = null;
         alert('日志已清空！');
      }
   });

   document.getElementById('exportLogBtn')?.addEventListener('click', () => {
      const logArea = document.getElementById('logArea');
      if (!logArea || logArea.children.length === 0) {
         alert('没有可导出的日志！');
         return;
      }
      const logs = [];
      logArea.querySelectorAll('.log-entry').forEach(entry => logs.push(entry.textContent));
      downloadJson({ logs, exportDate: new Date().toISOString() }, `刀剑锻造-锻造日志_${fileTimestamp()}.json`);
   });

   document.getElementById('importLogBtn')?.addEventListener('click', () => {
      document.getElementById('importLogFile')?.click();
   });

   document.getElementById('importLogFile')?.addEventListener('change', (e) => {
      readTextFile(e.target, (data) => {
         if (!data.logs || !Array.isArray(data.logs)) {
            alert('无效的日志文件格式！');
            return;
         }
         if (!confirm('确定要导入日志吗？当前日志将被覆盖！')) return;
         const logArea = document.getElementById('logArea');
         if (logArea) {
            logArea.innerHTML = '';
            data.logs.forEach(logText => {
               const logEntry = document.createElement('div');
               logEntry.className = 'log-entry';
               logEntry.textContent = logText;
               logArea.appendChild(logEntry);
            });
            logArea.scrollTop = logArea.scrollHeight;
         }
         alert('日志导入成功！');
      });
   });

   // ---- 全量(所有模式存档, 各存档自带 configId 字段) ----
   document.getElementById('resetBtn')?.addEventListener('click', () => {
      if (confirm('确定要重置所有本地数据吗？此操作不可恢复！')) {
         Object.keys(localStorage).forEach(key => {
            if (key.startsWith('touken')) localStorage.removeItem(key);
         });
         location.reload();
      }
   });

   document.getElementById('exportBtn')?.addEventListener('click', () => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key.startsWith('touken')) data[key] = localStorage.getItem(key);
      }
      downloadJson({ data, exportDate: new Date().toISOString() }, `刀剑锻造-全部数据_${fileTimestamp()}.json`);
   });

   document.getElementById('importBtn')?.addEventListener('click', () => {
      document.getElementById('importFile')?.click();
   });

   document.getElementById('importFile')?.addEventListener('change', (e) => {
      readTextFile(e.target, (payload) => {
         const data = payload && typeof payload === 'object' ? (payload.data || payload) : null;
         if (!data || typeof data !== 'object' || Array.isArray(data)) {
            alert('无效的全量数据格式！');
            return;
         }
         if (!confirm('确定要导入全部数据吗？当前所有模式的存档将被覆盖！')) return;
         // 先清旧键(只清 touken 前缀), 再写入导入的 touken 键
         Object.keys(localStorage).forEach(key => {
            if (key.startsWith('touken')) localStorage.removeItem(key);
         });
         for (const [key, value] of Object.entries(data)) {
            if (key.startsWith('touken')) {
               localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
         }
         location.reload();
      });
   });
}

// ============================================================
// 工具函数与初始化
// ============================================================

function formatTime(seconds) {
   const mins = Math.floor(seconds / 60);
   const secs = seconds % 60;
   return `剩余: ${mins}分${secs < 10 ? '0' : ''}${secs}秒`;
}

// mm:ss 短格式(多把锻造的逐把倒计时用)
function fmtClock(seconds) {
   const mins = Math.floor(seconds / 60);
   const secs = seconds % 60;
   return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function bindElements() {
   elements = {
      forgeButton: document.getElementById('forgeButton'),
      useFormulaBtn: document.getElementById('useFormulaBtn'),
      tenFoldButton: document.getElementById('tenFoldButton'),
      speedUpButton: document.getElementById('speedUpButton'),
      forgeStatus: document.getElementById('forgeStatus'),
      forgeTimer: document.getElementById('forgeTimer'),
      resultContainer: document.getElementById('resultContainer'),
      resultImage: document.getElementById('resultImage'),
      resultName: document.getElementById('resultName'),
      resultGrid: document.getElementById('resultGrid'),
      collectionCount: document.getElementById('collectionCount'),
      collectionList: document.getElementById('collectionList'),
      forgeCount: document.getElementById('forgeCount'),
      deleteCount: document.getElementById('deleteCount'),
      modeSelect: document.getElementById('modeSelect'),
      timeLimitSection: document.getElementById('timeLimitSection'),
      timeLimitStatus: document.getElementById('timeLimitStatus'),
      timeLimitStats: document.getElementById('timeLimitStats'),
      tlSwordName: document.getElementById('tlSwordName'),
      tlFormula: document.getElementById('tlFormula'),
      tlSpecialProb: document.getElementById('tlSpecialProb'),
      tlGuarantee: document.getElementById('tlGuarantee'),
      tlPoints: document.getElementById('tlPoints'),
      tlSpecialCount: document.getElementById('tlSpecialCount'),
      tlGuaranteeCount: document.getElementById('tlGuaranteeCount'),
      autoCountInput: document.getElementById('autoCountInput'),
      autoSpeedInput: document.getElementById('autoSpeedInput'),
      autoForgeButton: document.getElementById('autoForgeButton'),
      autoStopButton: document.getElementById('autoStopButton')
   };

   elements.forgeButton.addEventListener('click', startForging);
   elements.useFormulaBtn.addEventListener('click', applyLimitedFormula);
   elements.tenFoldButton.addEventListener('click', tenFoldForging);
   elements.autoForgeButton.addEventListener('click', startAutoForging);
   elements.autoStopButton.addEventListener('click', () => stopAutoForging());
   for (const r of RES_KEYS) {
      document.getElementById(`${r}Input`).addEventListener('blur', validateResourceInput);
      document.getElementById(`${r}Input`).addEventListener('input', updateUseFormulaBtn);
   }
   elements.modeSelect.addEventListener('change', () => selectMode(elements.modeSelect.value));
}

async function initApp() {
   console.group('应用初始化');
   bindElements();

   // 1. 加载配置(失败则停机并提示)
   try {
      await loadConfig();
   } catch (e) {
      console.error('配置加载失败:', e);
      elements.resultContainer.style.display = 'flex';
      elements.resultImage.src = '../images/touken/刀账图标/no_touken.jpg';
      elements.resultName.textContent = '配置加载失败, 请检查 JSON/touken-forge-config.json';
      elements.forgeButton.disabled = true;
      elements.tenFoldButton.disabled = true;
      elements.autoForgeButton.disabled = true;
      console.groupEnd();
      return;
   }

   // 2. 迁移旧版存档 → 恢复上次选择的模式 → 构建模式列表(选中态与内部状态一致)
   migrateLegacySaves();
   let initial = localStorage.getItem(MODE_KEY) || DAILY_MODE_ID;
   if (!modeOptions().some(o => o.id === initial)) initial = DAILY_MODE_ID;
   currentModeId = initial;
   renderModeSelector();
   renderAll();
   initDataManagement();
   logEvent(`锻刀模拟器就绪, 当前模式: ${modeTitle(currentModeId)}`);
   console.groupEnd();
}

document.addEventListener('DOMContentLoaded', initApp);
