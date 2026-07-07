const SHOP_SLOT_COUNT = 9;
const HERO_SHOP_SLOTS = 6;
const STRATAGEM_SHOP_SLOTS = 3;
const LINEUP_SLOT_COUNT = 5;
const TURN_GOLD = 100;
const GOLD_CAP = 100;
const REFRESH_COST = 1;
const MAX_UNIT_BONDS = 2;
const BOND_FACTIONS = ["魏", "蜀", "吴"];

const TEAM_SLOT_RECTS = [
  { x: -425, y: -35, w: 160, h: 250 },
  { x: -215, y: -35, w: 160, h: 250 },
  { x: -5, y: -35, w: 160, h: 250 },
  { x: 205, y: -35, w: 160, h: 250 },
  { x: 415, y: -35, w: 160, h: 250 },
];

const SHOP_SLOT_RECTS = [
  { x: -790, y: -210, w: 142, h: 210 },
  { x: -593, y: -210, w: 142, h: 210 },
  { x: -396, y: -210, w: 142, h: 210 },
  { x: -199, y: -210, w: 142, h: 210 },
  { x: -2, y: -210, w: 142, h: 210 },
  { x: 195, y: -210, w: 142, h: 210 },
  { x: 392, y: -210, w: 142, h: 210 },
  { x: 589, y: -210, w: 142, h: 210 },
  { x: 786, y: -210, w: 142, h: 210 },
];

const BOND_RULES = {
  魏: {
    name: "魏",
    label: "魏国羁绊",
    effects: {
      1: "友军阵亡时，随机 1 名友方获得 +1 攻击、+1 生命。",
      2: "友军阵亡时，随机 3 名友方获得 +1 攻击、+1 生命。",
      3: "友军阵亡时，随机 3 名友方获得+1 攻击、+1 生命，并有50%概率在原地生成1/1的士兵。",
      4: "友军阵亡时，全军+2 攻击、+2 生命，首次阵亡时在原地生成1/1的士兵。",
    },
  },
  蜀: {
    name: "蜀",
    label: "蜀国羁绊",
    effects: {
      1: "战斗开始时，对随机 2 名敌人造成 2 点伤害。",
      2: "战斗开始时，对生命值最低的 3 名敌人造成 3 点伤害",
      3: "战斗开始时，对最后排敌方造成5点伤害，触发5次",
      4: "战斗开始时，对生命值最低的敌方造成10点伤害，触发5次",
    },
  },
  吴: {
    name: "吴",
    label: "吴国羁绊",
    effects: {
      1: "战斗开始时，使随机 2 名敌人获得 灼烧。",
      2: "战斗开始时，敌军全体获得 灼烧。",
      3: "战斗开始时，敌军全体获得 灼烧，友军攻击时，随机引燃灼烧单位",
      4: "战斗开始时，敌军全体获得 灼烧，友军攻击时，随机引燃灼烧单位，灼烧被引燃后不会消失",
    },
  },
};

const CARD_POOLS = {
  hero: [
    { name: "曹操", faction: "魏", tier: 1, attack: 2, health: 3, skill: "购买时，使攻击力最高的武将原有羁绊改为魏国羁绊；若已有魏国羁绊则 +3 攻击。", cost: 3, image: "res/hero_icon/hero_caocao.png" },
    { name: "乐进", faction: "魏", tier: 1, attack: 3, health: 2, skill: "魏将阵亡时，自身攻击加1。", cost: 3, image: "res/hero_icon/hero_yuejin.png" },
    { name: "曹仁", faction: "魏", tier: 2, attack: 2, health: 5, skill: "魏将阵亡时，自身生命加1。", cost: 3, image: "res/hero_icon/hero_caoren.png" },
    { name: "贾诩", faction: "魏", tier: 2, attack: 1, health: 4, skill: "战斗开始时，随机给1个敌人获得反间。", cost: 3, image: "res/hero_icon/hero_jiaxu.png" },
    { name: "夏侯渊", faction: "魏", tier: 2, attack: 5, health: 2, skill: "友军阵亡时，自身攻击加2。", cost: 3, image: "res/hero_icon/hero_xiahouyuan.png" },
    { name: "张郃", faction: "魏", tier: 2, attack: 4, health: 3, skill: "友军阵亡后，下次伤害加1。", cost: 3, image: "res/hero_icon/hero_zhanghe.png" },
    { name: "赵云", faction: "蜀", tier: 1, attack: 2, health: 3, skill: "回合结束时，若只激活1个羁绊，自身获得 +1 攻击、+1 生命。", cost: 3, image: "res/hero_icon/hero_zhaoyun.png" },
    { name: "法正", faction: "蜀", tier: 1, attack: 1, health: 3, skill: "我方羁绊数量变化时，随机友军获得 +1 攻击、+1 生命。", cost: 3, image: "res/hero_icon/hero_fazheng.png" },
    { name: "马超", faction: "蜀", tier: 2, attack: 3, health: 4, skill: "购买时，可选择另1个阵营的羁绊，使自己存在2个羁绊。", cost: 3, image: "res/hero_icon/hero_machao.png" },
    { name: "关羽", faction: "蜀", tier: 2, attack: 6, health: 4, skill: "首次攻击时，伤害翻倍。", cost: 3, image: "res/hero_icon/hero_guanyu.png" },
    { name: "张飞", faction: "蜀", tier: 2, attack: 4, health: 5, skill: "战斗开始时，前排敌人破胆。", cost: 3, image: "res/hero_icon/hero_zhangfei.png" },
    { name: "廖化", faction: "蜀", tier: 1, attack: 3, health: 3, skill: "战斗开始时，低生命敌人受到2点伤害。", cost: 3, image: "res/hero_icon/hero_liaohua.png" },
    { name: "孙权", faction: "吴", tier: 1, attack: 2, health: 3, skill: "回合结束时，使攻击力最高的吴军获得 +1 攻击、+1 生命。", cost: 3, image: "res/hero_icon/hero_sunquan.png" },
    { name: "韩当", faction: "吴", tier: 1, attack: 3, health: 2, skill: "使后方武将获得吴国羁绊。", cost: 3, image: "res/hero_icon/hero_handang.png" },
    { name: "鲁肃", faction: "吴", tier: 2, attack: 1, health: 5, skill: "我军羁绊数>1时，使全军获得 +1 攻击、+1 生命。", cost: 3, image: "res/hero_icon/hero_lusu.png" },
    { name: "周瑜", faction: "吴", tier: 2, attack: 4, health: 4, skill: "攻击前，引燃所有灼烧敌人。", cost: 3, image: "res/hero_icon/hero_zhouyu.png" },
    { name: "太史慈", faction: "吴", tier: 2, attack: 5, health: 3, skill: "攻击后，对有随机负面状态的敌军额外造成2伤害。", cost: 3, image: "res/hero_icon/hero_taishici.png" },
    { name: "凌统", faction: "吴", tier: 1, attack: 4, health: 3, skill: "我军羁绊升级时，使所有吴军获得 +1 攻击、+1 生命。", cost: 3, image: "res/hero_icon/hero_lingtong.png" },
    { name: "华佗", faction: "无", tier: 2, attack: 1, health: 4, skill: "首个友军阵亡时复活。", cost: 3, image: "res/hero_icon/hero_huatuo.png" },
    { name: "左慈", faction: "无", tier: 2, attack: 2, health: 4, skill: "不良状态目标受伤翻倍。", cost: 3, image: "res/hero_icon/hero_zuoci.png" },
  ],
  stratagem: [
    { name: "整军", tier: 1, cost: 2, skill: "当前最高等级羁绊的武将各获得 +1 生命。", image: "res/item_icon/strat_zhenjun.png" },
    { name: "招贤", tier: 1, cost: 3, skill: "刷新商店，并保证出现 1 张当前最高羁绊武将。", image: "res/item_icon/strat_qiyu.png" },
    { name: "易帜", tier: 1, cost: 2, skill: "选择 1 名武将，本回合额外计入最多的羁绊。", image: "res/item_icon/strat_junlve.png" },
    { name: "分兵", tier: 1, cost: 2, skill: "若阵容中无羁绊成立，全体获得 +1 攻击、+1 生命。", image: "res/item_icon/strat_jibing.png" },
    { name: "合纵", tier: 1, cost: 4, skill: "若有 2 个羁绊生效，随机 3 名友军获得 +1 生命。", image: "res/item_icon/strat_kuojun.png" },
  ],
};

let state = createInitialState();
let toastTimer = 0;
let draggedShopIndex = null;
let pointerDraggedShopIndex = null;
let draggedLineupIndex = null;
let pointerDraggedLineupIndex = null;
let pointerMoved = false;

const elements = {
  roundText: document.querySelector("#roundText"),
  phaseText: document.querySelector("#phaseText"),
  tierText: document.querySelector("#tierText"),
  goldText: document.querySelector("#goldText"),
  lifeText: document.querySelector("#lifeText"),
  trophyText: document.querySelector("#trophyText"),
  refreshButton: document.querySelector("#refreshButton"),
  endTurnButton: document.querySelector("#endTurnButton"),
  resetButton: document.querySelector("#resetButton"),
  shopGrid: document.querySelector("#shopGrid"),
  lineupGrid: document.querySelector("#lineupGrid"),
  bondList: document.querySelector("#bondList"),
  logList: document.querySelector("#logList"),
  toast: document.querySelector("#toast"),
  flowShop: document.querySelector("#flowShop"),
  flowBattle: document.querySelector("#flowBattle"),
  flowNext: document.querySelector("#flowNext"),
};

function createInitialState() {
  return {
    round: 1,
    phase: "shop",
    gold: TURN_GOLD,
    life: 5,
    trophies: 0,
    shop: Array.from({ length: SHOP_SLOT_COUNT }, () => null),
    lineup: Array.from({ length: LINEUP_SLOT_COUNT }, () => null),
    logs: ["第 1 回合开始，获得 100 金币。"],
    serial: 1,
  };
}

function getTier(round) {
  return 1;
}

function isRefreshSlot(index, round) {
  return index >= 0 && index < SHOP_SLOT_COUNT;
}

function createCard(type) {
  const pool = CARD_POOLS[type];
  const base = pool[Math.floor(Math.random() * pool.length)];
  return createCardFromBase(base, type);
}

function createCardFromBase(base, type) {
  const id = `${type}-${state.serial}`;
  state.serial += 1;
  return {
    ...base,
    id,
    type,
    tier: base.tier ?? getTier(state.round),
  };
}

function createHeroCardByFaction(faction) {
  const candidates = CARD_POOLS.hero.filter((hero) => hero.faction === faction);
  const pool = candidates.length > 0 ? candidates : CARD_POOLS.hero;
  const base = pool[Math.floor(Math.random() * pool.length)];
  return createCardFromBase(base, "hero");
}

function createUnitFromCard(card) {
  return {
    id: card.id,
    name: card.name,
    faction: card.faction,
    tier: card.tier,
    attack: card.attack,
    health: card.health,
    skill: card.skill,
    image: card.image,
    level: 1,
    extraFactions: [],
    tempExtraFactions: [],
  };
}

function buildShop({ guaranteeFaction = null } = {}) {
  state.shop = Array.from({ length: SHOP_SLOT_COUNT }, () => null);

  for (let index = 0; index < SHOP_SLOT_COUNT; index += 1) {
    state.shop[index] = createCard(index < HERO_SHOP_SLOTS ? "hero" : "stratagem");
  }

  if (guaranteeFaction) {
    state.shop[0] = createHeroCardByFaction(guaranteeFaction);
  }
}

function refreshShop({ free = false, guaranteeFaction = null } = {}) {
  if (!free && state.gold < REFRESH_COST) {
    notify("金币不足，无法刷新。");
    return;
  }

  if (!free) state.gold -= REFRESH_COST;

  buildShop({ guaranteeFaction });

  addLog(free ? "商店已生成本回合内容。" : "消耗 1 金币刷新商店。");
  render();
}

function buyCard(index) {
  if (state.phase !== "shop") return;
  const card = state.shop[index];
  if (!card) return;
  if (state.gold < card.cost) {
    notify("金币不足，无法购买。");
    return;
  }

  if (card.type === "stratagem") {
    useStratagem(index, card);
    return;
  }

  const targetIndex = state.lineup.findIndex((slot) => slot === null);
  if (targetIndex === -1) {
    notify("阵容已满，无法购买武将。");
    return;
  }

  state.gold -= card.cost;
  const unit = createUnitFromCard(card);
  state.lineup[targetIndex] = unit;
  state.shop[index] = null;
  addLog(`购买 ${card.name} 到 ${targetIndex + 1} 号阵容槽。`);
  applyHeroPurchaseSkill(unit);
  render();
}

function buyHeroToLineup(shopIndex, lineupIndex) {
  if (state.phase !== "shop") return;
  const card = state.shop[shopIndex];
  if (!card || card.type !== "hero") return;
  if (state.gold < card.cost) {
    notify("金币不足，无法购买武将。");
    return;
  }
  if (state.lineup[lineupIndex]) {
    notify("目标阵容槽已有武将。");
    return;
  }

  state.gold -= card.cost;
  const unit = createUnitFromCard(card);
  state.lineup[lineupIndex] = unit;
  state.shop[shopIndex] = null;
  addLog(`拖拽购买 ${card.name} 到 ${lineupIndex + 1} 号阵容槽。`);
  applyHeroPurchaseSkill(unit);
  render();
}

function useStratagem(index, card) {
  const result = resolveStratagem(card);
  if (!result.success) {
    notify(result.message);
    addLog(`${card.name} 未结算：${result.message}`);
    render();
    return;
  }

  state.gold -= card.cost;
  if (result.refreshShop) {
    buildShop({ guaranteeFaction: result.guaranteeFaction });
  } else {
    state.shop[index] = null;
  }
  addLog(result.message);
  render();
}

function resolveStratagem(card) {
  const units = getLineupUnits();
  if (units.length === 0) {
    return { success: false, message: "阵容中没有武将。" };
  }

  switch (card.name) {
    case "整军":
      return resolveZhenjun();
    case "招贤":
      return resolveZhaoxian();
    case "易帜":
      return resolveYizhi();
    case "分兵":
      return resolveFenbing();
    case "合纵":
      return resolveHezong();
    default:
      return { success: false, message: `${card.name} 还没有配置结算效果。` };
  }
}

function resolveZhenjun() {
  const highest = getHighestActiveBondNames();
  if (highest.length === 0) {
    return { success: false, message: "当前没有已生效的羁绊。" };
  }

  const affected = state.lineup.filter(
    (unit, index) => unit && getEffectiveUnitBonds(unit, index).some((faction) => highest.includes(faction)),
  );
  affected.forEach((unit) => {
    unit.health += 1;
  });

  return {
    success: true,
    message: `整军结算：${formatFactionList(highest)}羁绊武将各获得 +1 生命。`,
  };
}

function resolveZhaoxian() {
  const targetFaction = getHighestBondFactionForRecruit();
  return {
    success: true,
    refreshShop: true,
    guaranteeFaction: targetFaction,
    message: targetFaction
      ? `招贤结算：刷新商店，并保证出现 1 张${targetFaction}国武将。`
      : "招贤结算：刷新商店；当前没有羁绊计数，保证出现 1 张随机武将。",
  };
}

function resolveYizhi() {
  const targetFaction = getMostCountedBondFaction();
  if (!targetFaction) {
    return { success: false, message: "当前没有可借用的羁绊。" };
  }

  const target = getBestExtraBondTarget(targetFaction);
  if (!target) {
    return { success: false, message: `没有武将可以额外计入${targetFaction}国羁绊。` };
  }

  addExtraBond(target.unit, targetFaction, { temporary: true });
  return {
    success: true,
    message: `易帜结算：${target.unit.name} 本回合额外计入${targetFaction}国羁绊。`,
  };
}

function resolveFenbing() {
  if (getActiveBondCount() !== 0) {
    return { success: false, message: "当前已有羁绊生效，不能触发分兵。" };
  }

  getLineupUnits().forEach((unit) => {
    unit.attack += 1;
    unit.health += 1;
  });

  return { success: true, message: "分兵结算：阵容中无羁绊成立，全体获得 +1 攻击、+1 生命。" };
}

function resolveHezong() {
  if (getActiveBondCount() < 2) {
    return { success: false, message: "需要至少 2 个羁绊生效。" };
  }

  const affected = pickRandomUnits(getLineupUnits(), 3);
  affected.forEach((unit) => {
    unit.health += 1;
  });

  return {
    success: true,
    message: `合纵结算：${affected.map((unit) => unit.name).join("、")} 获得 +1 生命。`,
  };
}

function applyHeroPurchaseSkill(unit) {
  if (unit.name !== "曹操") return;

  const target = getHighestAttackUnit();
  if (!target) return;

  if (getEffectiveUnitBonds(target.unit, target.index).includes("魏")) {
    target.unit.attack += 3;
    addLog(`曹操购买效果：${target.unit.name} 已有魏国羁绊，获得 +3 攻击。`);
    return;
  }

  const oldFaction = getFateLabel(target.unit.faction);
  target.unit.faction = "魏";
  addLog(`曹操购买效果：${target.unit.name} 的原有羁绊由${oldFaction}改为魏国羁绊。`);
}

function clearLineupDropState() {
  document.querySelectorAll(".lineup-slot").forEach((slot) => {
    slot.classList.remove("drop-target", "drop-blocked");
  });
}

function markLineupDropTarget(clientX, clientY) {
  clearLineupDropState();
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return;
  const lineupIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(lineupIndex)) return;
  target.classList.toggle("drop-target", state.lineup[lineupIndex] === null);
  target.classList.toggle("drop-blocked", state.lineup[lineupIndex] !== null);
}

function markLineupSwapTarget(clientX, clientY, sourceIndex) {
  clearLineupDropState();
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return;
  const lineupIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(lineupIndex) || lineupIndex === sourceIndex) return;
  target.classList.add("drop-target");
}

function swapLineupUnits(sourceIndex, targetIndex) {
  if (sourceIndex === targetIndex) return;
  const source = state.lineup[sourceIndex];
  state.lineup[sourceIndex] = state.lineup[targetIndex];
  state.lineup[targetIndex] = source;
  addLog(`交换 ${sourceIndex + 1} 号与 ${targetIndex + 1} 号阵容位。`);
  render();
}

function sellUnit(index) {
  if (state.phase !== "shop") return;
  const unit = state.lineup[index];
  if (!unit) return;
  state.gold = Math.min(GOLD_CAP, state.gold + unit.level);
  state.lineup[index] = null;
  addLog(`出售 ${unit.name}，获得 ${unit.level} 金币。`);
  render();
}

function endTurn() {
  if (state.phase !== "shop") return;
  state.phase = "battle";
  state.gold = 0;
  addLog("结束回合，金币清零，进入战斗阶段。");
  render();

  window.setTimeout(() => {
    addLog("Demo 省略战斗表现，直接进入下一回合。");
    startNextRound();
  }, 650);
}

function startNextRound() {
  state.round += 1;
  state.phase = "shop";
  state.gold = TURN_GOLD;
  clearTemporaryBonds();
  addLog(`第 ${state.round} 回合开始，获得 100 金币。`);
  refreshShop({ free: true });
}

function resetDemo() {
  state = createInitialState();
  refreshShop({ free: true });
}

function addLog(message) {
  state.logs.unshift(message);
  state.logs = state.logs.slice(0, 12);
}

function notify(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 1800);
}

function getCardMetaText(card) {
  if (!card) return "空";
  if (card.type === "hero") {
    return `${card.tier} 阶 · ${card.attack}/${card.health} · ${card.cost} 金币`;
  }
  return `${card.cost} 金币`;
}

function getUnitMetaText(unit) {
  return `${unit.tier} 阶 · ${unit.level} 级 · ${unit.attack}/${unit.health}`;
}

function getBondLevel(count) {
  if (count >= 5) return 4;
  if (count >= 4) return 3;
  if (count >= 3) return 2;
  if (count >= 2) return 1;
  return 0;
}

function getBondLevelText(level) {
  return level === 4 ? "满级" : `LV${level}`;
}

function getLineupUnits() {
  return state.lineup.filter(Boolean);
}

function clearTemporaryBonds() {
  state.lineup.forEach((unit) => {
    if (unit) unit.tempExtraFactions = [];
  });
}

function normalizeBondTags(tags) {
  const unique = [];
  tags.forEach((faction) => {
    if (!BOND_RULES[faction] || unique.includes(faction)) return;
    if (unique.length < MAX_UNIT_BONDS) unique.push(faction);
  });
  return unique;
}

function getBaseUnitBonds(unit) {
  if (!unit) return [];
  return normalizeBondTags([
    unit.faction,
    ...(unit.extraFactions ?? []),
    ...(unit.tempExtraFactions ?? []),
  ]);
}

function hasHandangBehindBonus(index) {
  return state.lineup.some((unit, unitIndex) => unit?.name === "韩当" && unitIndex < index);
}

function getEffectiveUnitBonds(unit, index = -1) {
  const tags = getBaseUnitBonds(unit);
  if (index >= 0 && hasHandangBehindBonus(index)) {
    return normalizeBondTags([...tags, "吴"]);
  }
  return tags;
}

function addExtraBond(unit, faction, { temporary = false } = {}) {
  if (!BOND_RULES[faction]) return false;
  if (getBaseUnitBonds(unit).includes(faction)) return false;
  if (getBaseUnitBonds(unit).length >= MAX_UNIT_BONDS) return false;

  const key = temporary ? "tempExtraFactions" : "extraFactions";
  unit[key] = normalizeBondTags([...(unit[key] ?? []), faction]);
  return true;
}

function getBondCounts() {
  const namesByFaction = Object.fromEntries(BOND_FACTIONS.map((faction) => [faction, new Set()]));
  state.lineup.forEach((unit, index) => {
    if (!unit) return;
    getEffectiveUnitBonds(unit, index).forEach((faction) => {
      namesByFaction[faction]?.add(unit.name);
    });
  });
  return Object.fromEntries(
    Object.entries(namesByFaction).map(([faction, names]) => [faction, names.size]),
  );
}

function getBondEntries() {
  const counts = getBondCounts();
  return BOND_FACTIONS.map((faction) => ({
    faction,
    count: counts[faction] ?? 0,
    level: getBondLevel(counts[faction] ?? 0),
  }));
}

function getActiveBondCount() {
  return getBondEntries().filter((entry) => entry.level > 0).length;
}

function getHighestActiveBondNames() {
  const active = getBondEntries().filter((entry) => entry.level > 0);
  if (active.length === 0) return [];
  const highestLevel = Math.max(...active.map((entry) => entry.level));
  return active.filter((entry) => entry.level === highestLevel).map((entry) => entry.faction);
}

function getHighestBondFactionForRecruit() {
  const entries = getBondEntries();
  const highestLevel = Math.max(...entries.map((entry) => entry.level));
  const highestCount = Math.max(...entries.filter((entry) => entry.level === highestLevel).map((entry) => entry.count));
  const target = entries.find((entry) => entry.level === highestLevel && entry.count === highestCount && entry.count > 0);
  return target?.faction ?? null;
}

function getMostCountedBondFaction() {
  const entries = getBondEntries().filter((entry) => entry.count > 0);
  if (entries.length === 0) return null;
  const highestCount = Math.max(...entries.map((entry) => entry.count));
  return entries.find((entry) => entry.count === highestCount)?.faction ?? null;
}

function getBestExtraBondTarget(faction) {
  const candidates = state.lineup
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit, index }) => {
      if (!unit) return false;
      const bonds = getEffectiveUnitBonds(unit, index);
      return !bonds.includes(faction) && getBaseUnitBonds(unit).length < MAX_UNIT_BONDS;
    });
  candidates.sort((a, b) => b.unit.attack - a.unit.attack || a.index - b.index);
  return candidates[0] ?? null;
}

function getHighestAttackUnit() {
  const candidates = state.lineup
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit }) => Boolean(unit));
  candidates.sort((a, b) => b.unit.attack - a.unit.attack || a.index - b.index);
  return candidates[0] ?? null;
}

function pickRandomUnits(units, count) {
  return [...units]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, units.length));
}

function formatFactionList(factions) {
  return factions.map((faction) => `${faction}国`).join("、");
}

function getFactionClass(faction) {
  return `faction-${faction}`;
}

function getFateLabel(faction) {
  const labels = {
    魏: "魏国羁绊",
    蜀: "蜀国羁绊",
    吴: "吴国羁绊",
    无: "无名羁绊",
  };
  return labels[faction] ?? `${faction}羁绊`;
}

function applyUnityRect(element, rect) {
  element.style.left = `${960 + rect.x - rect.w / 2}px`;
  element.style.top = `${540 - rect.y - rect.h / 2}px`;
  element.style.width = `${rect.w}px`;
  element.style.height = `${rect.h}px`;
}

function applyLocalRect(element, rect, parentWidth, parentHeight) {
  element.style.left = `${parentWidth / 2 + rect.x - rect.w / 2}px`;
  element.style.top = `${parentHeight / 2 - rect.y - rect.h / 2}px`;
  element.style.width = `${rect.w}px`;
  element.style.height = `${rect.h}px`;
}

function applyShopPanelRect(element, rect) {
  const globalLeft = 960 + rect.x - rect.w / 2;
  const globalTop = 540 - rect.y - rect.h / 2;
  element.style.left = `${globalLeft - 61}px`;
  element.style.top = `${globalTop - 540}px`;
  element.style.width = `${rect.w}px`;
  element.style.height = `${rect.h}px`;
}

function createFactionTag(faction) {
  const tag = document.createElement("div");
  tag.className = `faction-tag ${getFactionClass(faction)}`;
  tag.innerHTML = `<span>羁绊</span><strong>${faction}</strong>`;
  return tag;
}

function createTierStars(tier) {
  return Array.from({ length: tier }, () => '<img src="res/HeroCard/star.png" alt="" />').join("");
}

function createHeroFateMarkup(hero, lineupIndex = null) {
  const bonds =
    Number.isInteger(lineupIndex) ? getEffectiveUnitBonds(hero, lineupIndex) : getBaseUnitBonds(hero);
  if (bonds.length === 0) return "";

  return `
    <div class="hero-fate-row ${bonds.length > 1 ? "multi" : ""}">
      ${bonds
        .map(
          (faction) => `<div class="hero-fate hero-fate-${faction}">
            <strong>${getFateLabel(faction)}</strong>
          </div>`,
        )
        .join("")}
    </div>
  `;
}

function createHeroCardMarkup(hero, { showCost = false, lineupIndex = null } = {}) {
  const fateMarkup = createHeroFateMarkup(hero, lineupIndex);
  const bondLabel = (Number.isInteger(lineupIndex) ? getEffectiveUnitBonds(hero, lineupIndex) : getBaseUnitBonds(hero))
    .map(getFateLabel)
    .join("、") || "无羁绊";

  return `
    <div class="hero-card" tabindex="0" aria-label="${hero.name}，${bondLabel}，${hero.skill}">
      <img class="hero-portrait" src="${hero.image}" alt="${hero.name}" />
      <div class="hero-nameplate">${hero.name}</div>
      ${showCost ? `<div class="hero-cost"><img src="res/HeroCard/coin_no_diamond_preview2.png" alt="" /><span>${hero.cost}</span></div>` : ""}
      ${fateMarkup}
      <div class="hero-stars">${createTierStars(hero.tier)}</div>
      <img class="hero-wave" src="res/HeroCard/wave.png" alt="" />
      <div class="hero-stat hero-attack">
        <img src="res/HeroCard/atk_bk.png" alt="" />
        <span>${hero.attack}</span>
      </div>
      <div class="hero-stat hero-health">
        <img src="res/HeroCard/hp_bk.png" alt="" />
        <span>${hero.health}</span>
      </div>
      <div class="hero-skill-tooltip">${hero.skill}</div>
    </div>
  `;
}

function createItemCardMarkup(item) {
  return `
    <div class="item-card" tabindex="0" aria-label="${item.name}，${item.skill}">
      <img class="item-icon" src="${item.image}" alt="${item.name}" />
      <div class="item-nameplate">${item.name}</div>
      <div class="item-cost">
        <img src="res/HeroCard/coin_no_diamond_preview2.png" alt="" />
        <span>${item.cost}</span>
      </div>
      <img class="item-wave" src="res/HeroCard/wave.png" alt="" />
      <div class="item-stars">${createTierStars(item.tier ?? 1)}</div>
      <div class="item-skill-tooltip">${item.skill}</div>
    </div>
  `;
}

function renderShop() {
  elements.shopGrid.replaceChildren();
  state.shop.forEach((card, index) => {
    const enabled = isRefreshSlot(index, state.round);
    const slot = document.createElement("article");
    slot.className = [
      "slot",
      "shop-slot-shell",
      enabled ? "enabled" : "disabled",
      card?.type === "hero" ? "draggable-card" : "",
    ].join(" ");
    applyShopPanelRect(slot, SHOP_SLOT_RECTS[index]);
    if (card?.type === "hero") {
      slot.draggable = false;
      slot.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button") || state.phase !== "shop") return;
        pointerDraggedShopIndex = index;
        pointerMoved = false;
      });
      slot.addEventListener("dragstart", (event) => {
        draggedShopIndex = index;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      });
      slot.addEventListener("dragend", () => {
        draggedShopIndex = null;
      });
    }

    const header = document.createElement("div");
    header.className = "slot-index";
    header.innerHTML = `<span>${index + 1} 号位</span><span class="slot-type">${index < HERO_SHOP_SLOTS ? "武将" : "道具"}</span>`;

    const body = document.createElement("div");
    body.className = "slot-body";
    if (card) {
      if (card.type === "hero") {
        body.innerHTML = `
          ${createHeroCardMarkup(card, { showCost: true })}
        `;
      } else {
        body.innerHTML = `
          ${createItemCardMarkup(card)}
        `;
      }
    } else {
      body.innerHTML = `<div class="card-name">空槽位</div><div class="card-meta">等待刷新生成内容</div>`;
    }

    const actions = document.createElement("div");
    actions.className = "slot-actions";
    if (card?.type === "stratagem") {
      actions.append(createButton("结算", () => buyCard(index), "small-button"));
    }

    slot.append(header, body, actions);
    elements.shopGrid.append(slot);
  });
}

function renderLineup() {
  elements.lineupGrid.replaceChildren();
  state.lineup.forEach((unit, index) => {
    const slot = document.createElement("article");
    slot.className = "slot lineup-slot enabled";
    slot.draggable = Boolean(unit);
    applyLocalRect(slot, TEAM_SLOT_RECTS[index], 1125, 400);
    slot.dataset.lineupIndex = String(index);
    slot.addEventListener("pointerdown", (event) => {
      if (!unit || event.target.closest("button") || state.phase !== "shop") return;
      pointerDraggedLineupIndex = index;
      pointerMoved = false;
    });
    slot.addEventListener("dragstart", (event) => {
      if (!unit || event.target.closest("button")) return;
      draggedLineupIndex = index;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `lineup:${index}`);
    });
    slot.addEventListener("dragend", () => {
      draggedLineupIndex = null;
      clearLineupDropState();
    });
    slot.addEventListener("dragover", (event) => {
      if (draggedShopIndex === null && draggedLineupIndex === null) return;
      event.preventDefault();
      const canDropShop = draggedShopIndex !== null && state.lineup[index] === null;
      const canSwapLineup = draggedLineupIndex !== null && draggedLineupIndex !== index;
      slot.classList.toggle("drop-target", canDropShop || canSwapLineup);
      slot.classList.toggle("drop-blocked", draggedShopIndex !== null && state.lineup[index] !== null);
    });
    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drop-target", "drop-blocked");
    });
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("drop-target", "drop-blocked");
      if (draggedLineupIndex !== null && draggedLineupIndex !== index) {
        swapLineupUnits(draggedLineupIndex, index);
        draggedLineupIndex = null;
        return;
      }
      const rawIndex = event.dataTransfer.getData("text/plain");
      const shopIndex = Number.parseInt(rawIndex, 10);
      if (Number.isInteger(shopIndex)) buyHeroToLineup(shopIndex, index);
      draggedShopIndex = null;
    });

    const header = document.createElement("div");
    header.className = "slot-index";
    header.innerHTML = `<span>${index + 1} 号位</span><span class="slot-type">上阵</span>`;

    const body = document.createElement("div");
    body.className = "slot-body";
    if (unit) {
      body.innerHTML = createHeroCardMarkup(unit, { lineupIndex: index });
    } else {
      body.innerHTML = `<div class="card-name">空阵位</div><div class="card-meta">可接收购买的武将</div>`;
    }

    const actions = document.createElement("div");
    actions.className = "slot-actions";
    if (unit) actions.append(createButton("出售", () => sellUnit(index), "small-button"));

    slot.append(header, body, actions);
    elements.lineupGrid.append(slot);
  });
}

function createButton(text, onClick, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

function renderLogs() {
  if (!elements.logList) return;
  elements.logList.replaceChildren();
  state.logs.forEach((message) => {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = message;
    elements.logList.append(entry);
  });
}

function renderFlow() {
  if (!elements.flowShop || !elements.flowBattle || !elements.flowNext) return;
  elements.flowShop.classList.toggle("active", state.phase === "shop");
  elements.flowBattle.classList.toggle("active", state.phase === "battle");
  elements.flowNext.classList.toggle("active", false);
}

function renderBonds() {
  const counts = getBondCounts();
  elements.bondList.replaceChildren();

  Object.values(BOND_RULES).forEach((bond) => {
    const count = counts[bond.name] ?? 0;
    const level = getBondLevel(count);
    const effectText =
      level > 0 ? bond.effects[level] : "2名武将开启羁绊，每增加1名，羁绊等级+1";
    const item = document.createElement("article");
    item.className = `bond-card bond-${bond.name} bond-level-${level} ${level > 0 ? "active" : ""} ${getFactionClass(bond.name)}`;
    item.innerHTML = `
      <div class="bond-header">
        <strong>${bond.label}</strong>
      </div>
      <div class="bond-detail">
        <div class="bond-effect">${effectText}</div>
      </div>
      <div class="bond-progress">
        <strong>${count}/5</strong>
        <span>${getBondLevelText(level)}</span>
      </div>
    `;
    elements.bondList.append(item);
  });

}

function render() {
  elements.roundText.textContent = state.round;
  elements.phaseText.textContent = state.phase === "shop" ? "商店" : "战斗";
  elements.tierText.textContent = "固定";
  elements.goldText.textContent = state.gold;
  elements.lifeText.textContent = state.life;
  elements.trophyText.textContent = `${state.trophies} / 10`;
  elements.refreshButton.disabled = state.phase !== "shop" || state.gold < REFRESH_COST;
  elements.endTurnButton.disabled = state.phase !== "shop";
  renderFlow();
  renderBonds();
  renderShop();
  renderLineup();
  renderLogs();
}

elements.refreshButton.addEventListener("click", () => refreshShop());
elements.endTurnButton.addEventListener("click", endTurn);
elements.resetButton.addEventListener("click", resetDemo);
document.addEventListener("pointermove", (event) => {
  if (pointerDraggedShopIndex === null && pointerDraggedLineupIndex === null) return;
  pointerMoved = true;
  if (pointerDraggedShopIndex !== null) {
    markLineupDropTarget(event.clientX, event.clientY);
    return;
  }
  markLineupSwapTarget(event.clientX, event.clientY, pointerDraggedLineupIndex);
});
document.addEventListener("pointerup", (event) => {
  if (pointerDraggedShopIndex === null && pointerDraggedLineupIndex === null) return;
  clearLineupDropState();
  if (pointerDraggedLineupIndex !== null) {
    const sourceIndex = pointerDraggedLineupIndex;
    pointerDraggedLineupIndex = null;
    if (!pointerMoved) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".lineup-slot");
    const targetIndex = Number.parseInt(target?.dataset.lineupIndex ?? "", 10);
    if (Number.isInteger(targetIndex)) swapLineupUnits(sourceIndex, targetIndex);
    return;
  }
  const shopIndex = pointerDraggedShopIndex;
  pointerDraggedShopIndex = null;
  if (!pointerMoved) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".lineup-slot");
  const lineupIndex = Number.parseInt(target?.dataset.lineupIndex ?? "", 10);
  if (Number.isInteger(lineupIndex)) buyHeroToLineup(shopIndex, lineupIndex);
});

refreshShop({ free: true });
