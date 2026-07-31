const SCREEN_DESIGN_WIDTH = 1920;
const SCREEN_DESIGN_HEIGHT = 1080;
let screenScaleAnimationFrame = 0;

function getVisibleViewportBounds() {
  const visualViewport = window.visualViewport;
  const width = visualViewport?.width || document.documentElement.clientWidth || window.innerWidth;
  const height = visualViewport?.height || document.documentElement.clientHeight || window.innerHeight;
  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
    left: visualViewport?.offsetLeft || 0,
    top: visualViewport?.offsetTop || 0,
  };
}

function syncScreenScale() {
  const viewport = getVisibleViewportBounds();
  const scale = Math.min(
    viewport.width / SCREEN_DESIGN_WIDTH,
    viewport.height / SCREEN_DESIGN_HEIGHT,
  );
  const normalizedScale = Math.max(0.05, Number(scale.toFixed(6)));
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--screen-scale", String(normalizedScale));
  rootStyle.setProperty("--screen-center-x", `${viewport.left + viewport.width / 2}px`);
  rootStyle.setProperty("--screen-center-y", `${viewport.top + viewport.height / 2}px`);
  document.documentElement.dataset.screenScale = String(normalizedScale);
}

function requestScreenScaleSync() {
  if (screenScaleAnimationFrame) return;
  screenScaleAnimationFrame = window.requestAnimationFrame(() => {
    screenScaleAnimationFrame = 0;
    syncScreenScale();
  });
}

syncScreenScale();
window.addEventListener("resize", requestScreenScaleSync, { passive: true });
window.addEventListener("orientationchange", requestScreenScaleSync, { passive: true });
window.addEventListener("pageshow", requestScreenScaleSync, { passive: true });
document.addEventListener("fullscreenchange", requestScreenScaleSync);
window.visualViewport?.addEventListener("resize", requestScreenScaleSync, { passive: true });
window.visualViewport?.addEventListener("scroll", requestScreenScaleSync, { passive: true });

const LINEUP_SLOT_COUNT = 5;
const LINEUP_INSERT_EDGE_RATIO = 0.32;
const LINEUP_DRAG_DIRECTION_THRESHOLD = 8;
const TURN_GOLD = 10;
const GOLD_CAP = 100;
const REFRESH_COST = 1;
const HERO_COST = 3;
const ITEM_COST = 2;
const STRATAGEM_COST = 3;
const MAX_UNIT_BONDS = 2;
const MAX_UNIT_LEVEL = 3;
const MAX_EFFECT_CHAIN_STEPS = 500;
const PLAYER_DATA_TEST_MAX_ROUND = 20;
const PLAYER_STARTING_LIFE = 5;
const PLAYER_MAX_LIFE = 5;
const ROUND_THREE_LIFE_RECOVERY_ROUND = 3;
const ROUND_THREE_LIFE_RECOVERY = 1;
const FLAG_VICTORY_TARGET = 10;
const PLAYER_DATA_TEST_ENEMY_COUNT = 5;
const PLAYER_DATA_TEST_ENEMY_STAT_MULTIPLIER = 2.5;
const PLAYER_DATA_TEST_STORAGE_KEY = "bond-system.player-lineup-test.v1";
const OPPONENT_POOL_WINDOW_SIZE = 10;
const OPPONENT_POOL_MAX_PER_WINDOW = 3;
const OPPONENT_POOL_MIN_SIZE = Math.ceil(
  OPPONENT_POOL_WINDOW_SIZE / OPPONENT_POOL_MAX_PER_WINDOW,
);
const BONUS_ANIMATION_DURATION = 900;
const BONUS_ANIMATION_STAGGER = 120;
const UPGRADE_ANIMATION_DURATION = 1050;
const UPGRADE_ANIMATION_STAGGER = 160;
const BOND_UPGRADE_ANIMATION_DURATION = 1450;
const UNIT_LEVEL_COPY_THRESHOLDS = {
  1: 1,
  2: 3,
  3: 6,
};
const BOND_FACTIONS = ["魏", "蜀", "吴", "群"];
const NEGATIVE_STATUS_POOL = ["burn", "intimidated", "counterplot"];
const STATUS_LABELS = {
  burn: "灼烧",
  intimidated: "震慑",
  counterplot: "反间",
  unparalleled: "无双",
  rest: "休整",
  "skill-disabled": "技能禁用",
};
const STATUS_PRESENTATION_ORDER = [
  "burn",
  "intimidated",
  "counterplot",
  "unparalleled",
  "rest",
  "skill-disabled",
];
const EVENT_DISPLAY_NAMES = {
  "battle:start": "战斗开始",
  "battle:start:end": "战斗开始阶段结束",
  "attack:before": "攻击前",
  "damage:before": "伤害结算前",
  "damage:after": "造成伤害后",
  "attack:after": "攻击后",
  "battle:end": "战斗结束",
  "round:start": "回合开始",
  "round:end": "回合结束",
  "card:purchase": "购买",
  "unit:recruit": "招募",
  "unit:summon": "召唤",
  "unit:sell": "出售",
  "experience:gain": "获得经验",
  "unit:upgrade": "武将升级",
  "unit:death": "武将阵亡",
  "unit:revive": "武将复活",
  "status:apply": "获得状态",
  "bond:level-change": "羁绊等级变化",
};
const GLOBAL_STATUS_EFFECT_LABELS = {
  "status.burn-tick": STATUS_LABELS.burn,
  "status.rest-recovery": STATUS_LABELS.rest,
  "status.intimidated-damage": STATUS_LABELS.intimidated,
  "status.unparalleled-cleave": STATUS_LABELS.unparalleled,
  "status.counterplot-revive": STATUS_LABELS.counterplot,
};
const GLOBAL_STATUS_EFFECT_IDS = Object.keys(GLOBAL_STATUS_EFFECT_LABELS);
const BOND_VISUAL_COLORS = {
  魏: "#69c8ff",
  蜀: "#72ff9e",
  吴: "#ff745e",
  群: "#ffd65c",
};
const BATTLE_ANIMATION_SPEEDS = [1, 2, 3, 5];

const SHOP_PROGRESSION = [
  { maxRound: 2, tier: 1, heroSlots: 3, itemSlots: 1 },
  { maxRound: 4, tier: 2, heroSlots: 3, itemSlots: 1 },
  { maxRound: 6, tier: 3, heroSlots: 4, itemSlots: 2 },
  { maxRound: 8, tier: 4, heroSlots: 4, itemSlots: 2 },
  { maxRound: 10, tier: 5, heroSlots: 5, itemSlots: 2 },
  { maxRound: Number.POSITIVE_INFINITY, tier: 6, heroSlots: 5, itemSlots: 2 },
];
const SHOP_POSITION_COUNT = 9;
// 槽位底图的笔触并非等距，以下坐标按 1920 × 1080 设计坐标逐格对齐。
const SHOP_POSITION_X = [-757, -563, -369, -176, 18, 212, 405, 599, 792];
const SHOP_OVERFLOW_SLOT_INDICES = [5, 6];

const TEAM_SLOT_RECTS = [
  { x: -430, y: -22, w: 160, h: 231 },
  { x: -214, y: -22, w: 160, h: 231 },
  { x: -2, y: -22, w: 160, h: 231 },
  { x: 211, y: -22, w: 160, h: 231 },
  { x: 425, y: -22, w: 160, h: 231 },
];

const HERO_IMAGE_BY_NAME = {
  甄姬: "hero_icon/hero_zhenji.png",
  庞德: "hero_icon/hero_pangde.png",
  马岱: "hero_icon/hero_madai.png",
  廖化: "hero_icon/hero_liaohua.png",
  马云禄: "hero_icon/hero_mayunlu.png",
  诸葛瑾: "hero_icon/hero_zhugejin.png",
  韩当: "hero_icon/hero_handang.png",
  华雄: "hero_icon/hero_huaxiong.png",
  陈宫: "hero_icon/hero_chengong.png",
  左慈: "hero_icon/hero_zuoci.png",
  夏侯渊: "hero_icon/hero_xiahouyuan.png",
  于禁: "hero_icon/hero_yujin.png",
  魏延: "hero_icon/hero_weiyan.png",
  黄忠: "hero_icon/hero_huangzhong.png",
  程普: "hero_icon/hero_chengpu.png",
  小乔: "hero_icon/hero_xiaoqiao.png",
  黄盖: "hero_icon/hero_huanggai.png",
  颜良: "hero_icon/hero_yanliang.png",
  汉献帝: "hero_icon/hero_hanxiandi.png",
  貂蝉: "hero_icon/hero_diaochan.png",
  夏侯惇: "hero_icon/hero_xiahoudun.png",
  乐进: "hero_icon/hero_yuejin.png",
  徐晃: "hero_icon/hero_xuhuang.png",
  张飞: "hero_icon/hero_zhangfei.png",
  徐庶: "hero_icon/hero_xushu.png",
  太史慈: "hero_icon/hero_taishici.png",
  周泰: "hero_icon/hero_zhoutai.png",
  鲁肃: "hero_icon/hero_lusu.png",
  文丑: "hero_icon/hero_wenchou.png",
  于吉: "hero_icon/hero_yuji.png",
  荀攸: "hero_icon/hero_xunyou.png",
  典韦: "hero_icon/hero_dianwei.png",
  赵云: "hero_icon/hero_zhaoyun.png",
  法正: "hero_icon/hero_fazheng.png",
  孙策: "hero_icon/hero_sunce.png",
  凌统: "hero_icon/hero_lingtong.png",
  吕蒙: "hero_icon/hero_lvmeng.png",
  公孙瓒: "hero_icon/hero_gongsunzan.png",
  张郃: "hero_icon/hero_zhanghe.png",
  司马徽: "hero_icon/hero_simahui.png",
  贾诩: "hero_icon/hero_jiaxu.png",
  郭嘉: "hero_icon/hero_guojia.png",
  张辽: "hero_icon/hero_zhangliao.png",
  马超: "hero_icon/hero_machao.png",
  庞统: "hero_icon/hero_pangtong.png",
  陆逊: "hero_icon/hero_luxun.png",
  甘宁: "hero_icon/hero_ganning.png",
  袁术: "hero_icon/hero_yuanshu.png",
  董卓: "hero_icon/hero_dongzhuo.png",
  华佗: "hero_icon/hero_huatuo.png",
  曹操: "hero_icon/hero_caocao.png",
  荀彧: "hero_icon/hero_xunyu.png",
  刘备: "hero_icon/hero_liubei.png",
  诸葛亮: "hero_icon/hero_zhugeliang.png",
  关羽: "hero_icon/hero_guanyu.png",
  孙权: "hero_icon/hero_sunquan.png",
  周瑜: "hero_icon/hero_zhouyu.png",
  张角: "hero_icon/hero_zhangjiao.png",
  吕布: "hero_icon/hero_lvbu.png",
  袁绍: "hero_icon/hero_yuanshao.png",
  骑兵: "hero_icon/hero_qibing.png",
  重骑兵: "hero_icon/hero_zhongqibing.png",
};

const BOND_RULES = {
  魏: {
    name: "魏",
    label: "魏武遗风",
    effectIds: ["bond.wei-death"],
    effects: {
      1: "每阵亡4名魏将，在己方最前方召唤1名骑兵。",
      2: "每阵亡4名魏将，在己方最前方召唤2名骑兵。",
      3: "每阵亡4名魏将，在己方最前方召唤1名重骑兵。",
      4: "每阵亡4名魏将，在己方最前方召唤2名重骑兵。",
    },
  },
  蜀: {
    name: "蜀",
    label: "蜀汉再兴",
    effectIds: ["bond.shu-upgrade"],
    effects: {
      1: "蜀将升级时，自身获得 +1/+1。",
      2: "蜀将升级时，自身获得 +2/+2。",
      3: "蜀将升级时，使全军 +1/+1。",
      4: "蜀将升级时，使全军 +2/+2。",
    },
  },
  吴: {
    name: "吴",
    label: "东吴业火",
    effectIds: ["bond.wu-battle-start"],
    effects: {
      1: "战斗开始时，使随机2名敌军获得灼烧。",
      2: "战斗开始时，使最后3名敌军获得灼烧。",
      3: "战斗开始时，使最后4名敌军获得灼烧；引燃伤害 +2。",
      4: "战斗开始时，使敌军全体灼烧；引燃伤害 +2；引燃不清除灼烧。",
    },
  },
  群: {
    name: "群",
    label: "群雄并起",
    effectIds: ["bond.group-start-damage"],
    effects: {
      1: "战斗开始阶段，我方造成的任意伤害 +1。",
      2: "战斗开始阶段，我方造成的任意伤害 +2。",
      3: "战斗开始阶段，我方造成的任意伤害 +3。",
      4: "战斗开始阶段，我方造成的任意伤害 +4。",
    },
  },
};

function defineHeroEffect(trigger, target, data = {}, conditions = {}) {
  const triggers = Array.isArray(trigger) ? trigger : null;
  return {
    sourceType: "hero",
    ...(triggers ? { triggers } : { trigger }),
    target,
    priority: 0,
    conditions,
    operations: [{ type: "resolve-hero-skill", ...data }],
  };
}

const HERO_EFFECT_DEFINITIONS = {
  "hero.zhenji.luoshen": defineHeroEffect("unit:summon", "summoned-ally"),
  "hero.pangde.xunjie": defineHeroEffect("unit:death", "nearest-ally-behind"),
  "hero.madai.fuzhan": defineHeroEffect("unit:death", "owner-on-kill"),
  "hero.liaohua.sujiang": defineHeroEffect("experience:gain", "experienced-ally"),
  "hero.mayunlu.xiliang-lienv": defineHeroEffect("battle:start", "owner"),
  "hero.zhugejin.hongya": defineHeroEffect("status:apply", "random-other-ally"),
  "hero.handang.yonglie": defineHeroEffect("attack:after", "random-enemy"),
  "hero.huaxiong.xiaoyong": defineHeroEffect("battle:start", "front-enemies"),
  "hero.chengong.baiji-duomou": defineHeroEffect("unit:recruit", "random-ally"),
  "hero.zuoci.bianhuan-moce": defineHeroEffect("unit:sell", "adjacent-allies"),
  "hero.xiahouyuan.qianli-benxi": defineHeroEffect("attack:after", "ahead-of-owner"),
  "hero.yujin.junji-yanming": defineHeroEffect("round:end", "nearest-allies-ahead"),
  "hero.weiyan.caigao-qilie": defineHeroEffect("experience:gain", "owner"),
  "hero.huangzhong.laodang-yizhuang": defineHeroEffect("round:end", "owner"),
  "hero.chengpu.yuanxun": defineHeroEffect("unit:recruit", "nearest-ally-ahead"),
  "hero.xiaoqiao.huaron-yuemao": defineHeroEffect("attack:after", "nearest-ally-ahead"),
  "hero.huanggai.kurouji": defineHeroEffect("damage:after", "random-enemies"),
  "hero.yanliang.yongguan-sanjun": defineHeroEffect("unit:recruit", "owner"),
  "hero.hanxiandi.piaoyao": defineHeroEffect("bond:level-change", "random-other-ally"),
  "hero.diaochan.qingcheng": defineHeroEffect("round:end", "owner"),
  "hero.xiahoudun.gangyong": defineHeroEffect("damage:after", "random-other-shared-bond-allies"),
  "hero.yuejin.xiandeng-xianzhen": defineHeroEffect("attack:before", "ahead-of-owner"),
  "hero.xuhuang.changqu-zhiru": defineHeroEffect("battle:start", "last-enemy"),
  "hero.zhangfei.yanren-paoxiao": defineHeroEffect("attack:before", "attack-target"),
  "hero.xushu.jiancai": defineHeroEffect("battle:start", "nearest-ally-ahead"),
  "hero.taishici.jianwu-xufa": defineHeroEffect("battle:start", "highest-health-enemy"),
  "hero.zhoutai.roushen-tiebi": defineHeroEffect("damage:before", "owner"),
  "hero.lusu.lianhe": defineHeroEffect("round:start", "player"),
  "hero.wenchou.hanyong": defineHeroEffect("damage:after", "owner"),
  "hero.yuji.guhuo": defineHeroEffect("bond:level-change", "nearest-ally-ahead"),
  "hero.xunyou.qice": defineHeroEffect("unit:summon", "summoned-shared-bond-ally"),
  "hero.dianwei.guzhi-elai": defineHeroEffect(
    ["battle:start", "unit:death"],
    "consumed-unit-death-position",
  ),
  "hero.zhaoyun.longdan": defineHeroEffect("unit:upgrade", "owner"),
  "hero.fazheng.yiyi-dailao": defineHeroEffect("unit:upgrade", "upgraded-ally"),
  "hero.sunce.jiangdong-bawang": defineHeroEffect("battle:start", "owner"),
  "hero.lingtong.guoshi-zhifeng": defineHeroEffect("unit:recruit", "recruited-ally"),
  "hero.lvmeng.baiyi-dujiang": defineHeroEffect("attack:before", "front-enemies"),
  "hero.gongsunzan.baima-yicong": defineHeroEffect("battle:start", "front-enemies"),
  "hero.zhanghe.qiaobian": defineHeroEffect("bond:level-change", "owner"),
  "hero.simahui.guangshi": defineHeroEffect("card:purchase", "selected-ally-and-bond"),
  "hero.jiaxu.fanjian": defineHeroEffect("battle:start", "random-enemies"),
  "hero.guojia.yiji-pingliao": defineHeroEffect("unit:death", "all-shared-bond-allies"),
  "hero.zhangliao.weizhen-xiaoyao": defineHeroEffect("battle:start", "front-enemies"),
  "hero.machao.hanqiang-pozhen": defineHeroEffect("experience:gain", "owner-and-random-enemy"),
  "hero.pangtong.niepan": defineHeroEffect("unit:death", "random-other-allies"),
  "hero.luxun.huoshao-lianying": defineHeroEffect("attack:after", "random-enemy"),
  "hero.ganning.baiqi-jieying": defineHeroEffect("battle:start", "last-enemies"),
  "hero.yuanshu.yuxi": defineHeroEffect("unit:recruit", "owner"),
  "hero.dongzhuo.baonue": defineHeroEffect("round:end", "random-nonbond-ally"),
  "hero.huatuo.jijiu": defineHeroEffect("unit:death", "ahead-of-dead-target"),
  "hero.caocao.jianxiong": defineHeroEffect("unit:death", "random-other-ally"),
  "hero.xunyu.wangzuo-zhicai": defineHeroEffect("unit:summon", "summoned-shared-bond-ally"),
  "hero.liubei.renze": defineHeroEffect("round:end", "nearest-shared-bond-ally-ahead"),
  "hero.zhugeliang.yunchou": defineHeroEffect("attack:after", "random-other-allies"),
  "hero.guanyu.weizhen-huaxia": defineHeroEffect("attack:after", "front-enemies"),
  "hero.sunquan.quanheng": defineHeroEffect("round:end", "nearest-shared-bond-allies"),
  "hero.zhouyu.fengzhu-huoshi": defineHeroEffect("damage:before", "enemy-burn-damage"),
  "hero.zhangjiao.wulei-hongding": defineHeroEffect("battle:start", "random-enemy"),
  "hero.lvbu.tianxia-wushuang": defineHeroEffect("attack:before", "owner"),
  "hero.yuanshao.haoling-qunxiong": defineHeroEffect("unit:recruit", "all-allies"),
};

const EFFECT_DEFINITIONS = {
  ...HERO_EFFECT_DEFINITIONS,
  "stratagem.encourage": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [{ type: "modify-body-stats", attack: 1, health: 1 }],
  },
  "stratagem.temporary-bond": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit-and-bond",
    priority: 0,
    operations: [{ type: "add-extra-bond", temporary: true }],
  },
  "stratagem.recommend-talent": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "random-unit-in-highest-bond",
    priority: 0,
    operations: [
      { type: "buff-random-highest-bond", count: 1, attack: 2, health: 1 },
    ],
  },
  "stratagem.advance-together": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "random-units-in-highest-bond",
    priority: 0,
    operations: [
      { type: "buff-random-highest-bond", count: 2, attack: 1, health: 1 },
    ],
  },
  "stratagem.hidden-potential": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "all-units-in-inactive-bonds",
    priority: 0,
    operations: [{ type: "buff-inactive-bonds", attack: 1, health: 1 }],
  },
  "stratagem.train-army": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "shop-units-in-selected-bond",
    priority: 0,
    operations: [{ type: "buff-shop-selected-bond", attack: 2, health: 2 }],
  },
  "stratagem.blood-oath": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [
      {
        type: "first-use-extra-bond-then-stats",
        attack: 3,
        health: 3,
      },
    ],
  },
  "stratagem.united-force": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "all-units-in-highest-bond",
    priority: 0,
    operations: [{ type: "buff-all-highest-bond", attack: 1, health: 2 }],
  },
  "stratagem.master-guidance": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [{ type: "grant-experience", amount: 1 }],
  },
  "stratagem.gather-strength": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [
      {
        type: "scaling-body-stats",
        baseAttack: 4,
        baseHealth: 4,
        attackPerPriorUse: 1,
        healthPerPriorUse: 1,
      },
    ],
  },
  "equipment.iron-armor": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner",
    priority: 100,
    conditions: {
      damageTypes: ["attack", "skill"],
      targetIsOwner: true,
    },
    operations: [{ type: "modify-damage", amount: -2, minimum: 0 }],
  },
  "equipment.initiative-flag": {
    sourceType: "equipment",
    trigger: "battle:start",
    target: "owner",
    priority: 100,
    operations: [{ type: "announce-equipment-ready" }],
  },
  "equipment.cavalry-talisman": {
    sourceType: "equipment",
    trigger: "unit:death",
    target: "owner-side-front",
    priority: 0,
    conditions: {
      eventUnitIsOwner: true,
    },
    operations: [{ type: "summon-cavalry", count: 1, attack: 2, health: 1, position: "front" }],
  },
  "equipment.calamity-blade": {
    sourceType: "equipment",
    trigger: "attack:after",
    target: "enemy-front",
    priority: 0,
    conditions: {
      ownerIsAttacker: true,
    },
    operations: [{ type: "apply-random-negative-status" }],
  },
  "equipment.blood-armor": {
    sourceType: "equipment",
    triggers: ["status:apply", "damage:after"],
    target: "owner",
    priority: 0,
    operations: [{ type: "grow-when-hurt-or-debuffed", attack: 2, health: 2 }],
  },
  "equipment.imperial-jade-seal": {
    sourceType: "equipment",
    trigger: "unit:death",
    target: "shop-bond-units",
    priority: 0,
    conditions: {
      eventUnitIsOwner: true,
    },
    operations: [{ type: "resolve-imperial-jade-seal-death" }],
  },
  "equipment.black-tortoise-shield": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner",
    priority: 200,
    conditions: {
      damageTypes: ["attack", "skill"],
      targetIsOwner: true,
    },
    operations: [{ type: "block-damage-with-charges", amount: 10, charges: 2 }],
  },
  "equipment.siege-crossbow": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner-attack-damage",
    priority: 300,
    conditions: {
      damageTypes: ["attack"],
      sourceIsOwner: true,
    },
    operations: [{ type: "increase-damage-with-charges", amount: 20, charges: 1 }],
  },
  "bond.group-start-damage": {
    sourceType: "bond",
    trigger: "damage:before",
    target: "allied-damage",
    priority: 10,
    conditions: {
      phase: "battle:start",
      sourceSideIsOwnerSide: true,
    },
    operations: [{ type: "modify-damage-by-bond-level", faction: "群" }],
  },
  "bond.wei-death": {
    sourceType: "bond",
    trigger: "unit:death",
    target: "allied-death",
    priority: 10,
    operations: [{ type: "resolve-wei-death" }],
  },
  "bond.shu-upgrade": {
    sourceType: "bond",
    trigger: "unit:upgrade",
    target: "allied-upgrade",
    priority: 10,
    operations: [{ type: "resolve-shu-upgrade" }],
  },
  "bond.wu-battle-start": {
    sourceType: "bond",
    trigger: "battle:start",
    target: "enemy-team",
    priority: 10,
    operations: [{ type: "apply-wu-opening-burn" }],
  },
  "status.burn-tick": {
    sourceType: "status",
    trigger: "attack:after",
    target: "all-burned-units",
    priority: -100,
    operations: [{ type: "resolve-burn-tick" }],
  },
  "status.rest-recovery": {
    sourceType: "status",
    trigger: "attack:after",
    target: "resting-units",
    priority: -90,
    operations: [{ type: "resolve-rest-recovery" }],
  },
  "status.intimidated-damage": {
    sourceType: "status",
    trigger: "damage:before",
    target: "intimidated-source",
    priority: 50,
    operations: [{ type: "resolve-intimidated-damage" }],
  },
  "status.unparalleled-cleave": {
    sourceType: "status",
    trigger: "attack:after",
    target: "units-behind-attack-target",
    priority: -80,
    operations: [{ type: "resolve-unparalleled-cleave" }],
  },
  "status.counterplot-revive": {
    sourceType: "status",
    trigger: "unit:death",
    target: "counterplot-owner-side-front",
    priority: 20,
    operations: [{ type: "resolve-counterplot-revive" }],
  },
  "summon.heavy-cavalry-growth": {
    sourceType: "hero",
    trigger: "attack:before",
    target: "owner",
    priority: 0,
    conditions: {
      ownerIsAttacker: true,
    },
    operations: [{ type: "modify-battle-unit-stats", attack: 2, health: 2 }],
  },
};

const CARD_POOLS = {
  hero: window.GAME_DATA.heroes,
  stratagem: window.GAME_DATA.items,
};

const codexFilters = {
  type: "全部",
  tier: "全部",
  faction: "全部",
};

let state = createInitialState();
let toastTimer = 0;
let pointerDraggedShopIndex = null;
let pointerDraggedLineupIndex = null;
let pointerDraggedEquipmentIndex = null;
let pointerMoved = false;
let lineupDragDirection = 0;
let lineupDragDirectionAnchorX = null;
let dragPreviewElement = null;
let dragPreviewOrigin = null;
let queuedShopBonusAnimations = [];
let queuedShopUpgradeAnimations = [];
let shopPresentationTimer = 0;
let pendingEndTurnReportEntries = [];
let resolvingEndTurn = false;
const bondSelectionHintSources = new Map();
let previousRenderedBondLevels = null;
let queuedBondUpgradeCelebrations = [];
let bondUpgradeAnimationTimer = 0;
let battleAnimationTimer = 0;
let battleAnimationPlaybackSpeed = BATTLE_ANIMATION_SPEEDS[0];

const elements = {
  roundText: document.querySelector("#roundText"),
  phaseText: document.querySelector("#phaseText"),
  tierText: document.querySelector("#tierText"),
  shopTipText: document.querySelector("#shopTipText"),
  goldText: document.querySelector("#goldText"),
  lifeText: document.querySelector("#lifeText"),
  flagText: document.querySelector("#flagText"),
  refreshButton: document.querySelector("#refreshButton"),
  endTurnButton: document.querySelector("#endTurnButton"),
  codexButton: document.querySelector("#codexButton"),
  fullscreenButton: document.querySelector("#fullscreenButton"),
  codexOverlay: document.querySelector("#codexOverlay"),
  codexCloseButton: document.querySelector("#codexCloseButton"),
  codexTypeFilters: document.querySelector("#codexTypeFilters"),
  codexTierFilters: document.querySelector("#codexTierFilters"),
  codexFactionFilterGroup: document.querySelector("#codexFactionFilterGroup"),
  codexFactionFilters: document.querySelector("#codexFactionFilters"),
  codexCount: document.querySelector("#codexCount"),
  codexGrid: document.querySelector("#codexGrid"),
  shopGrid: document.querySelector("#shopGrid"),
  sellZone: document.querySelector("#sellZone"),
  lineupGrid: document.querySelector("#lineupGrid"),
  bondList: document.querySelector("#bondList"),
  logList: document.querySelector("#logList"),
  toast: document.querySelector("#toast"),
  flowShop: document.querySelector("#flowShop"),
  flowBattle: document.querySelector("#flowBattle"),
  flowNext: document.querySelector("#flowNext"),
  battleOverlay: document.querySelector("#battleOverlay"),
  battleTitle: document.querySelector("#battleTitle"),
  battleSummary: document.querySelector("#battleSummary"),
  battleTeams: document.querySelector("#battleTeams"),
  battleLog: document.querySelector("#battleLog"),
  battleAnimationTab: document.querySelector("#battleAnimationTab"),
  battleReportTab: document.querySelector("#battleReportTab"),
  battleAnimation: document.querySelector("#battleAnimation"),
  battleAnimationPhase: document.querySelector("#battleAnimationPhase"),
  battleAnimationProgress: document.querySelector("#battleAnimationProgress"),
  battleAnimationStage: document.querySelector("#battleAnimationStage"),
  battleAnimationEvents: document.querySelector("#battleAnimationEvents"),
  battleAnimationSpeed: document.querySelector("#battleAnimationSpeed"),
  battleAnimationSpeedValue: document.querySelector("#battleAnimationSpeedValue"),
  battleAnimationPrevious: document.querySelector("#battleAnimationPrevious"),
  battleAnimationPlay: document.querySelector("#battleAnimationPlay"),
  battleAnimationFastForward: document.querySelector("#battleAnimationFastForward"),
  battleAnimationNext: document.querySelector("#battleAnimationNext"),
  battleAnimationReplay: document.querySelector("#battleAnimationReplay"),
  battleAnimationSkip: document.querySelector("#battleAnimationSkip"),
  battleLineupPanel: document.querySelector("#battleLineupPanel"),
  battleLineupHint: document.querySelector("#battleLineupHint"),
  nextExchangeButton: document.querySelector("#nextExchangeButton"),
  continueButton: document.querySelector("#continueButton"),
  gameResultOverlay: document.querySelector("#gameResultOverlay"),
  gameResultDialog: document.querySelector("#gameResultDialog"),
  gameResultKicker: document.querySelector("#gameResultKicker"),
  gameResultTitle: document.querySelector("#gameResultTitle"),
  gameResultMessage: document.querySelector("#gameResultMessage"),
  gameResultSeal: document.querySelector("#gameResultSeal"),
  gameResultStats: document.querySelector("#gameResultStats"),
  gameResultLineup: document.querySelector("#gameResultLineup"),
  gameResultBondSummary: document.querySelector("#gameResultBondSummary"),
  gameResultRestartButton: document.querySelector("#gameResultRestartButton"),
  rewardOverlay: document.querySelector("#rewardOverlay"),
  rewardTitle: document.querySelector("#rewardTitle"),
  rewardOptions: document.querySelector("#rewardOptions"),
  rewardSkipButton: document.querySelector("#rewardSkipButton"),
  stratagemChoiceOverlay: document.querySelector("#stratagemChoiceOverlay"),
  stratagemChoiceTitle: document.querySelector("#stratagemChoiceTitle"),
  stratagemChoiceDescription: document.querySelector("#stratagemChoiceDescription"),
  stratagemChoiceOptions: document.querySelector("#stratagemChoiceOptions"),
  stratagemChoiceCancelButton: document.querySelector("#stratagemChoiceCancelButton"),
};

function isPageFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function updateFullscreenButton() {
  const button = elements.fullscreenButton;
  if (!button) return;
  const isFullscreen = isPageFullscreen();
  const label = isFullscreen ? "退出" : "全屏";
  const accessibleLabel = isFullscreen ? "退出全屏" : "进入全屏";
  button.setAttribute("aria-pressed", String(isFullscreen));
  button.setAttribute("aria-label", accessibleLabel);
  button.title = accessibleLabel;
  const labelElement = button.querySelector(".fullscreen-button-label");
  if (labelElement) labelElement.textContent = label;
}

async function togglePageFullscreen() {
  try {
    if (isPageFullscreen()) {
      const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      await exitFullscreen?.call(document);
    } else {
      const root = document.documentElement;
      const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
      if (!requestFullscreen) throw new Error("当前浏览器不支持网页全屏");
      await requestFullscreen.call(root);
    }
  } catch (error) {
    console.warn("切换全屏失败：", error);
  }
}

function hasCompleteOpponentRounds(session, roundCount = PLAYER_DATA_TEST_MAX_ROUND) {
  if (
    session?.schemaVersion !== 1 ||
    session?.status !== "completed" ||
    !Array.isArray(session.rounds)
  ) {
    return false;
  }
  const rounds = new Map(session.rounds.map((entry) => [entry?.round, entry]));
  return Array.from({ length: roundCount }, (_, index) => index + 1).every((round) => {
    const entry = rounds.get(round);
    return entry && Array.isArray(entry.lineup) && entry.lineup.length === LINEUP_SLOT_COUNT;
  });
}

function getOpponentDataPool() {
  const source = Array.isArray(window.OPPONENT_DATA_POOL) ? window.OPPONENT_DATA_POOL : [];
  const seenKeys = new Set();
  return source.reduce((pool, entry, index) => {
    const session = entry?.session;
    const key = String(entry?.key ?? session?.id ?? "");
    if (!key || seenKeys.has(key) || !hasCompleteOpponentRounds(session)) return pool;
    seenKeys.add(key);
    pool.push({
      key,
      label: entry?.label ?? `对手数据 ${index + 1}`,
      fileName: entry?.fileName ?? "",
      session,
    });
    return pool;
  }, []);
}

function createOpponentPoolSchedule(
  pool,
  { roundCount = PLAYER_DATA_TEST_MAX_ROUND, random = Math.random } = {},
) {
  if (!Array.isArray(pool) || pool.length < OPPONENT_POOL_MIN_SIZE) return [];

  const schedule = [];
  for (let round = 1; round <= roundCount; round += 1) {
    const recentEntries = schedule.slice(-(OPPONENT_POOL_WINDOW_SIZE - 1));
    const recentCounts = recentEntries.reduce((counts, entry) => {
      counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1);
      return counts;
    }, new Map());
    const previousKey = schedule.at(-1)?.key ?? null;
    const candidates = pool.filter(
      (entry) =>
        entry.key !== previousKey &&
        (recentCounts.get(entry.key) ?? 0) < OPPONENT_POOL_MAX_PER_WINDOW &&
        entry.session.rounds.some((snapshot) => snapshot.round === round),
    );
    if (candidates.length === 0) return [];

    const randomValue = Number(random());
    const normalizedRandom = Number.isFinite(randomValue)
      ? Math.min(1 - Number.EPSILON, Math.max(0, randomValue))
      : 0;
    const selected = candidates[Math.floor(normalizedRandom * candidates.length)];
    schedule.push({
      round,
      key: selected.key,
      label: selected.label,
      fileName: selected.fileName,
    });
  }
  return schedule;
}

function createInitialState() {
  const shopRule = getShopRule(1);
  const opponentPool = getOpponentDataPool();
  const opponentSchedule = createOpponentPoolSchedule(opponentPool);
  return {
    round: 1,
    phase: "shop",
    gold: TURN_GOLD,
    life: PLAYER_STARTING_LIFE,
    flags: 0,
    shop: Array.from({ length: shopRule.heroSlots + shopRule.itemSlots }, () => null),
    lineup: Array.from({ length: LINEUP_SLOT_COUNT }, () => null),
    logs: [`第 1 回合开始，获得 ${TURN_GOLD} 金币。`],
    serial: 1,
    battle: null,
    pendingRewards: [],
    pendingStratagemUse: null,
    pendingHeroBondChoice: null,
    stratagemUseCounts: {},
    heroBondDefinitions: {},
    shopBondBonuses: Object.fromEntries(
      BOND_FACTIONS.map((faction) => [faction, { attack: 0, health: 0 }]),
    ),
    effectEvents: [],
    gameOver: false,
    gameOutcome: null,
    battleRecord: { wins: 0, losses: 0, draws: 0 },
    playerDataTest: createPlayerDataTestSession({ opponentPool, opponentSchedule }),
    opponentPool,
    opponentSchedule,
  };
}

function getLifeAfterRoundStart(life, round) {
  return round === ROUND_THREE_LIFE_RECOVERY_ROUND
    ? Math.min(PLAYER_MAX_LIFE, life + ROUND_THREE_LIFE_RECOVERY)
    : life;
}

function applyBattleResultToGameState(gameState, result) {
  if (result === "win") {
    gameState.flags = Math.min(FLAG_VICTORY_TARGET, gameState.flags + 1);
    gameState.battleRecord.wins += 1;
  } else if (result === "loss") {
    gameState.life = Math.max(0, gameState.life - 1);
    gameState.battleRecord.losses += 1;
  } else {
    gameState.battleRecord.draws += 1;
  }
}

function getGameOutcome(life, flags) {
  return life <= 0 ? "defeat" : flags >= FLAG_VICTORY_TARGET ? "victory" : null;
}

function createPlayerDataTestSession({ opponentPool = [], opponentSchedule = [] } = {}) {
  const startedAt = new Date().toISOString();
  const fallbackId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    schemaVersion: 1,
    id: window.crypto?.randomUUID?.() ?? fallbackId,
    status: "in_progress",
    startedAt,
    completedAt: null,
    rules: {
      maxRound: PLAYER_DATA_TEST_MAX_ROUND,
      startingLife: PLAYER_STARTING_LIFE,
      maxLife: PLAYER_MAX_LIFE,
      roundThreeLifeRecovery: ROUND_THREE_LIFE_RECOVERY,
      flagVictoryTarget: FLAG_VICTORY_TARGET,
      enemy: {
        source: "opponent-data-pool",
        poolSize: opponentPool.length,
        noConsecutiveRepeat: true,
        windowSize: OPPONENT_POOL_WINDOW_SIZE,
        maxPerWindow: OPPONENT_POOL_MAX_PER_WINDOW,
        fallback: {
          name: "骑兵",
          count: PLAYER_DATA_TEST_ENEMY_COUNT,
          attackFormula: "round * 2.5",
          healthFormula: "round * 2.5",
        },
      },
    },
    opponentSchedule: opponentSchedule.map((entry) => ({ ...entry })),
    operations: [],
    rounds: [],
  };
}

function getStoredPlayerDataTests() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(PLAYER_DATA_TEST_STORAGE_KEY) ?? "{}");
    return {
      schemaVersion: 1,
      updatedAt: stored.updatedAt ?? null,
      sessions: Array.isArray(stored.sessions) ? stored.sessions : [],
    };
  } catch {
    return { schemaVersion: 1, updatedAt: null, sessions: [] };
  }
}

function persistPlayerDataTestSession() {
  const session = state.playerDataTest;
  if (!session) return false;
  try {
    const stored = getStoredPlayerDataTests();
    const existingIndex = stored.sessions.findIndex((entry) => entry.id === session.id);
    const snapshot = JSON.parse(JSON.stringify(session));
    if (existingIndex >= 0) {
      stored.sessions[existingIndex] = snapshot;
    } else {
      stored.sessions.push(snapshot);
    }
    stored.updatedAt = new Date().toISOString();
    window.localStorage.setItem(PLAYER_DATA_TEST_STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

function getPlayerDataTestUnitSnapshot(unit, slotIndex) {
  if (!unit) {
    return { slot: slotIndex + 1, empty: true };
  }
  const equipment = getUnitEquipment(unit);
  return {
    slot: slotIndex + 1,
    empty: false,
    id: unit.id,
    name: unit.name,
    tier: unit.tier,
    level: unit.level ?? 1,
    experience: unit.experience ?? 0,
    copies: getUnitCopies(unit),
    bonusExperience: unit.bonusExperience ?? 0,
    attack: unit.attack,
    health: unit.health,
    faction: unit.faction,
    extraFactions: [...(unit.extraFactions ?? [])],
    temporaryExtraFactions: [...(unit.tempExtraFactions ?? [])],
    effectiveBonds: getEffectiveUnitBonds(unit),
    skillEffectId: unit.effectId ?? unit.skillEffectIds?.[0] ?? null,
    equipment: equipment
      ? {
          name: equipment.name,
          tier: equipment.tier,
          effectId: equipment.effectId ?? null,
          remainingUses: equipment.remainingUses ?? null,
        }
      : null,
  };
}

function recordCurrentPlayerLineup() {
  const session = state.playerDataTest;
  if (!session || state.round > PLAYER_DATA_TEST_MAX_ROUND) return;
  const roundSnapshot = {
    round: state.round,
    recordedAt: new Date().toISOString(),
    lineup: state.lineup.map(getPlayerDataTestUnitSnapshot),
    bonds: getBondEntries().map((entry) => ({
      faction: entry.faction,
      count: entry.count,
      level: entry.level,
    })),
    operations: session.operations
      .filter((entry) => entry.round === state.round)
      .map((entry) => ({ ...entry })),
  };
  const existingIndex = session.rounds.findIndex((entry) => entry.round === state.round);
  if (existingIndex >= 0) {
    session.rounds[existingIndex] = roundSnapshot;
  } else {
    session.rounds.push(roundSnapshot);
    session.rounds.sort((left, right) => left.round - right.round);
  }
  persistPlayerDataTestSession();
}

function exportCompletedPlayerDataTest(session) {
  const blob = new Blob([`${JSON.stringify(session, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `player-lineup-test-${session.id}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function completePlayerDataTestSession() {
  const session = state.playerDataTest;
  if (
    !session ||
    session.status === "completed" ||
    state.round < PLAYER_DATA_TEST_MAX_ROUND
  ) {
    return false;
  }
  session.status = "completed";
  session.completedAt = new Date().toISOString();
  session.finalLife = state.life;
  session.finalFlags = state.flags;
  session.battleRecord = { ...state.battleRecord };
  persistPlayerDataTestSession();
  exportCompletedPlayerDataTest(session);
  return true;
}

function getShopRule(round) {
  return SHOP_PROGRESSION.find((rule) => round <= rule.maxRound) ?? SHOP_PROGRESSION.at(-1);
}

function getTier(round) {
  return getShopRule(round).tier;
}

function isRefreshSlot(index, round) {
  const rule = getShopRule(round);
  return index >= 0 && index < rule.heroSlots + rule.itemSlots;
}

function createCard(type) {
  const tier = getTier(state.round);
  const pool = CARD_POOLS[type].filter((card) => card.tier <= tier && !card.generatedOnly);
  const base = pool[Math.floor(Math.random() * pool.length)];
  return createCardFromBase(base, type);
}

function createCardFromBase(base, type) {
  const id = `${type}-${state.serial}`;
  state.serial += 1;
  const isHero = type === "hero";
  const baseAttack = isHero ? (base.baseAttack ?? base.attack) : null;
  const baseHealth = isHero ? (base.baseHealth ?? base.health) : null;
  const intrinsicBodyAttackBonus = isHero
    ? (base.intrinsicBodyAttackBonus ?? base.bodyAttackBonus ?? 0)
    : 0;
  const intrinsicBodyHealthBonus = isHero
    ? (base.intrinsicBodyHealthBonus ?? base.bodyHealthBonus ?? 0)
    : 0;
  const card = {
    ...base,
    id,
    type,
    isLocked: false,
    tier: base.tier ?? getTier(state.round),
    cost:
      base.cost ??
      (type === "hero"
        ? HERO_COST
        : base.category === "计策"
          ? STRATAGEM_COST
          : ITEM_COST),
    ...(isHero
      ? {
          baseAttack,
          baseHealth,
          intrinsicBodyAttackBonus,
          intrinsicBodyHealthBonus,
          shopBondAttackBonus: 0,
          shopBondHealthBonus: 0,
          bodyAttackBonus: intrinsicBodyAttackBonus,
          bodyHealthBonus: intrinsicBodyHealthBonus,
          attack: Math.min(50, baseAttack + intrinsicBodyAttackBonus),
          health: Math.min(50, baseHealth + intrinsicBodyHealthBonus),
        }
      : {}),
    image:
      base.image ??
      (type === "hero" ? HERO_IMAGE_BY_NAME[base.name] ?? "" : "res/item_icon/50100010.png"),
  };
  if (isHero) {
    const definition = getHeroBondDefinition(base.name);
    card.extraFactions = [...definition.extraFactions];
    card.tempExtraFactions = [...definition.tempExtraFactions];
    syncShopHeroCardBonuses(card);
  }
  return card;
}

function createHeroCardByFaction(faction) {
  const tier = getTier(state.round);
  const unlocked = CARD_POOLS.hero.filter((hero) => hero.tier <= tier);
  const candidates = unlocked.filter((hero) => getBaseUnitBonds(hero).includes(faction));
  const pool = candidates.length > 0 ? candidates : unlocked;
  const base = pool[Math.floor(Math.random() * pool.length)];
  return createCardFromBase(base, "hero");
}

function createUnitFromCard(card) {
  const baseAttack = card.baseAttack ?? card.attack - (card.bodyAttackBonus ?? 0);
  const baseHealth = card.baseHealth ?? card.health - (card.bodyHealthBonus ?? 0);
  const bodyAttack = Math.min(50, baseAttack + (card.bodyAttackBonus ?? 0));
  const bodyHealth = Math.min(50, baseHealth + (card.bodyHealthBonus ?? 0));
  return {
    id: card.id,
    name: card.name,
    faction: card.faction,
    tier: card.tier,
    attack: bodyAttack,
    health: bodyHealth,
    skill: card.skill,
    skillEffectIds: card.effectId ? [card.effectId] : [],
    image: card.image,
    baseAttack,
    baseHealth,
    bodyAttack,
    bodyHealth,
    directModifiers: {
      equipment: null,
      status: null,
      bond: null,
    },
    level: 1,
    experience: 0,
    copies: 1,
    bonusExperience: 0,
    statuses: {},
    extraFactions: [...(card.extraFactions ?? [])],
    tempExtraFactions: [...(card.tempExtraFactions ?? [])],
  };
}

function getUnitProgress(progressValue) {
  if (progressValue >= UNIT_LEVEL_COPY_THRESHOLDS[3]) {
    return { level: 3, experience: 0 };
  }
  if (progressValue >= UNIT_LEVEL_COPY_THRESHOLDS[2]) {
    return {
      level: 2,
      experience: progressValue - UNIT_LEVEL_COPY_THRESHOLDS[2],
    };
  }
  return {
    level: 1,
    experience: progressValue - UNIT_LEVEL_COPY_THRESHOLDS[1],
  };
}

function getExperienceNeeded(level) {
  if (level >= MAX_UNIT_LEVEL) return 0;
  return UNIT_LEVEL_COPY_THRESHOLDS[level + 1] - UNIT_LEVEL_COPY_THRESHOLDS[level];
}

function getUnitCopies(unit) {
  return unit?.copies ?? UNIT_LEVEL_COPY_THRESHOLDS[unit?.level ?? 1];
}

function getUnitProgressValue(unit) {
  return getUnitCopies(unit) + Math.max(0, unit?.bonusExperience ?? 0);
}

function getUnitStackGrowth(unit) {
  return Math.max(0, getUnitProgressValue(unit) - 1);
}

function cloneDirectModifier(modifier) {
  if (Array.isArray(modifier)) return modifier.map(cloneDirectModifier);
  if (!modifier || typeof modifier !== "object") return modifier ?? null;
  return Object.fromEntries(
    Object.entries(modifier).map(([key, value]) => [
      key,
      cloneDirectModifier(value),
    ]),
  );
}

function getUnitEquipment(unit) {
  return unit?.directModifiers?.equipment ?? null;
}

function createEquipmentFromCard(card) {
  return {
    id: card.id,
    name: card.name,
    category: card.category,
    tier: card.tier,
    skill: card.skill,
    effectId: card.effectId ?? null,
    image: card.image,
  };
}

function createGeneratedEquipment(effectId) {
  const definition = CARD_POOLS.stratagem.find((item) => item.effectId === effectId);
  if (!definition) return null;
  const equipment = createEquipmentFromCard({
    ...definition,
    id: `generated-equipment-${state.serial}`,
  });
  state.serial += 1;
  return equipment;
}

function getDirectStatTotals(unit) {
  const total = { attack: 0, health: 0 };
  const collect = (modifier) => {
    if (Array.isArray(modifier)) {
      modifier.forEach(collect);
      return;
    }
    if (!modifier || typeof modifier !== "object") return;
    total.attack += Number.isFinite(modifier.attack) ? modifier.attack : 0;
    total.health += Number.isFinite(modifier.health) ? modifier.health : 0;
  };
  Object.values(unit?.directModifiers ?? {}).forEach(collect);
  return total;
}

function ensureUnitBodyStats(unit) {
  const stackGrowth = getUnitStackGrowth(unit);
  const directStats = getDirectStatTotals(unit);
  if (!Number.isFinite(unit.baseAttack)) unit.baseAttack = unit.attack - stackGrowth - directStats.attack;
  if (!Number.isFinite(unit.baseHealth)) unit.baseHealth = unit.health - stackGrowth - directStats.health;
  if (!Number.isFinite(unit.bodyAttack)) {
    unit.bodyAttack = unit.attack - stackGrowth - directStats.attack;
  }
  if (!Number.isFinite(unit.bodyHealth)) {
    unit.bodyHealth = unit.health - stackGrowth - directStats.health;
  }
}

function syncUnitStats(unit) {
  ensureUnitBodyStats(unit);
  const stackGrowth = getUnitStackGrowth(unit);
  const directStats = getDirectStatTotals(unit);
  unit.attack = Math.min(50, Math.max(1, unit.bodyAttack + stackGrowth + directStats.attack));
  unit.health = Math.min(50, unit.bodyHealth + stackGrowth + directStats.health);
}

function addUnitBodyStats(unit, attack, health) {
  ensureUnitBodyStats(unit);
  unit.bodyAttack += attack;
  unit.bodyHealth += health;
  syncUnitStats(unit);
}

function formatBonusText(attack, health) {
  if (attack > 0 && health > 0) return `+${attack}/${health}`;
  if (attack > 0) return `+${attack} 攻击`;
  if (health > 0) return `+${health} 生命`;
  return "";
}

function queueShopBonusAnimation(unit, attack, health, sourceName = "") {
  const text = formatBonusText(attack, health);
  if (!unit?.id || !text) return false;
  queuedShopBonusAnimations.push({
    unitId: unit.id,
    text,
    sourceName,
  });
  return true;
}

function queueShopUpgradeAnimation(unit, level, sourceName = "") {
  if (!unit?.id || !Number.isInteger(level)) return false;
  queuedShopUpgradeAnimations.push({
    unitId: unit.id,
    unitName: unit.name,
    level,
    sourceName,
  });
  return true;
}

function applyShopUnitStatBonus(unit, attack, health, sourceName = "") {
  addUnitBodyStats(unit, attack, health);
  return queueShopBonusAnimation(unit, attack, health, sourceName);
}

function revealDeferredUpgradeReward() {
  if (state.phase !== "shop") return;
  const reward = state.pendingRewards.find(
    (entry) =>
      entry.ready === false &&
      (entry.availableRound ?? state.round) <= state.round,
  );
  if (!reward) return;
  reward.ready = true;
  renderRewardChoice();
}

function finishShopPresentationSequence() {
  if (shopPresentationTimer) return;
  if (queuedShopUpgradeAnimations.length > 0 || queuedShopBonusAnimations.length > 0) {
    playQueuedShopPresentations();
    return;
  }
  if (resolvingEndTurn && state.phase === "end-turn") {
    resolvingEndTurn = false;
    state.phase = "battle";
    state.gold = 0;
    state.battle = simulateBasicBattle({
      preBattleEntries: pendingEndTurnReportEntries,
    });
    pendingEndTurnReportEntries = [];
    applyBattleResultToGameState(state, state.battle.result);
    addLog(
      state.battle.result === "win"
        ? "战斗胜利，旗帜 +1。"
        : state.battle.result === "loss"
          ? "战斗失败，生命 -1。"
          : "战斗平局，生命与旗帜不变。",
    );
    const playerDataComplete = completePlayerDataTestSession();
    state.gameOutcome = getGameOutcome(state.life, state.flags);
    // 终局只在玩家看完最后一场战斗并主动点击“游戏结算”后展示。
    state.gameOver = false;
    if (playerDataComplete) {
      addLog("第 20 回合数据记录完成，已保存并导出玩家阵容测试数据。");
      persistPlayerDataTestSession();
    }
    render();
    return;
  }
  revealDeferredUpgradeReward();
}

function playQueuedShopPresentations() {
  if (shopPresentationTimer) return;
  if (queuedShopUpgradeAnimations.length > 0) {
    const animations = queuedShopUpgradeAnimations.splice(0);
    animations.forEach((animation, index) => {
      const targetSlot = Array.from(elements.lineupGrid.querySelectorAll(".lineup-slot")).find(
        (slot) => slot.dataset.unitId === animation.unitId,
      );
      const target = targetSlot?.querySelector(".hero-card");
      if (!target) return;

      target.classList.add("unit-upgrade-active");
      const label = document.createElement("span");
      label.className = "unit-upgrade-float";
      label.textContent = `升级 · LV${animation.level}`;
      label.title = animation.sourceName;
      label.style.setProperty("--upgrade-delay", `${index * UPGRADE_ANIMATION_STAGGER}ms`);
      target.append(label);
    });

    const totalDuration =
      UPGRADE_ANIMATION_DURATION +
      Math.max(0, animations.length - 1) * UPGRADE_ANIMATION_STAGGER;
    shopPresentationTimer = window.setTimeout(() => {
      elements.lineupGrid
        ?.querySelectorAll(".unit-upgrade-float")
        .forEach((label) => label.remove());
      elements.lineupGrid
        ?.querySelectorAll(".unit-upgrade-active")
        .forEach((card) => card.classList.remove("unit-upgrade-active"));
      shopPresentationTimer = 0;
      playQueuedShopPresentations();
    }, totalDuration);
    return;
  }

  if (queuedShopBonusAnimations.length === 0) {
    window.setTimeout(finishShopPresentationSequence, 0);
    return;
  }
  const animations = queuedShopBonusAnimations.splice(0);

  animations.forEach((animation, index) => {
    const targetSlot = Array.from(elements.lineupGrid.querySelectorAll(".lineup-slot")).find(
      (slot) => slot.dataset.unitId === animation.unitId,
    );
    const target = targetSlot?.querySelector(".hero-card");
    if (!target) return;

    const label = document.createElement("span");
    label.className = "bonus-float";
    label.textContent = animation.text;
    label.title = animation.sourceName;
    label.style.setProperty("--bonus-delay", `${index * BONUS_ANIMATION_STAGGER}ms`);
    target.append(label);
  });

  const totalDuration =
    BONUS_ANIMATION_DURATION + Math.max(0, animations.length - 1) * BONUS_ANIMATION_STAGGER;
  shopPresentationTimer = window.setTimeout(() => {
    document.querySelectorAll(".lineup-grid .bonus-float").forEach((label) => label.remove());
    shopPresentationTimer = 0;
    playQueuedShopPresentations();
  }, totalDuration);
}

function getEffectDefinition(effectId) {
  return effectId ? EFFECT_DEFINITIONS[effectId] ?? null : null;
}

function getEventDisplayName(eventType) {
  return EVENT_DISPLAY_NAMES[eventType] ?? eventType;
}

function getHeroSkillText(effectId, owner = null) {
  return (
    owner?.skill ??
    CARD_POOLS.hero.find((hero) => hero.effectId === effectId)?.skill ??
    ""
  );
}

function getHeroSkillLevel(owner) {
  return Math.max(1, Math.min(MAX_UNIT_LEVEL, Number(owner?.level) || 1));
}

function resolveHeroSkillDisplay(skillText, level = 1, owner = null) {
  const resolvedLevel = Math.max(1, Math.min(MAX_UNIT_LEVEL, Number(level) || 1));
  const scaledValues = [];
  const bondValues = [];
  const markScaledValue = (value) => {
    const index = scaledValues.push(String(value)) - 1;
    return `\uE000${index}\uE001`;
  };
  const markBondValue = (faction) => {
    const index = bondValues.push(faction) - 1;
    return `\uE002${index}\uE003`;
  };
  let text = String(skillText || "");
  const ownerBonds = getBaseUnitBonds(owner).filter((faction) =>
    BOND_FACTIONS.includes(faction),
  );

  if (ownerBonds.length > 0) {
    const dynamicBondText = ownerBonds.map(markBondValue).join("、");
    text = text.replace(/自身羁绊/g, dynamicBondText);
  }

  text = text.replace(/（LV1）([、，]?)\s*(\d+)\/(\d+)/g, (_match, separator, attack, health) => {
    return `${markScaledValue(`LV${resolvedLevel}`)}${separator || " "}${markScaledValue(
      `${Number(attack) * resolvedLevel}/${Number(health) * resolvedLevel}`,
    )}`;
  });
  text = text.replace(/（LV1）/g, () => markScaledValue(`LV${resolvedLevel}`));
  text = text.replace(/（(\d+(?:\/\d+)?)(%)?）/g, (_match, rawValue, percentSign) => {
    const scaledValue = rawValue
      .split("/")
      .map((value) => Number(value) * resolvedLevel)
      .join("/");
    return markScaledValue(`${scaledValue}${percentSign || ""}`);
  });

  const plainText = text
    .replace(/\uE000(\d+)\uE001/g, (_match, index) => scaledValues[Number(index)] || "")
    .replace(/\uE002(\d+)\uE003/g, (_match, index) => bondValues[Number(index)] || "");
  const html = text
    .split(/(\uE000\d+\uE001|\uE002\d+\uE003)/g)
    .map((part) => {
      const scaledToken = part.match(/^\uE000(\d+)\uE001$/);
      if (scaledToken) {
        return `<span class="hero-skill-scaled-value">${escapeBattleReportHtml(
          scaledValues[Number(scaledToken[1])] || "",
        )}</span>`;
      }
      const bondToken = part.match(/^\uE002(\d+)\uE003$/);
      if (bondToken) {
        const faction = bondValues[Number(bondToken[1])] || "";
        return `<span class="hero-skill-bond" data-faction="${escapeBattleReportHtml(
          faction,
        )}">${escapeBattleReportHtml(faction)}</span>`;
      }
      return escapeBattleReportHtml(part);
    })
    .join("");

  return {
    text: plainText,
    html,
    scaledValues,
    bondValues,
  };
}

function getHeroSkillName(effectId, owner = null) {
  const skillText = getHeroSkillText(effectId, owner);
  return skillText.match(/^\[([^\]]+)\]/)?.[1] ?? "技能";
}

function getHeroSkillDescriptionDisplay(effectId, owner = null) {
  const rawDescription = getHeroSkillText(effectId, owner)
    .replace(/^\[[^\]]+\]\s*/, "")
    .trim();
  return resolveHeroSkillDisplay(rawDescription, getHeroSkillLevel(owner), owner);
}

function getHeroSkillDescription(effectId, owner = null) {
  return getHeroSkillDescriptionDisplay(effectId, owner).text;
}

function isEffectImplemented(effectId) {
  return Boolean(getEffectDefinition(effectId));
}

function recordShopEffectEvent(type, payload) {
  state.effectEvents.push({
    id: `shop-event-${state.effectEvents.length + 1}`,
    type,
    round: state.round,
    phase: state.phase,
    ...payload,
  });
}

function getShopUnitIndex(unit) {
  return state.lineup.indexOf(unit);
}

function getNearestShopUnit(unit, direction, predicate = () => true) {
  const ownerIndex = getShopUnitIndex(unit);
  if (ownerIndex < 0) return null;
  const step = direction === "ahead" ? 1 : -1;
  for (
    let index = ownerIndex + step;
    index >= 0 && index < state.lineup.length;
    index += step
  ) {
    const target = state.lineup[index];
    if (target && predicate(target)) return target;
  }
  return null;
}

function shareAnyBond(left, right) {
  const rightBonds = new Set(getBaseUnitBonds(right));
  return getBaseUnitBonds(left).some((faction) => rightBonds.has(faction));
}

function getShopBondLevelSnapshot() {
  return Object.fromEntries(getBondEntries().map((entry) => [entry.faction, entry.level]));
}

function dispatchShopBondLevelChanges(previousLevels) {
  const currentLevels = getShopBondLevelSnapshot();
  const changes = BOND_FACTIONS.map((faction) => ({
    faction,
    previousLevel: previousLevels?.[faction] ?? 0,
    level: currentLevels[faction] ?? 0,
  })).filter((entry) => entry.previousLevel !== entry.level);
  if (changes.length > 0) {
    dispatchShopEvent("bond:level-change", {
      changes,
      decreased: changes.some((entry) => entry.level < entry.previousLevel),
      increased: changes.some((entry) => entry.level > entry.previousLevel),
    });
  }
}

function isShopHeroEventApplicable(candidate, type, payload) {
  const { owner, effectId } = candidate;
  const unit = payload.unit ?? null;
  const sharedUnit = unit && shareAnyBond(owner, unit);
  if (type === "card:purchase") return effectId === "hero.simahui.guangshi" && unit === owner;
  if (type === "unit:sell") return effectId === "hero.zuoci.bianhuan-moce" && unit === owner;
  if (type === "unit:recruit") {
    if (["hero.chengong.baiji-duomou", "hero.chengpu.yuanxun", "hero.yuanshu.yuxi"].includes(effectId)) {
      return unit === owner;
    }
    return [
      "hero.yanliang.yongguan-sanjun",
      "hero.lingtong.guoshi-zhifeng",
      "hero.yuanshao.haoling-qunxiong",
    ].includes(effectId) && sharedUnit;
  }
  if (type === "unit:summon") {
    if (effectId === "hero.zhenji.luoshen") return Boolean(unit);
    return effectId === "hero.xunyu.wangzuo-zhicai" && sharedUnit;
  }
  if (type === "experience:gain") {
    if (effectId === "hero.liaohua.sujiang" || effectId === "hero.weiyan.caigao-qilie") {
      return Boolean(unit && unit !== owner);
    }
    return false;
  }
  if (type === "unit:upgrade") {
    if (effectId === "hero.zhaoyun.longdan") return unit === owner;
    return effectId === "hero.fazheng.yiyi-dailao" && Boolean(unit && unit !== owner);
  }
  if (type === "unit:death") {
    if (["hero.pangde.xunjie", "hero.guojia.yiji-pingliao", "hero.pangtong.niepan"].includes(effectId)) {
      return unit === owner;
    }
    if (effectId === "hero.madai.fuzhan") return payload.killer === owner;
    if (effectId === "hero.huatuo.jijiu") {
      return Boolean(
        unit &&
        unit !== owner &&
        !payload.consumed &&
        !payload.revived &&
        getNearestShopUnit(owner, "ahead") === unit
      );
    }
    if (effectId === "hero.caocao.jianxiong") return Boolean(unit && shareAnyBond(owner, unit));
    return false;
  }
  if (type === "bond:level-change") {
    return effectId !== "hero.yuji.guhuo" || payload.decreased;
  }
  return true;
}

function dispatchShopEvent(type, payload = {}) {
  resolveShopEquipmentEvent(type, payload);
  const candidates = [];
  let sequence = 0;
  getLineupUnits().forEach((owner) => {
    (owner.skillEffectIds ?? []).forEach((effectId) => {
      const definition = getEffectDefinition(effectId);
      const triggers = definition?.triggers ?? [definition?.trigger];
      if (definition?.sourceType !== "hero" || !triggers.includes(type)) return;
      candidates.push({
        effectId,
        definition,
        owner,
        sourceName: owner.name,
        sequence,
        resolved: false,
      });
      sequence += 1;
    });
  });

  while (true) {
    const valid = candidates.filter(
      (candidate) =>
        !candidate.resolved &&
        isShopHeroEventApplicable(candidate, type, payload) &&
        (state.lineup.includes(candidate.owner) ||
          (type === "unit:death" && payload.unit === candidate.owner)),
    );
    if (valid.length === 0) break;
    const highestAttack = Math.max(...valid.map((candidate) => candidate.owner.attack));
    const tied = valid.filter((candidate) => candidate.owner.attack === highestAttack);
    const candidate = tied[Math.floor(Math.random() * tied.length)];
    candidate.resolved = true;
    const skillName = getHeroSkillName(candidate.effectId, candidate.owner);
    const skillDescription = getHeroSkillDescription(
      candidate.effectId,
      candidate.owner,
    );
    recordShopEffectEvent("skill:trigger", {
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
      ownerId: candidate.owner.id,
      ownerName: candidate.owner.name,
      trigger: type,
      message: `${candidate.owner.name}【${skillName}】触发（${getEventDisplayName(type)}）${
        skillDescription ? `：${skillDescription}` : ""
      }。`,
    });
    resolveShopHeroSkill(candidate, { type, payload });
    recordShopEffectEvent(type, {
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
      ownerId: candidate.owner.id,
      ownerName: candidate.owner.name,
      payload,
    });
  }
}

function resolveShopEquipmentEvent(type, payload) {
  const unit = payload.unit ?? null;
  const equipment = getUnitEquipment(unit);
  if (
    type !== "unit:death" ||
    equipment?.effectId !== "equipment.imperial-jade-seal"
  ) {
    return;
  }
  const count = applyImperialJadeSealShopBonus(unit, getBaseUnitBonds(unit));
  if (count > 0) {
    addLog(
      `${unit.name}的${equipment.name}结算${count}次，使商店中其羁绊武将永久 +${count}/+${count}。`,
    );
  }
}

function logShopHeroSkill(owner, message) {
  addLog(`${owner.name}【${owner.skill?.match(/^\[([^\]]+)\]/)?.[1] ?? "技能"}】：${message}`);
}

function resolveGeneratedStratagem(owner) {
  const tier = Math.min(6, Math.max(1, owner.level ?? 1));
  const pool = CARD_POOLS.stratagem.filter(
    (card) => card.category === "计策" && card.tier === tier && getEffectDefinition(card.effectId),
  );
  if (pool.length === 0 || getLineupUnits().length === 0) return;
  const card = pool[Math.floor(Math.random() * pool.length)];
  const targetUnit = pickShopRandomUnits(getLineupUnits(), 1)[0];
  let selectedFaction = null;
  if (card.effectId === "stratagem.temporary-bond" || (
    card.effectId === "stratagem.blood-oath" &&
    getStratagemUseCount(card.effectId) === 0
  )) {
    const factions = getAvailableExtraBondFactions(targetUnit);
    if (factions.length === 0) return;
    selectedFaction = factions[Math.floor(Math.random() * factions.length)];
  } else if (card.effectId === "stratagem.train-army") {
    selectedFaction = BOND_FACTIONS[Math.floor(Math.random() * BOND_FACTIONS.length)];
  }
  const outcome = resolveShopEffect(card.effectId, {
    card,
    targetUnit,
    targetIndex: getShopUnitIndex(targetUnit),
    selectedFaction,
  });
  if (outcome.applied) {
    logShopHeroSkill(owner, `对${targetUnit.name}使用了${tier}阶计策${card.name}`);
  }
}

function reviveShopUnit(deadUnit, owner, eventPayload) {
  if (!deadUnit || eventPayload.revived || getNearestShopUnit(owner, "ahead") !== deadUnit) {
    return false;
  }
  const level = owner.level ?? 1;
  deadUnit.level = level;
  deadUnit.copies = UNIT_LEVEL_COPY_THRESHOLDS[level];
  deadUnit.bonusExperience = 0;
  deadUnit.experience = 0;
  deadUnit.baseAttack = level;
  deadUnit.baseHealth = level;
  deadUnit.bodyAttack = level;
  deadUnit.bodyHealth = level;
  deadUnit.directModifiers = { equipment: null, status: null, bond: null };
  deadUnit.statuses = {};
  deadUnit.faction = getSummonedUnitFaction(owner);
  deadUnit.extraFactions = [];
  deadUnit.tempExtraFactions = [];
  deadUnit.usesBondDefinitionSnapshot = true;
  syncUnitStats(deadUnit);
  eventPayload.revived = true;
  logShopHeroSkill(owner, `${deadUnit.name}以LV${level} ${level}/${level}复活`);
  dispatchShopEvent("unit:revive", { unit: deadUnit, source: owner });
  dispatchShopEvent("unit:summon", { unit: deadUnit, source: owner, revived: true });
  return true;
}

function killShopUnit(target, killer, sourceEffectId) {
  if (!target) return false;
  target.health = 0;
  const index = getShopUnitIndex(target);
  const payload = {
    unit: target,
    killer,
    sourceEffectId,
    index,
    revived: false,
  };
  dispatchShopEvent("unit:death", payload);
  if (!payload.revived && index >= 0 && state.lineup[index] === target) {
    state.lineup[index] = null;
  }
  return true;
}

function reduceShopUnitExperience(unit, amount) {
  let remaining = Math.max(0, amount);
  while (remaining > 0 && getUnitProgressValue(unit) > 1) {
    if ((unit.bonusExperience ?? 0) > 0) {
      unit.bonusExperience -= 1;
    } else if ((unit.copies ?? 1) > 1) {
      unit.copies -= 1;
    }
    remaining -= 1;
  }
  const progress = getUnitProgress(getUnitProgressValue(unit));
  unit.level = progress.level;
  unit.experience = progress.experience;
  syncUnitStats(unit);
  return amount - remaining;
}

function resolveShopHeroSkill(candidate, event) {
  const { owner, effectId } = candidate;
  const { type, payload } = event;
  const level = owner.level ?? 1;
  const eventUnit = payload.unit ?? null;
  const sharedRecruit =
    type === "unit:recruit" &&
    eventUnit &&
    shareAnyBond(owner, eventUnit);

  if (effectId === "hero.zhenji.luoshen" && type === "unit:summon" && eventUnit) {
    applyShopUnitStatBonus(eventUnit, level, 0, owner.name);
    logShopHeroSkill(owner, `${eventUnit.name}获得 +${level} 攻击`);
    return;
  }
  if (effectId === "hero.pangde.xunjie" && type === "unit:death" && eventUnit === owner) {
    const target = getNearestShopUnit(owner, "behind");
    if (target) applyShopUnitStatBonus(target, level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.madai.fuzhan" &&
    type === "unit:death" &&
    payload.killer === owner
  ) {
    grantUnitExperience(owner, level, owner.name, effectId);
    return;
  }
  if (
    effectId === "hero.liaohua.sujiang" &&
    type === "experience:gain" &&
    eventUnit &&
    eventUnit !== owner
  ) {
    applyShopUnitStatBonus(eventUnit, 0, level, owner.name);
    return;
  }
  if (
    effectId === "hero.chengong.baiji-duomou" &&
    type === "unit:recruit" &&
    eventUnit === owner
  ) {
    resolveGeneratedStratagem(owner);
    return;
  }
  if (effectId === "hero.zuoci.bianhuan-moce" && type === "unit:sell" && eventUnit === owner) {
    const ahead = getNearestShopUnit(owner, "ahead");
    const behind = getNearestShopUnit(owner, "behind");
    const tierLimit = 2 * level;
    if (
      ahead &&
      behind &&
      ahead.tier <= tierLimit &&
      behind.tier <= tierLimit &&
      shareAnyBond(ahead, behind)
    ) {
      ensureUnitBodyStats(ahead);
      ensureUnitBodyStats(behind);
      const aheadPanel = { attack: ahead.attack, health: ahead.health };
      const behindPanel = { attack: behind.attack, health: behind.health };
      const aheadStackGrowth = getUnitStackGrowth(ahead);
      const behindStackGrowth = getUnitStackGrowth(behind);
      const aheadDirectStats = getDirectStatTotals(ahead);
      const behindDirectStats = getDirectStatTotals(behind);
      ahead.bodyAttack = behindPanel.attack - aheadStackGrowth - aheadDirectStats.attack;
      ahead.bodyHealth = behindPanel.health - aheadStackGrowth - aheadDirectStats.health;
      behind.bodyAttack = aheadPanel.attack - behindStackGrowth - behindDirectStats.attack;
      behind.bodyHealth = aheadPanel.health - behindStackGrowth - behindDirectStats.health;
      syncUnitStats(ahead);
      syncUnitStats(behind);
      logShopHeroSkill(owner, `交换了${ahead.name}与${behind.name}的最终面板攻血`);
    }
    return;
  }
  if (effectId === "hero.yujin.junji-yanming" && type === "round:end") {
    let target = getNearestShopUnit(owner, "ahead");
    for (let count = 0; target && count < level; count += 1) {
      applyShopUnitStatBonus(target, 1, 1, owner.name);
      target = getNearestShopUnit(target, "ahead");
    }
    return;
  }
  if (
    effectId === "hero.weiyan.caigao-qilie" &&
    type === "experience:gain" &&
    eventUnit?.id !== owner.id
  ) {
    applyShopUnitStatBonus(owner, level, 0, owner.name);
    return;
  }
  if (effectId === "hero.huangzhong.laodang-yizhuang" && type === "round:end") {
    grantUnitExperience(owner, level, owner.name, effectId);
    return;
  }
  if (
    effectId === "hero.chengpu.yuanxun" &&
    type === "unit:recruit" &&
    eventUnit === owner
  ) {
    const target = getNearestShopUnit(owner, "ahead");
    if (target) applyShopUnitStatBonus(target, level, level, owner.name);
    return;
  }
  if (effectId === "hero.yanliang.yongguan-sanjun" && sharedRecruit) {
    applyShopUnitStatBonus(owner, level, level, owner.name);
    return;
  }
  if (effectId === "hero.hanxiandi.piaoyao" && type === "bond:level-change") {
    const target = pickShopRandomUnits(
      getLineupUnits().filter((unit) => unit !== owner),
      1,
    )[0];
    if (target) applyShopUnitStatBonus(target, level, level, owner.name);
    return;
  }
  if (effectId === "hero.diaochan.qingcheng" && type === "round:end") {
    const target = getNearestShopUnit(owner, "ahead");
    if (!target) return;
    const bonds = getBaseUnitBonds(target);
    owner.faction = bonds[0] ?? "无";
    owner.extraFactions = bonds.slice(1);
    owner.tempExtraFactions = [];
    owner.usesBondDefinitionSnapshot = true;
    applyShopUnitStatBonus(owner, 0, level, owner.name);
    return;
  }
  if (effectId === "hero.lusu.lianhe" && type === "round:start") {
    const gain = Math.floor(getActiveBondCount() / 2) * 2 * level;
    if (gain > 0) {
      state.gold = Math.min(GOLD_CAP, state.gold + gain);
      logShopHeroSkill(owner, `获得${gain}金币`);
    }
    return;
  }
  if (
    effectId === "hero.yuji.guhuo" &&
    type === "bond:level-change" &&
    payload.decreased
  ) {
    const target = getNearestShopUnit(owner, "ahead");
    if (target) applyShopUnitStatBonus(target, level, level, owner.name);
    return;
  }
  if (effectId === "hero.zhaoyun.longdan" && type === "unit:upgrade" && eventUnit === owner) {
    owner.statuses = {
      unparalleled: { sourceEffectId: effectId, sourceName: owner.name },
    };
    applyShopUnitStatBonus(owner, 2 * level, 2 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.fazheng.yiyi-dailao" &&
    type === "unit:upgrade" &&
    eventUnit &&
    eventUnit !== owner
  ) {
    grantUnitExperience(eventUnit, level, owner.name, effectId);
    eventUnit.statuses = {
      rest: { amount: 2 * level, sourceEffectId: effectId },
    };
    return;
  }
  if (effectId === "hero.lingtong.guoshi-zhifeng" && sharedRecruit) {
    applyShopUnitStatBonus(eventUnit, 2 * level, 2 * level, owner.name);
    return;
  }
  if (effectId === "hero.zhanghe.qiaobian" && type === "bond:level-change") {
    applyShopUnitStatBonus(owner, 2 * level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.simahui.guangshi" &&
    type === "card:purchase" &&
    eventUnit === owner
  ) {
    const options = getLineupUnits().flatMap((unit) =>
      getAvailableExtraBondFactions(unit).map((faction) => ({
        unitId: unit.id,
        unitName: unit.name,
        faction,
      })),
    );
    if (options.length > 0) {
      state.pendingHeroBondChoice = {
        ownerId: owner.id,
        ownerName: owner.name,
        statBonus: level,
        options,
      };
    }
    return;
  }
  if (
    effectId === "hero.yuanshu.yuxi" &&
    type === "unit:recruit" &&
    eventUnit === owner
  ) {
    const equipment = getUnitEquipment(owner);
    if (!equipment) {
      owner.directModifiers.equipment = createGeneratedEquipment(
        "equipment.imperial-jade-seal",
      );
      syncUnitStats(owner);
      logShopHeroSkill(owner, `获得并佩戴传国玉玺，当前阵亡效果共结算${1 + level}次`);
    } else if (equipment.effectId === "equipment.imperial-jade-seal") {
      logShopHeroSkill(owner, `强化传国玉玺，当前阵亡效果共结算${1 + level}次`);
    } else {
      logShopHeroSkill(owner, `装备槽已有${equipment.name}，未能佩戴传国玉玺`);
    }
    return;
  }
  if (
    effectId === "hero.guojia.yiji-pingliao" &&
    type === "unit:death" &&
    eventUnit === owner
  ) {
    getLineupUnits()
      .filter((unit) => unit !== owner && shareAnyBond(owner, unit))
      .forEach((unit) =>
        applyShopUnitStatBonus(unit, 2 * level, 2 * level, owner.name),
      );
    return;
  }
  if (
    effectId === "hero.pangtong.niepan" &&
    type === "unit:death" &&
    eventUnit === owner
  ) {
    pickShopRandomUnits(
      getLineupUnits().filter((unit) => unit !== owner),
      2,
    ).forEach((unit) => grantUnitExperience(unit, level, owner.name, effectId));
    return;
  }
  if (effectId === "hero.dongzhuo.baonue" && type === "round:end") {
    const targets = getLineupUnits().filter(
      (unit) => unit !== owner && !shareAnyBond(owner, unit),
    );
    const target = pickShopRandomUnits(targets, 1)[0];
    if (target && killShopUnit(target, owner, effectId)) {
      applyShopUnitStatBonus(owner, 3 * level, 3 * level, owner.name);
    }
    return;
  }
  if (
    effectId === "hero.huatuo.jijiu" &&
    type === "unit:death" &&
    eventUnit !== owner
  ) {
    reviveShopUnit(eventUnit, owner, payload);
    return;
  }
  if (
    effectId === "hero.caocao.jianxiong" &&
    type === "unit:death" &&
    eventUnit &&
    shareAnyBond(owner, eventUnit)
  ) {
    const target = pickShopRandomUnits(
      getLineupUnits().filter((unit) => unit !== owner && unit !== eventUnit),
      1,
    )[0];
    if (target) applyShopUnitStatBonus(target, 4 * level, 4 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.xunyu.wangzuo-zhicai" &&
    type === "unit:summon" &&
    eventUnit &&
    shareAnyBond(owner, eventUnit)
  ) {
    applyShopUnitStatBonus(eventUnit, 4 * level, 4 * level, owner.name);
    return;
  }
  if (effectId === "hero.liubei.renze" && type === "round:end") {
    const target = getNearestShopUnit(owner, "ahead", (unit) => shareAnyBond(owner, unit));
    if (target) {
      reduceShopUnitExperience(target, 1);
      applyShopUnitStatBonus(target, 5 * level, 5 * level, owner.name);
    }
    return;
  }
  if (effectId === "hero.sunquan.quanheng" && type === "round:end") {
    const ahead = getNearestShopUnit(owner, "ahead", (unit) => shareAnyBond(owner, unit));
    const behind = getNearestShopUnit(owner, "behind", (unit) => shareAnyBond(owner, unit));
    if (ahead) applyShopUnitStatBonus(ahead, 5 * level, 0, owner.name);
    if (behind) applyShopUnitStatBonus(behind, 0, 5 * level, owner.name);
    return;
  }
  if (effectId === "hero.yuanshao.haoling-qunxiong" && sharedRecruit) {
    getLineupUnits().forEach((unit) =>
      applyShopUnitStatBonus(unit, level, 2 * level, owner.name),
    );
  }
}

function getStratagemUseCount(effectId) {
  return state.stratagemUseCounts[effectId] ?? 0;
}

function pickShopRandomUnits(units, count) {
  const pool = [...units];
  const selected = [];
  while (pool.length > 0 && selected.length < count) {
    selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return selected;
}

function getHighestActiveBondFactions() {
  const active = getBondEntries().filter((entry) => entry.level > 0);
  if (active.length === 0) return [];
  const highestLevel = Math.max(...active.map((entry) => entry.level));
  return active
    .filter((entry) => entry.level === highestLevel)
    .map((entry) => entry.faction);
}

function pickHighestActiveBondFaction() {
  const factions = getHighestActiveBondFactions();
  if (factions.length === 0) return null;
  return factions[Math.floor(Math.random() * factions.length)];
}

function getLineupUnitsInBond(faction) {
  return getLineupUnits().filter((unit) => getEffectiveUnitBonds(unit).includes(faction));
}

function getAvailableExtraBondFactions(unit) {
  if (!unit || getBaseUnitBonds(unit).length >= MAX_UNIT_BONDS) return [];
  const current = new Set(getBaseUnitBonds(unit));
  return BOND_FACTIONS.filter((faction) => !current.has(faction));
}

function applyShopUnitBonuses(units, attack, health, sourceName) {
  units.forEach((unit) => applyShopUnitStatBonus(unit, attack, health, sourceName));
  return units;
}

function grantUnitExperience(unit, amount, sourceName, sourceEffectId = null) {
  const maximumProgress = UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL];
  const requested = Math.max(0, amount);
  const initialLevel = unit.level;
  let granted = 0;
  let convertedToStats = 0;
  for (let point = 0; point < requested; point += 1) {
    if (getUnitProgressValue(unit) >= maximumProgress) {
      applyShopUnitStatBonus(unit, 1, 1, sourceName);
      convertedToStats += 1;
      continue;
    }
    const previousLevel = unit.level;
    unit.bonusExperience = Math.max(0, unit.bonusExperience ?? 0) + 1;
    const progress = getUnitProgress(getUnitProgressValue(unit));
    unit.level = progress.level;
    unit.experience = progress.experience;
    syncUnitStats(unit);
    granted += 1;
    const queuedExperienceAnimation = queueShopBonusAnimation(unit, 1, 1, sourceName);
    dispatchShopEvent("experience:gain", {
      unit,
      amount: 1,
      sourceName,
      sourceEffectId,
    });
    if (unit.level > previousLevel) {
      const queuedUpgradeAnimation = queueShopUpgradeAnimation(
        unit,
        unit.level,
        sourceName,
      );
      recordShopEffectEvent("unit:upgrade", {
        sourceEffectId,
        sourceName,
        targetId: unit.id,
        targetName: unit.name,
        previousLevel,
        unitLevel: unit.level,
        message: `${unit.name}由 LV${previousLevel} 升至 LV${unit.level}。`,
      });
      const deferReward =
        resolveShopUpgradeBondEffects(unit, previousLevel, unit.level) ||
        queuedExperienceAnimation ||
        queuedUpgradeAnimation;
      dispatchShopEvent("unit:upgrade", {
        unit,
        previousLevel,
        level: unit.level,
        sourceName,
        sourceEffectId,
      });
      queueUpgradeRewards(unit, previousLevel, unit.level, {
        deferFirstReward: deferReward,
      });
    }
  }

  return {
    granted,
    convertedToStats,
    leveledUp: unit.level > initialLevel,
    previousLevel: initialLevel,
    level: unit.level,
    experience: unit.experience,
  };
}

function resolveShopEffect(effectId, context) {
  const definition = getEffectDefinition(effectId);
  if (!definition || definition.trigger !== "stratagem:use") {
    return { applied: false, messages: [] };
  }

  const messages = [];
  const affectedUnitIds = new Set();
  const affectedShopCardIds = new Set();
  const priorUseCount = getStratagemUseCount(effectId);
  let selectedFaction = context.selectedFaction ?? null;
  definition.operations.forEach((operation) => {
    if (operation.type === "modify-body-stats" && context.targetUnit) {
      applyShopUnitStatBonus(
        context.targetUnit,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      );
      affectedUnitIds.add(context.targetUnit.id);
      messages.push(
        `${context.targetUnit.name}永久获得 +${operation.attack ?? 0}/+${
          operation.health ?? 0
        }`,
      );
      return;
    }

    if (operation.type === "add-extra-bond" && context.targetUnit && selectedFaction) {
      if (addExtraBond(context.targetUnit, selectedFaction, { temporary: operation.temporary })) {
        getLineupUnits()
          .filter((unit) => unit.name === context.targetUnit.name)
          .forEach((unit) => affectedUnitIds.add(unit.id));
        messages.push(
          `${context.targetUnit.name}的全部同名卡牌获得${
            operation.temporary ? "本回合" : "本局永久"
          }“${selectedFaction}”羁绊`,
        );
      }
      return;
    }

    if (operation.type === "buff-random-highest-bond") {
      selectedFaction ??= pickHighestActiveBondFaction();
      const candidates = selectedFaction ? getLineupUnitsInBond(selectedFaction) : [];
      const targets = pickShopRandomUnits(candidates, operation.count ?? 1);
      applyShopUnitBonuses(
        targets,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      ).forEach((unit) => affectedUnitIds.add(unit.id));
      if (targets.length > 0) {
        messages.push(
          `从最高等级“${selectedFaction}”羁绊中选中${targets
            .map((unit) => unit.name)
            .join("、")}，分别永久 +${operation.attack ?? 0}/+${operation.health ?? 0}`,
        );
      }
      return;
    }

    if (operation.type === "buff-inactive-bonds") {
      const inactiveFactions = getBondEntries()
        .filter((entry) => entry.level === 0)
        .map((entry) => entry.faction);
      const inactiveSet = new Set(inactiveFactions);
      const targets = getLineupUnits().filter((unit) =>
        getEffectiveUnitBonds(unit).some((faction) => inactiveSet.has(faction)),
      );
      applyShopUnitBonuses(
        targets,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      ).forEach((unit) => affectedUnitIds.add(unit.id));
      if (targets.length > 0) {
        messages.push(
          `${targets.map((unit) => unit.name).join("、")}分别永久 +${
            operation.attack ?? 0
          }/+${operation.health ?? 0}`,
        );
      }
      return;
    }

    if (operation.type === "buff-shop-selected-bond" && selectedFaction) {
      const cumulativeBonus = addShopBondBonus(
        selectedFaction,
        operation.attack ?? 0,
        operation.health ?? 0,
      );
      const targets = state.shop.filter(
        (card) => card?.type === "hero" && getBaseUnitBonds(card).includes(selectedFaction),
      );
      targets.forEach((card) => {
        syncShopHeroCardBonuses(card);
        affectedShopCardIds.add(card.id);
      });
      messages.push(
        `本局商店的“${selectedFaction}”羁绊武将加成累计为 +${
          cumulativeBonus.attack
        }/+${cumulativeBonus.health}；当前商店影响 ${
          targets.length > 0 ? targets.map((card) => card.name).join("、") : "0 张卡牌"
        }，未来刷新与奖励生成的同羁绊武将也会继承`,
      );
      return;
    }

    if (operation.type === "first-use-extra-bond-then-stats" && context.targetUnit) {
      if (priorUseCount === 0 && selectedFaction) {
        if (addExtraBond(context.targetUnit, selectedFaction)) {
          getLineupUnits()
            .filter((unit) => unit.name === context.targetUnit.name)
            .forEach((unit) => affectedUnitIds.add(unit.id));
          messages.push(
            `${context.targetUnit.name}的全部同名卡牌本局永久获得“${selectedFaction}”羁绊`,
          );
        }
      } else if (priorUseCount > 0) {
        applyShopUnitStatBonus(
          context.targetUnit,
          operation.attack ?? 0,
          operation.health ?? 0,
          context.card.name,
        );
        affectedUnitIds.add(context.targetUnit.id);
        messages.push(
          `${context.targetUnit.name}永久获得 +${operation.attack ?? 0}/+${
            operation.health ?? 0
          }`,
        );
      }
      return;
    }

    if (operation.type === "buff-all-highest-bond") {
      selectedFaction ??= pickHighestActiveBondFaction();
      const targets = selectedFaction ? getLineupUnitsInBond(selectedFaction) : [];
      applyShopUnitBonuses(
        targets,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      ).forEach((unit) => affectedUnitIds.add(unit.id));
      if (targets.length > 0) {
        messages.push(
          `最高等级“${selectedFaction}”羁绊下的${targets
            .map((unit) => unit.name)
            .join("、")}分别永久 +${operation.attack ?? 0}/+${operation.health ?? 0}`,
        );
      }
      return;
    }

    if (operation.type === "grant-experience" && context.targetUnit) {
      const result = grantUnitExperience(
        context.targetUnit,
        operation.amount ?? 0,
        context.card.name,
      );
      if (result.granted > 0 || result.convertedToStats > 0) {
        affectedUnitIds.add(context.targetUnit.id);
        const experienceMessage =
          result.granted > 0
            ? `经验值 +${result.granted}，当前为 ${result.level} 级 ${result.experience} 经验${
                result.leveledUp ? "，并触发升级" : ""
              }`
            : "";
        const overflowMessage =
          result.convertedToStats > 0
            ? `${experienceMessage ? "；" : ""}${result.convertedToStats} 点溢出经验转化为 +${result.convertedToStats}/+${result.convertedToStats}`
            : "";
        messages.push(`${context.targetUnit.name}${experienceMessage}${overflowMessage}`);
      }
      return;
    }

    if (operation.type === "scaling-body-stats" && context.targetUnit) {
      const attack =
        (operation.baseAttack ?? 0) + priorUseCount * (operation.attackPerPriorUse ?? 0);
      const health =
        (operation.baseHealth ?? 0) + priorUseCount * (operation.healthPerPriorUse ?? 0);
      applyShopUnitStatBonus(context.targetUnit, attack, health, context.card.name);
      affectedUnitIds.add(context.targetUnit.id);
      messages.push(
        `${context.targetUnit.name}永久获得 +${attack}/+${health}（第 ${
          priorUseCount + 1
        } 次使用）`,
      );
    }
  });

  const applied = messages.length > 0;
  if (applied) state.stratagemUseCounts[effectId] = priorUseCount + 1;
  recordShopEffectEvent("stratagem:use", {
    sourceEffectId: effectId,
    sourceName: context.card.name,
    targetId: context.targetUnit?.id ?? null,
    targetName: context.targetUnit?.name ?? null,
    selectedFaction,
    affectedUnitIds: [...affectedUnitIds],
    affectedShopCardIds: [...affectedShopCardIds],
    useCount: applied ? priorUseCount + 1 : priorUseCount,
    applied,
  });
  return {
    applied,
    messages,
    selectedFaction,
    affectedUnitIds: [...affectedUnitIds],
    affectedShopCardIds: [...affectedShopCardIds],
  };
}

function getCurrentShopBondLevel(faction) {
  return getBondEntries().find((entry) => entry.faction === faction)?.level ?? 0;
}

function resolveShopUpgradeBondEffects(unit, previousLevel, currentLevel) {
  const shuLevel = getCurrentShopBondLevel("蜀");
  if (shuLevel <= 0 || !getEffectiveUnitBonds(unit).includes("蜀")) return false;

  const statGain = shuLevel >= 4 ? 2 : shuLevel >= 3 ? 1 : shuLevel;
  const affectsArmy = shuLevel >= 3;
  let queuedAnimation = false;
  for (let level = previousLevel + 1; level <= currentLevel; level += 1) {
    const targets = affectsArmy ? getLineupUnits() : [unit];
    targets.forEach((target) => {
      queuedAnimation =
        applyShopUnitStatBonus(
          target,
          statGain,
          statGain,
          `${BOND_RULES.蜀.label} LV${shuLevel}`,
        ) || queuedAnimation;
    });
    const targetLabel = affectsArmy ? "全军" : unit.name;
    addLog(
      `${BOND_RULES.蜀.label} LV${shuLevel}：${unit.name} 升到 ${level} 级，${targetLabel}永久 +${statGain}/+${statGain}。`,
    );
    recordShopEffectEvent("unit:upgrade", {
      sourceEffectId: "bond.shu-upgrade",
      sourceName: `${BOND_RULES.蜀.label} LV${shuLevel}`,
      targetId: unit.id,
      targetName: unit.name,
      unitLevel: level,
      affectedUnitIds: targets.map((target) => target.id),
      message: `${BOND_RULES.蜀.label} LV${shuLevel}：${unit.name}升级，${
        affectsArmy ? "全军" : unit.name
      }获得 +${statGain}/+${statGain}。`,
    });
  }
  return queuedAnimation;
}

function canMergeCardIntoUnit(card, unit) {
  return Boolean(
    card &&
      unit &&
      card.type === "hero" &&
      card.name === unit.name &&
      getUnitProgressValue(unit) + 1 <= UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL],
  );
}

function canMergeUnits(sourceUnit, targetUnit) {
  return Boolean(
    sourceUnit &&
      targetUnit &&
      sourceUnit !== targetUnit &&
      sourceUnit.name === targetUnit.name &&
      getUnitProgressValue(sourceUnit) + getUnitProgressValue(targetUnit) <=
        UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL],
  );
}

function inheritEmptyMergeSlots(targetUnit, sourceUnit) {
  const targetModifiers = targetUnit.directModifiers ?? {};
  const sourceModifiers = sourceUnit.directModifiers ?? {};
  const modifierKeys = new Set([...Object.keys(targetModifiers), ...Object.keys(sourceModifiers)]);
  targetUnit.directModifiers = { ...targetModifiers };
  modifierKeys.forEach((key) => {
    const targetValue = targetUnit.directModifiers[key];
    const targetIsEmpty =
      targetValue == null || (Array.isArray(targetValue) && targetValue.length === 0);
    if (targetIsEmpty && sourceModifiers[key] != null) {
      targetUnit.directModifiers[key] = cloneDirectModifier(sourceModifiers[key]);
    }
  });

  if ((targetUnit.extraFactions ?? []).length === 0 && (sourceUnit.extraFactions ?? []).length > 0) {
    targetUnit.extraFactions = [...sourceUnit.extraFactions];
  }
  if (
    (targetUnit.tempExtraFactions ?? []).length === 0 &&
    (sourceUnit.tempExtraFactions ?? []).length > 0
  ) {
    targetUnit.tempExtraFactions = [...sourceUnit.tempExtraFactions];
  }
}

function mergeUnitIntoTarget(sourceUnit, targetUnit) {
  if (!canMergeUnits(sourceUnit, targetUnit)) return null;

  const previousLevel = targetUnit.level;
  ensureUnitBodyStats(sourceUnit);
  ensureUnitBodyStats(targetUnit);
  targetUnit.bodyAttack = Math.max(targetUnit.bodyAttack, sourceUnit.bodyAttack);
  targetUnit.bodyHealth = Math.max(targetUnit.bodyHealth, sourceUnit.bodyHealth);
  targetUnit.copies = getUnitCopies(targetUnit) + getUnitCopies(sourceUnit);
  targetUnit.bonusExperience =
    Math.max(0, targetUnit.bonusExperience ?? 0) +
    Math.max(0, sourceUnit.bonusExperience ?? 0);
  const progress = getUnitProgress(getUnitProgressValue(targetUnit));
  targetUnit.level = progress.level;
  targetUnit.experience = progress.experience;
  inheritEmptyMergeSlots(targetUnit, sourceUnit);
  syncUnitStats(targetUnit);

  return {
    leveledUp: targetUnit.level > previousLevel,
    previousLevel,
    level: targetUnit.level,
    experience: targetUnit.experience,
    copies: targetUnit.copies,
  };
}

function mergeCardIntoUnit(card, targetUnit) {
  if (!canMergeCardIntoUnit(card, targetUnit)) return null;
  return mergeUnitIntoTarget(createUnitFromCard(card), targetUnit);
}

function queueUpgradeRewards(
  unit,
  previousLevel,
  currentLevel,
  { deferFirstReward = false } = {},
) {
  const rewardTier = Math.min(6, getTier(state.round) + 1);
  const pool = CARD_POOLS.hero.filter((hero) => hero.tier === rewardTier);
  for (let level = previousLevel + 1; level <= currentLevel; level += 1) {
    const candidates = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    state.pendingRewards.push({
      unitName: unit.name,
      level,
      rewardTier,
      candidates,
      availableRound: resolvingEndTurn ? state.round + 1 : state.round,
      ready:
        !resolvingEndTurn &&
        !(deferFirstReward && level === previousLevel + 1),
    });
  }
}

function selectUpgradeReward(candidateIndex) {
  const reward = state.pendingRewards[0];
  const base = reward?.candidates[candidateIndex];
  if (!reward || reward.ready === false || !base) return;

  clearAllBondSelectionHints();
  const card = createCardFromBase({ ...base, cost: HERO_COST }, "hero");
  card.isReward = true;
  const emptyIndex = state.shop.findIndex((slot) => slot === null);
  if (emptyIndex >= 0) {
    state.shop[emptyIndex] = card;
  } else {
    state.shop.push(card);
  }
  state.pendingRewards.shift();
  addLog(
    `${reward.unitName} 升到 ${reward.level} 级：选择 ${card.name} 作为升级奖励，购买费用 ${HERO_COST} 金币。`,
  );
  render();
}

function skipUpgradeReward() {
  const reward = state.pendingRewards[0];
  if (!reward || reward.ready === false) return;
  clearAllBondSelectionHints();
  state.pendingRewards.shift();
  addLog(`${reward.unitName} 升到 ${reward.level} 级：跳过本次升级奖励。`);
  render();
}

function buildShop({ guaranteeFaction = null } = {}) {
  const rule = getShopRule(state.round);
  const lockedCards = state.shop.filter((card) => card?.isLocked);
  const lockedHeroes = lockedCards.filter((card) => card.type === "hero");
  const lockedItems = lockedCards.filter((card) => card.type !== "hero");
  const generatedHeroes = [];
  const generatedItems = [];

  for (let index = lockedHeroes.length; index < rule.heroSlots; index += 1) {
    generatedHeroes.push(
      guaranteeFaction && generatedHeroes.length === 0
        ? createHeroCardByFaction(guaranteeFaction)
        : createCard("hero"),
    );
  }
  for (let index = lockedItems.length; index < rule.itemSlots; index += 1) {
    generatedItems.push(createCard("stratagem"));
  }

  const heroes = [...lockedHeroes, ...generatedHeroes];
  const items = [...generatedItems, ...lockedItems];
  const standardHeroes = heroes.slice(0, rule.heroSlots);
  const standardItems = items.slice(-rule.itemSlots);
  const overflowHeroes = heroes.slice(rule.heroSlots);
  const overflowItems = items.slice(0, Math.max(0, items.length - rule.itemSlots));

  state.shop = [
    ...standardHeroes,
    ...standardItems,
    ...overflowHeroes,
    ...overflowItems,
  ];
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

function buyHeroToLineup(shopIndex, lineupIndex) {
  if (state.phase !== "shop") return;
  const card = state.shop[shopIndex];
  if (!card || card.type !== "hero") return;
  if (state.gold < card.cost) {
    notify("金币不足，无法购买武将。");
    return;
  }
  const targetUnit = state.lineup[lineupIndex];
  if (targetUnit && targetUnit.name !== card.name) {
    notify("目标阵容槽已有其他武将。");
    return;
  }
  if (targetUnit && !canMergeCardIntoUnit(card, targetUnit)) {
    notify(`${targetUnit.name} 已达到 3 级，不能继续叠加。`);
    return;
  }

  const previousBondLevels = getShopBondLevelSnapshot();
  state.gold -= card.cost;
  state.shop[shopIndex] = null;
  let unit = targetUnit;
  let mergeResult = null;
  if (unit) {
    const result = mergeCardIntoUnit(card, unit);
    mergeResult = result;
    addLog(
      result.leveledUp
        ? `拖拽叠加 ${card.name}，升级为 ${result.level} 级。`
        : `拖拽叠加 ${card.name}，当前为 ${result.level} 级 ${result.experience} 经验。`,
    );
    if (result.leveledUp) {
      const queuedUpgradeAnimation = queueShopUpgradeAnimation(
        unit,
        result.level,
        card.name,
      );
      const queuedBondAnimation = resolveShopUpgradeBondEffects(
        unit,
        result.previousLevel,
        result.level,
      );
      const deferReward = queuedUpgradeAnimation || queuedBondAnimation;
      queueUpgradeRewards(unit, result.previousLevel, result.level, {
        deferFirstReward: deferReward,
      });
    }
  } else {
    unit = createUnitFromCard(card);
    state.lineup[lineupIndex] = unit;
    addLog(`拖拽购买 ${card.name} 到 ${lineupIndex + 1} 号阵容槽（1级0经验）。`);
  }
  dispatchShopEvent("card:purchase", { card, unit, isNewUnit: !targetUnit });
  dispatchShopEvent("unit:recruit", { card, unit, isNewUnit: !targetUnit });
  if (!targetUnit) {
    dispatchShopEvent("unit:summon", { card, unit, source: "purchase" });
  } else {
    dispatchShopEvent("experience:gain", {
      unit,
      amount: 1,
      sourceName: card.name,
      sourceEffectId: "system.recruit-merge",
    });
    if (mergeResult?.leveledUp) {
      dispatchShopEvent("unit:upgrade", {
        unit,
        previousLevel: mergeResult.previousLevel,
        level: mergeResult.level,
        sourceName: card.name,
        sourceEffectId: "system.recruit-merge",
      });
    }
  }
  dispatchShopBondLevelChanges(previousBondLevels);
  render();
}

function buyEquipmentToLineup(shopIndex, lineupIndex) {
  if (state.phase !== "shop") return;
  const card = state.shop[shopIndex];
  const unit = state.lineup[lineupIndex];
  if (!card || card.type !== "stratagem" || card.category !== "装备") return;
  if (!unit) {
    notify("装备只能交给阵容中的武将。");
    return;
  }
  if (getUnitEquipment(unit)) {
    notify(`${unit.name} 已有装备，请先移动或出售原装备。`);
    return;
  }
  if (state.gold < card.cost) {
    notify("金币不足，无法购买装备。");
    return;
  }

  state.gold -= card.cost;
  state.shop[shopIndex] = null;
  unit.directModifiers ??= {};
  unit.directModifiers.equipment = createEquipmentFromCard(card);
  syncUnitStats(unit);
  addLog(
    isEffectImplemented(card.effectId)
      ? `购买装备 ${card.name}，由 ${unit.name} 佩戴；真实效果已接入。`
      : `购买装备 ${card.name}，由 ${unit.name} 佩戴；当前只展示描述，不执行真实效果。`,
  );
  render();
}

function getStratagemUseValidation(card, targetUnit) {
  if (!card?.effectId || !getEffectDefinition(card.effectId)) {
    return { valid: false, reason: `${card?.name ?? "该计策"}尚未配置结构化效果。` };
  }

  if (card.targetMode === "unit" && !targetUnit) {
    return { valid: false, reason: `${card.name}需要拖到一名阵容武将上。` };
  }

  if (card.effectId === "stratagem.temporary-bond") {
    const factions = getAvailableExtraBondFactions(targetUnit);
    return factions.length > 0
      ? {
          valid: true,
          requiresBondChoice: true,
          availableFactions: factions,
          choiceDescription: `为${targetUnit.name}选择一个持续到本回合结束的额外羁绊。`,
        }
      : { valid: false, reason: `${targetUnit.name}已经拥有两个羁绊，无法再添加。` };
  }

  if (
    card.effectId === "stratagem.recommend-talent" ||
    card.effectId === "stratagem.advance-together" ||
    card.effectId === "stratagem.united-force"
  ) {
    const factions = getHighestActiveBondFactions().filter(
      (faction) => getLineupUnitsInBond(faction).length > 0,
    );
    return factions.length > 0
      ? { valid: true }
      : { valid: false, reason: `${card.name}需要阵容中至少存在一个已激活羁绊。` };
  }

  if (card.effectId === "stratagem.hidden-potential") {
    const inactiveFactions = new Set(
      getBondEntries()
        .filter((entry) => entry.level === 0)
        .map((entry) => entry.faction),
    );
    const hasTarget = getLineupUnits().some((unit) =>
      getEffectiveUnitBonds(unit).some((faction) => inactiveFactions.has(faction)),
    );
    return hasTarget
      ? { valid: true }
      : { valid: false, reason: "当前阵容中没有属于未激活羁绊的武将。" };
  }

  if (card.effectId === "stratagem.train-army") {
    return {
      valid: true,
      requiresBondChoice: true,
      availableFactions: [...BOND_FACTIONS],
      choiceDescription:
        "选择一个羁绊：本局当前及未来生成的该羁绊商店武将均获得累计 +2/+2。",
    };
  }

  if (
    card.effectId === "stratagem.blood-oath" &&
    getStratagemUseCount(card.effectId) === 0
  ) {
    const factions = getAvailableExtraBondFactions(targetUnit);
    return factions.length > 0
      ? {
          valid: true,
          requiresBondChoice: true,
          availableFactions: factions,
          choiceDescription: `首次使用歃血盟书：为${targetUnit.name}选择一个永久额外羁绊。`,
        }
      : { valid: false, reason: `${targetUnit.name}已经拥有两个羁绊，无法再添加。` };
  }

  return { valid: true };
}

function completeStratagemUse(shopIndex, lineupIndex, selectedFaction = null) {
  const card = state.shop[shopIndex];
  const targetUnit = state.lineup[lineupIndex];
  if (!card || card.type !== "stratagem" || card.category !== "计策") return false;
  if (state.gold < card.cost) {
    notify("金币不足，无法使用计策。");
    return false;
  }

  const validation = getStratagemUseValidation(card, targetUnit);
  if (!validation.valid) {
    notify(validation.reason);
    return false;
  }
  if (
    validation.requiresBondChoice &&
    !validation.availableFactions.includes(selectedFaction)
  ) {
    notify("请选择一个有效羁绊。");
    return false;
  }

  const previousBondLevels = getShopBondLevelSnapshot();
  const outcome = resolveShopEffect(card.effectId, {
    card,
    targetUnit,
    targetIndex: lineupIndex,
    selectedFaction,
  });
  if (!outcome.applied) {
    notify(`${card.name}当前没有可结算的目标。`);
    return false;
  }

  state.gold -= card.cost;
  state.shop[shopIndex] = null;
  state.pendingStratagemUse = null;
  dispatchShopBondLevelChanges(previousBondLevels);
  const targetLabel =
    card.targetMode === "unit"
      ? `，目标为 ${targetUnit.name}`
      : `，由 ${lineupIndex + 1} 号阵容位触发`;
  addLog(`使用计策 ${card.name}${targetLabel}：${outcome.messages.join("；")}。`);
  render();
  return true;
}

function useStratagemOnLineup(shopIndex, lineupIndex) {
  if (state.phase !== "shop") return;
  if (state.pendingStratagemUse) return;
  const card = state.shop[shopIndex];
  const targetUnit = state.lineup[lineupIndex];
  if (!card || card.type !== "stratagem" || card.category !== "计策") return;
  if (state.gold < card.cost) {
    notify("金币不足，无法使用计策。");
    return;
  }

  const validation = getStratagemUseValidation(card, targetUnit);
  if (!validation.valid) {
    notify(validation.reason);
    return;
  }
  if (validation.requiresBondChoice) {
    state.pendingStratagemUse = {
      shopIndex,
      lineupIndex,
      cardId: card.id,
      cardName: card.name,
      availableFactions: validation.availableFactions,
      choiceDescription: validation.choiceDescription,
    };
    render();
    return;
  }
  completeStratagemUse(shopIndex, lineupIndex);
}

function selectStratagemBondChoice(faction) {
  const pending = state.pendingStratagemUse;
  if (!pending || !pending.availableFactions.includes(faction)) return;
  completeStratagemUse(pending.shopIndex, pending.lineupIndex, faction);
}

function cancelStratagemChoice() {
  if (!state.pendingStratagemUse) return;
  state.pendingStratagemUse = null;
  render();
}

function selectHeroBondChoice(optionIndex) {
  const pending = state.pendingHeroBondChoice;
  const option = pending?.options?.[optionIndex];
  const unit = option
    ? getLineupUnits().find((candidate) => candidate.id === option.unitId)
    : null;
  if (!pending || !option || !unit) return;
  const previousBondLevels = getShopBondLevelSnapshot();
  if (!addExtraBond(unit, option.faction)) {
    notify("该羁绊选择已经失效，请重新选择。");
    return;
  }
  state.pendingHeroBondChoice = null;
  const statBonus = Math.max(1, Number(pending.statBonus) || 1);
  applyShopUnitStatBonus(unit, statBonus, statBonus, pending.ownerName);
  dispatchShopBondLevelChanges(previousBondLevels);
  addLog(
    `${pending.ownerName}【广识】：为${unit.name}永久添加“${option.faction}”羁绊，并使其 +${statBonus}/+${statBonus}。`,
  );
  render();
}

function moveOrSwapEquipment(sourceIndex, targetIndex) {
  if (sourceIndex === targetIndex) return;
  const sourceUnit = state.lineup[sourceIndex];
  const targetUnit = state.lineup[targetIndex];
  const sourceEquipment = getUnitEquipment(sourceUnit);
  if (!sourceUnit || !sourceEquipment) return;
  if (!targetUnit) {
    notify("装备只能交给阵容中的武将。");
    return;
  }

  const targetEquipment = getUnitEquipment(targetUnit);
  sourceUnit.directModifiers.equipment = targetEquipment
    ? cloneDirectModifier(targetEquipment)
    : null;
  targetUnit.directModifiers ??= {};
  targetUnit.directModifiers.equipment = cloneDirectModifier(sourceEquipment);
  syncUnitStats(sourceUnit);
  syncUnitStats(targetUnit);
  addLog(
    targetEquipment
      ? `${sourceUnit.name} 与 ${targetUnit.name} 交换装备：${sourceEquipment.name} / ${targetEquipment.name}。`
      : `${sourceUnit.name} 将 ${sourceEquipment.name} 交给 ${targetUnit.name}。`,
  );
  render();
}

function clearLineupDropState() {
  document.querySelectorAll(".lineup-slot").forEach((slot) => {
    slot.classList.remove(
      "drop-target",
      "drop-merge",
      "drop-blocked",
      "drop-insert-left",
      "drop-insert-right",
      "drop-insert-gap",
      "drop-shift-left",
      "drop-shift-right",
    );
  });
}

function setSellZoneVisible(visible) {
  elements.sellZone?.classList.toggle("visible", visible);
  elements.sellZone?.classList.remove("drag-over");
  elements.sellZone?.setAttribute("aria-hidden", visible ? "false" : "true");
}

function isPointInSellZone(clientX, clientY) {
  if (!elements.sellZone?.classList.contains("visible")) return false;
  const rect = elements.sellZone.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function markSellZoneTarget(clientX, clientY) {
  elements.sellZone?.classList.toggle("drag-over", isPointInSellZone(clientX, clientY));
}

function clearDragPreview() {
  if (dragPreviewElement && dragPreviewOrigin) {
    const { parent, nextSibling, className, styleAttribute } = dragPreviewOrigin;
    if (nextSibling?.parentNode === parent) {
      parent.insertBefore(dragPreviewElement, nextSibling);
    } else {
      parent.append(dragPreviewElement);
    }
    dragPreviewElement.className = className;
    if (styleAttribute === null) {
      dragPreviewElement.removeAttribute("style");
    } else {
      dragPreviewElement.setAttribute("style", styleAttribute);
    }
  }
  dragPreviewElement = null;
  dragPreviewOrigin = null;
}

function startDragPreview(sourceElement, clientX, clientY) {
  clearDragPreview();
  if (!sourceElement) return;

  const rect = sourceElement.getBoundingClientRect();
  const baseWidth = sourceElement.offsetWidth || rect.width || 1;
  const isEquipment = sourceElement.classList.contains("hero-equipment-slot");
  dragPreviewOrigin = {
    parent: sourceElement.parentNode,
    nextSibling: sourceElement.nextSibling,
    className: sourceElement.className,
    styleAttribute: sourceElement.getAttribute("style"),
  };
  sourceElement.classList.add(
    "drag-source-follow",
    isEquipment ? "equipment-follow" : "card-follow",
  );
  sourceElement.style.setProperty("--drag-scale", String(rect.width / baseWidth));
  document.body.append(sourceElement);
  dragPreviewElement = sourceElement;
  updateDragPreview(clientX, clientY);
}

function updateDragPreview(clientX, clientY) {
  if (!dragPreviewElement) return;
  dragPreviewElement.style.left = `${clientX}px`;
  dragPreviewElement.style.top = `${clientY}px`;
}

function showDragPreview() {
  dragPreviewElement?.classList.add("visible");
}

function markLineupDropTarget(clientX, clientY) {
  clearLineupDropState();
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return;
  const lineupIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(lineupIndex)) return;
  const card = state.shop[pointerDraggedShopIndex];
  const unit = state.lineup[lineupIndex];
  if (card?.category === "装备") {
    const canEquip = Boolean(unit && !getUnitEquipment(unit));
    target.classList.toggle("drop-target", canEquip);
    target.classList.toggle("drop-blocked", !canEquip);
    return;
  }
  if (card?.category === "计策") {
    const canUse = card.targetMode !== "unit" || Boolean(unit);
    target.classList.toggle("drop-target", canUse);
    target.classList.toggle("drop-blocked", !canUse);
    return;
  }
  const canPlace = unit === null;
  const canMerge = canMergeCardIntoUnit(card, unit);
  target.classList.toggle("drop-target", canPlace);
  target.classList.toggle("drop-merge", canMerge);
  target.classList.toggle("drop-blocked", !canPlace && !canMerge);
}

function markLineupEquipmentTarget(clientX, clientY, sourceIndex) {
  clearLineupDropState();
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return;
  const lineupIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(lineupIndex) || lineupIndex === sourceIndex) return;
  target.classList.add(state.lineup[lineupIndex] ? "drop-target" : "drop-blocked");
}

function beginLineupDragDirection(clientX) {
  lineupDragDirection = 0;
  lineupDragDirectionAnchorX = clientX;
}

function updateLineupDragDirection(clientX) {
  if (lineupDragDirectionAnchorX === null) {
    lineupDragDirectionAnchorX = clientX;
    return lineupDragDirection;
  }

  const horizontalDelta = clientX - lineupDragDirectionAnchorX;
  if (Math.abs(horizontalDelta) >= LINEUP_DRAG_DIRECTION_THRESHOLD) {
    lineupDragDirection = Math.sign(horizontalDelta);
    lineupDragDirectionAnchorX = clientX;
  }
  return lineupDragDirection;
}

function resetLineupDragDirection() {
  lineupDragDirection = 0;
  lineupDragDirectionAnchorX = null;
}

function findLineupInsertionGap(targetIndex, sourceIndex, direction) {
  for (
    let emptyIndex = targetIndex + direction;
    emptyIndex >= 0 && emptyIndex < LINEUP_SLOT_COUNT;
    emptyIndex += direction
  ) {
    if (emptyIndex === sourceIndex || state.lineup[emptyIndex] === null) {
      return emptyIndex;
    }
  }
  return null;
}

function getLineupDragIntent(
  clientX,
  clientY,
  sourceIndex,
  directionHint = lineupDragDirection,
) {
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return null;
  const targetIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(targetIndex) || targetIndex === sourceIndex) return null;
  const sourceUnit = state.lineup[sourceIndex];
  const targetUnit = state.lineup[targetIndex];
  if (!sourceUnit) return null;

  if (!targetUnit) {
    return { mode: "move", target, targetIndex };
  }

  let direction = directionHint;
  if (direction === 0) {
    const rect = target.getBoundingClientRect();
    const horizontalRatio =
      rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    direction =
      horizontalRatio <= LINEUP_INSERT_EDGE_RATIO
        ? -1
        : horizontalRatio >= 1 - LINEUP_INSERT_EDGE_RATIO
          ? 1
          : 0;
  }

  if (direction !== 0) {
    const emptyIndex = findLineupInsertionGap(
      targetIndex,
      sourceIndex,
      direction,
    );
    if (emptyIndex !== null) {
      return {
        mode: "insert",
        target,
        targetIndex,
        direction,
        emptyIndex,
      };
    }
  }

  if (sourceUnit.name === targetUnit.name) {
    return {
      mode: canMergeUnits(sourceUnit, targetUnit) ? "merge" : "blocked",
      target,
      targetIndex,
    };
  }

  return { mode: "swap", target, targetIndex };
}

function markLineupReorderTarget(clientX, clientY, sourceIndex) {
  clearLineupDropState();
  const intent = getLineupDragIntent(clientX, clientY, sourceIndex);
  if (!intent) return;

  if (intent.mode === "merge") {
    intent.target.classList.add("drop-merge");
    return;
  }
  if (intent.mode === "blocked") {
    intent.target.classList.add("drop-blocked");
    return;
  }

  intent.target.classList.add("drop-target");
  if (intent.mode !== "insert") return;

  const directionName = intent.direction < 0 ? "left" : "right";
  intent.target.classList.add(`drop-insert-${directionName}`);
  const slots = Array.from(document.querySelectorAll(".lineup-slot"));
  for (
    let shiftedIndex = intent.targetIndex;
    shiftedIndex !== intent.emptyIndex;
    shiftedIndex += intent.direction
  ) {
    slots[shiftedIndex]?.classList.add(`drop-shift-${directionName}`);
  }
  slots[intent.emptyIndex]?.classList.add("drop-insert-gap");
}

function insertLineupUnit(sourceIndex, targetIndex, direction, emptyIndex) {
  const sourceUnit = state.lineup[sourceIndex];
  if (
    !sourceUnit ||
    sourceIndex === targetIndex ||
    (direction !== -1 && direction !== 1) ||
    emptyIndex < 0 ||
    emptyIndex >= LINEUP_SLOT_COUNT ||
    (emptyIndex !== sourceIndex && state.lineup[emptyIndex] !== null)
  ) {
    return false;
  }

  state.lineup[sourceIndex] = null;
  for (
    let shiftedIndex = emptyIndex;
    shiftedIndex !== targetIndex;
    shiftedIndex -= direction
  ) {
    state.lineup[shiftedIndex] = state.lineup[shiftedIndex - direction];
  }
  state.lineup[targetIndex] = sourceUnit;
  addLog(
    `${sourceUnit.name} 插入 ${targetIndex + 1} 号阵容位，向${
      direction < 0 ? "左" : "右"
    }挤动至 ${emptyIndex + 1} 号空位。`,
  );
  render();
  return true;
}

function moveOrMergeLineupUnit(sourceIndex, targetIndex, intent = null) {
  if (sourceIndex === targetIndex) return;
  const sourceUnit = state.lineup[sourceIndex];
  const targetUnit = state.lineup[targetIndex];
  if (!sourceUnit) return;

  if (
    intent?.mode === "insert" &&
    insertLineupUnit(
      sourceIndex,
      targetIndex,
      intent.direction,
      intent.emptyIndex,
    )
  ) {
    return;
  }

  if (targetUnit?.name === sourceUnit.name) {
    if (!canMergeUnits(sourceUnit, targetUnit)) {
      notify(`${targetUnit.name} 合并后会超过 3 级上限。`);
      return;
    }
    const previousBondLevels = getShopBondLevelSnapshot();
    const gainedProgress = getUnitProgressValue(sourceUnit);
    const result = mergeUnitIntoTarget(sourceUnit, targetUnit);
    state.lineup[sourceIndex] = null;
    addLog(
      result.leveledUp
        ? `${sourceUnit.name} 合并到 ${targetIndex + 1} 号位，升级为 ${result.level} 级。`
        : `${sourceUnit.name} 合并到 ${targetIndex + 1} 号位，当前为 ${result.level} 级 ${result.experience} 经验。`,
    );
    if (result.leveledUp) {
      const queuedUpgradeAnimation = queueShopUpgradeAnimation(
        targetUnit,
        result.level,
        sourceUnit.name,
      );
      const queuedBondAnimation = resolveShopUpgradeBondEffects(
        targetUnit,
        result.previousLevel,
        result.level,
      );
      const deferReward = queuedUpgradeAnimation || queuedBondAnimation;
      queueUpgradeRewards(targetUnit, result.previousLevel, result.level, {
        deferFirstReward: deferReward,
      });
    }
    for (let point = 0; point < gainedProgress; point += 1) {
      dispatchShopEvent("experience:gain", {
        unit: targetUnit,
        amount: 1,
        sourceName: sourceUnit.name,
        sourceEffectId: "system.unit-merge",
      });
    }
    if (result.leveledUp) {
      dispatchShopEvent("unit:upgrade", {
        unit: targetUnit,
        previousLevel: result.previousLevel,
        level: result.level,
        sourceName: sourceUnit.name,
        sourceEffectId: "system.unit-merge",
      });
    }
    dispatchShopBondLevelChanges(previousBondLevels);
    render();
    return;
  }

  state.lineup[sourceIndex] = targetUnit;
  state.lineup[targetIndex] = sourceUnit;
  addLog(
    targetUnit
      ? `交换 ${sourceIndex + 1} 号与 ${targetIndex + 1} 号阵容位。`
      : `${sourceUnit.name} 移动到 ${targetIndex + 1} 号阵容位。`,
  );
  render();
}

function sellUnit(index) {
  if (state.phase !== "shop") return;
  const unit = state.lineup[index];
  if (!unit) return;
  const previousBondLevels = getShopBondLevelSnapshot();
  dispatchShopEvent("unit:sell", { unit, index });
  const salePrice = unit.level;
  state.gold = Math.min(GOLD_CAP, state.gold + salePrice);
  state.lineup[index] = null;
  dispatchShopBondLevelChanges(previousBondLevels);
  addLog(`出售 ${unit.name}，获得 ${salePrice} 金币。`);
  render();
}

function sellEquipment(index) {
  if (state.phase !== "shop") return;
  const unit = state.lineup[index];
  const equipment = getUnitEquipment(unit);
  if (!unit || !equipment) return;
  unit.directModifiers.equipment = null;
  syncUnitStats(unit);
  addLog(`出售 ${unit.name} 佩戴的 ${equipment.name}，不获得金币。`);
  render();
}

function cloneBattleUnit(unit, { side = "enemy", index = 0 } = {}) {
  const health = Number.isFinite(unit.health) ? unit.health : 1;
  const snapshotBonds =
    side === "player"
      ? getBaseUnitBonds(unit)
      : normalizeBondTags([
          unit.faction,
          ...(unit.extraFactions ?? []),
          ...(unit.tempExtraFactions ?? []),
        ]);
  return {
    id: `${side}-${unit.id ?? unit.name}-${index}`,
    sourceId: unit.id ?? null,
    name: unit.name,
    attack: Number.isFinite(unit.attack) ? unit.attack : 1,
    health,
    maxHealth: health,
    faction: unit.faction,
    extraFactions: snapshotBonds.filter((faction) => faction !== unit.faction),
    tempExtraFactions: [],
    usesBondDefinitionSnapshot: true,
    tier: unit.tier,
    side,
    lineupIndex: index,
    skillEffectIds: [
      ...(unit.skillEffectIds ?? (unit.effectId ? [unit.effectId] : [])),
    ],
    equipment: cloneDirectModifier(getUnitEquipment(unit)),
    statuses: cloneDirectModifier(unit.statuses ?? {}),
    level: unit.level ?? 1,
    experience: unit.experience ?? 0,
    copies: getUnitCopies(unit),
    bonusExperience: unit.bonusExperience ?? 0,
    isSummon: Boolean(unit.isSummon),
    skillDisabled: false,
    skillDisabledUntilExchange: null,
    consumedSnapshot: null,
    lastDamageSource: null,
  };
}

function hashBattleSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function getBattleSeed() {
  const lineupKey = state.lineup
    .map((unit) =>
      unit
        ? [
            unit.name,
            unit.attack,
            unit.health,
            unit.level,
            getUnitEquipment(unit)?.effectId ?? "",
            getEffectiveUnitBonds(unit).join(","),
          ].join(":")
        : "-",
    )
    .join("|");
  return hashBattleSeed(`${state.round}:${state.serial}:${lineupKey}`);
}

function getScheduledOpponentRound(round = state.round) {
  const scheduleEntry =
    state.opponentSchedule?.find((entry) => entry.round === round) ?? null;
  const poolEntry =
    state.opponentPool?.find((entry) => entry.key === scheduleEntry?.key) ?? null;
  const replayRound =
    poolEntry?.session?.rounds?.find((entry) => entry.round === round) ?? null;
  if (!scheduleEntry || !poolEntry || !replayRound) return null;
  return { scheduleEntry, poolEntry, replayRound };
}

function getReplayEquipment(equipmentSnapshot) {
  if (!equipmentSnapshot?.name) return null;
  const definition =
    CARD_POOLS.stratagem.find(
      (item) =>
        item.category === "装备" &&
        ((equipmentSnapshot.effectId && item.effectId === equipmentSnapshot.effectId) ||
          item.name === equipmentSnapshot.name),
    ) ?? {};
  return {
    ...equipmentSnapshot,
    ...definition,
    id: `enemy-replay-equipment-${definition.effectId ?? equipmentSnapshot.name}`,
    category: "装备",
  };
}

function createReplayEnemyBattleUnit(unitSnapshot, index) {
  const definition = CARD_POOLS.hero.find((hero) => hero.name === unitSnapshot.name) ?? {};
  const faction = unitSnapshot.faction ?? definition.faction ?? "无";
  const effectiveBonds = normalizeBondTags([
    ...(unitSnapshot.effectiveBonds ?? []),
    faction,
    ...(unitSnapshot.extraFactions ?? []),
    ...(unitSnapshot.temporaryExtraFactions ?? []),
  ]);
  const replayUnit = {
    ...definition,
    id: `enemy-replay-${state.round}-${unitSnapshot.slot ?? index + 1}`,
    name: unitSnapshot.name ?? definition.name ?? `回放武将${index + 1}`,
    attack: Number.isFinite(unitSnapshot.attack) ? unitSnapshot.attack : 1,
    health: Number.isFinite(unitSnapshot.health) ? unitSnapshot.health : 1,
    faction,
    extraFactions: effectiveBonds.filter((bond) => bond !== faction),
    tempExtraFactions: [],
    tier: unitSnapshot.tier ?? definition.tier ?? 0,
    level: unitSnapshot.level ?? 1,
    experience: unitSnapshot.experience ?? 0,
    copies: unitSnapshot.copies ?? 1,
    bonusExperience: unitSnapshot.bonusExperience ?? 0,
    skillEffectIds: [
      unitSnapshot.skillEffectId ?? definition.effectId,
    ].filter(Boolean),
    directModifiers: {
      equipment: getReplayEquipment(unitSnapshot.equipment),
    },
    statuses: {},
    isSummon: false,
  };
  return cloneBattleUnit(replayUnit, { side: "enemy", index });
}

function createCavalryEnemyBattleTeam() {
  const roundStat = state.round * PLAYER_DATA_TEST_ENEMY_STAT_MULTIPLIER;
  return Array.from({ length: PLAYER_DATA_TEST_ENEMY_COUNT }, (_, index) => {
    const cavalry = {
      id: `test-cavalry-${state.round}-${index + 1}`,
      name: "骑兵",
      attack: roundStat,
      health: roundStat,
      faction: "无",
      tier: 0,
      level: 1,
      experience: 0,
      copies: 1,
      bonusExperience: 0,
      skillEffectIds: [],
      equipment: null,
      statuses: {},
      isSummon: false,
    };
    return cloneBattleUnit(cavalry, { side: "enemy", index });
  });
}

function createEnemyBattleSetup() {
  const opponentRound = getScheduledOpponentRound();
  if (!opponentRound || !Array.isArray(opponentRound.replayRound.lineup)) {
    return {
      team: createCavalryEnemyBattleTeam(),
      lockedBonds: Object.fromEntries(BOND_FACTIONS.map((faction) => [faction, 0])),
      source: {
        type: "cavalry-fallback",
        round: state.round,
      },
    };
  }

  const { scheduleEntry, poolEntry, replayRound } = opponentRound;
  const team = replayRound.lineup
    .filter((unit) => unit && !unit.empty && unit.name)
    .sort((left, right) => (left.slot ?? 0) - (right.slot ?? 0))
    .reverse()
    .map(createReplayEnemyBattleUnit);
  const lockedBonds = Object.fromEntries(
    BOND_FACTIONS.map((faction) => [
      faction,
      replayRound.bonds?.find((entry) => entry.faction === faction)?.level ?? 0,
    ]),
  );
  return {
    team,
    lockedBonds,
    source: {
      type: "opponent-pool",
      poolKey: poolEntry.key,
      label: poolEntry.label,
      fileName: poolEntry.fileName,
      sessionId: poolEntry.session.id,
      poolSize: state.opponentPool.length,
      round: replayRound.round,
      recordedAt: replayRound.recordedAt ?? null,
      scheduleEntry: { ...scheduleEntry },
    },
  };
}

function getLockedPlayerBondLevels() {
  return Object.fromEntries(getBondEntries().map((entry) => [entry.faction, entry.level]));
}

function createBattleRuntime(player, enemy, { seed, lockedBonds }) {
  const runtime = {
    teams: { player, enemy },
    battleStartPositions: new Map([
      ...player.map((unit, index) => [unit.id, { side: "player", index }]),
      ...enemy.map((unit, index) => [unit.id, { side: "enemy", index }]),
    ]),
    seed,
    random: createSeededRandom(seed),
    lockedBonds,
    phase: "battle:start",
    queue: [],
    processing: false,
    nextEventId: 1,
    nextChainId: 1,
    chainSteps: new Map(),
    abortedChains: new Set(),
    resolvedDeathIds: new Set(),
    deferredDeathIds: new Set(),
    bondCounters: {
      player: { 魏阵亡: 0 },
      enemy: { 魏阵亡: 0 },
    },
    nextSummonId: 1,
    currentEvent: null,
    currentCandidate: null,
    currentExchange: null,
    currentAttackers: null,
    log: [],
    structuredLog: [],
    presentationTimeline: [],
    presentationSequence: 1,
    presentationSnapshot: null,
  };
  runtime.presentationSnapshot = getBattlePresentationSnapshot(runtime);
  return runtime;
}

function recordBattleLog(runtime, type, message, details = {}) {
  const currentEvent = runtime.currentEvent;
  const currentCandidate = runtime.currentCandidate;
  const entry = {
    type,
    message,
    phase: details.phase ?? runtime.phase,
    exchange: details.exchange ?? runtime.currentExchange ?? null,
    eventId: details.eventId ?? currentEvent?.id ?? null,
    chainId: details.chainId ?? currentEvent?.chainId ?? null,
    parentEventId: details.parentEventId ?? currentEvent?.parentEventId ?? null,
    eventType: details.eventType ?? currentEvent?.type ?? null,
    effectId:
      details.effectId ??
      details.sourceEffectId ??
      currentCandidate?.effectId ??
      null,
    effectGroupId: details.effectGroupId ?? currentCandidate?.id ?? null,
    ...details,
  };
  runtime.log.push(message);
  runtime.structuredLog.push(entry);
  return entry;
}

function getBattlePresentationSnapshot(runtime) {
  return {
    exchange: runtime.currentExchange ?? 0,
    player: runtime.teams.player.map(getBattleUnitSnapshot),
    enemy: runtime.teams.enemy.map(getBattleUnitSnapshot),
    bondCounters: cloneDirectModifier(runtime.bondCounters ?? {}),
  };
}

function getBattlePresentationUnitMap(snapshot) {
  return new Map(
    ["player", "enemy"].flatMap((side) =>
      (snapshot?.[side] ?? []).map((unit, index) => [
        unit.id,
        { unit, side, index },
      ]),
    ),
  );
}

function areBattlePresentationValuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (
    (left && typeof left === "object") ||
    (right && typeof right === "object")
  ) {
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
  }
  return false;
}

function diffBattlePresentationSnapshots(beforeSnapshot, afterSnapshot) {
  const beforeUnits = getBattlePresentationUnitMap(beforeSnapshot);
  const afterUnits = getBattlePresentationUnitMap(afterSnapshot);
  const changes = [];
  const unitFields = [
    "attack",
    "health",
    "maxHealth",
    "level",
    "experience",
    "bonusExperience",
    "copies",
    "statuses",
    "equipment",
    "skillDisabled",
    "skillDisabledUntilExchange",
  ];

  new Set([...beforeUnits.keys(), ...afterUnits.keys()]).forEach((unitId) => {
    const before = beforeUnits.get(unitId) ?? null;
    const after = afterUnits.get(unitId) ?? null;
    if (!before || !after) {
      changes.push({
        unitId,
        unitName: after?.unit.name ?? before?.unit.name ?? "",
        side: after?.side ?? before?.side ?? null,
        field: "presence",
        before: before ? before.side : null,
        after: after ? after.side : null,
      });
      return;
    }
    unitFields.forEach((field) => {
      const beforeValue = before.unit[field] ?? null;
      const afterValue = after.unit[field] ?? null;
      if (areBattlePresentationValuesEqual(beforeValue, afterValue)) return;
      changes.push({
        unitId,
        unitName: after.unit.name,
        side: after.side,
        field,
        before: beforeValue,
        after: afterValue,
        delta:
          Number.isFinite(beforeValue) && Number.isFinite(afterValue)
            ? afterValue - beforeValue
            : null,
      });
    });
  });

  ["player", "enemy"].forEach((side) => {
    const beforeOrder = (beforeSnapshot?.[side] ?? []).map((unit) => unit.id);
    const afterOrder = (afterSnapshot?.[side] ?? []).map((unit) => unit.id);
    if (areBattlePresentationValuesEqual(beforeOrder, afterOrder)) return;
    changes.push({
      unitId: null,
      unitName: "",
      side,
      field: "teamOrder",
      before: beforeOrder,
      after: afterOrder,
    });
  });
  if (
    !areBattlePresentationValuesEqual(
      beforeSnapshot?.bondCounters ?? {},
      afterSnapshot?.bondCounters ?? {},
    )
  ) {
    changes.push({
      unitId: null,
      unitName: "",
      side: null,
      field: "bondCounters",
      before: cloneDirectModifier(beforeSnapshot?.bondCounters ?? {}),
      after: cloneDirectModifier(afterSnapshot?.bondCounters ?? {}),
    });
  }
  return changes;
}

function recordBattlePresentationStep(
  runtime,
  {
    kind = "effect",
    title = "效果结算",
    description = "",
    entries = [],
    phase = null,
    exchange = null,
    eventType = null,
    effectId = null,
    effectName = "",
    sourceIds = [],
    targetIds = [],
    deathIds = [],
    actorIds = [],
    cues = [],
    simultaneous = false,
    resolvedAttack = null,
    durationMs = null,
  } = {},
) {
  const beforeSnapshot =
    runtime.presentationSnapshot ?? getBattlePresentationSnapshot(runtime);
  const snapshot = getBattlePresentationSnapshot(runtime);
  const currentEvent = runtime.currentEvent;
  const currentCandidate = runtime.currentCandidate;
  const step = {
    id: `battle-presentation-${runtime.presentationSequence}`,
    sequence: runtime.presentationSequence,
    kind,
    title,
    description,
    phase: phase ?? runtime.phase,
    exchange: exchange ?? runtime.currentExchange ?? 0,
    timingWindow: eventType ?? currentEvent?.type ?? null,
    eventId: currentEvent?.id ?? null,
    chainId: currentEvent?.chainId ?? null,
    parentEventId: currentEvent?.parentEventId ?? null,
    effectGroupId: currentCandidate?.id ?? null,
    effectId: effectId ?? currentCandidate?.effectId ?? null,
    effectName: effectName || currentCandidate?.sourceName || "",
    sourceIds: [...new Set(sourceIds.filter(Boolean))],
    targetIds: [...new Set(targetIds.filter(Boolean))],
    deathIds: [...new Set(deathIds.filter(Boolean))],
    actorIds: [...new Set(actorIds.filter(Boolean))],
    cues: cues.filter((cue) => cue?.text && cue?.unitId),
    simultaneous,
    resolvedAttack:
      resolvedAttack ??
      currentCandidate?.resolvedAttack ??
      currentCandidate?.owner?.attack ??
      null,
    durationMs,
    entries,
    beforeSnapshot,
    snapshot,
    changes: diffBattlePresentationSnapshots(beforeSnapshot, snapshot),
  };
  runtime.presentationSequence += 1;
  runtime.presentationSnapshot = snapshot;
  runtime.presentationTimeline.push(step);
  entries.forEach((entry) => {
    if (entry) entry.presentationStepId = step.id;
  });
  return step;
}

function recordBattlePresentationLog(
  runtime,
  type,
  message,
  details = {},
  presentation = {},
) {
  const entry = recordBattleLog(runtime, type, message, details);
  recordBattlePresentationStep(runtime, {
    ...presentation,
    entries: [entry],
  });
  return entry;
}

function isBattleUnitActive(runtime, unit) {
  if (!unit || unit.health <= 0) return false;
  return runtime.teams[unit.side]?.includes(unit) ?? false;
}

function getBattleUnitBonds(unit) {
  if (!unit) return [];
  return normalizeBondTags([
    unit.faction,
    ...(unit.extraFactions ?? []),
    ...(unit.tempExtraFactions ?? []),
  ]);
}

function pickBattleRandomUnits(runtime, units, count) {
  const pool = [...units];
  const selected = [];
  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(runtime.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function addBattleUnitStats(unit, attack, health) {
  if (!unit) return null;
  const before = {
    attack: unit.attack,
    health: unit.health,
    maxHealth: unit.maxHealth,
  };
  unit.attack = Math.min(50, Math.max(1, unit.attack + attack));
  unit.maxHealth = Math.min(50, Math.max(1, unit.maxHealth + health));
  unit.health = Math.min(unit.maxHealth, unit.health + health);
  return {
    before,
    after: {
      attack: unit.attack,
      health: unit.health,
      maxHealth: unit.maxHealth,
    },
    attackDelta: unit.attack - before.attack,
    healthDelta: unit.health - before.health,
    maxHealthDelta: unit.maxHealth - before.maxHealth,
  };
}

function applyBattleUnitStatBonus(runtime, unit, attack, health, sourceName = "") {
  const result = addBattleUnitStats(unit, attack, health);
  if (!result) return null;
  const attackDelta = result.attackDelta;
  const healthDelta = result.healthDelta;
  const maxHealthDelta = result.maxHealthDelta;
  if (attackDelta === 0 && healthDelta === 0 && maxHealthDelta === 0) {
    return result;
  }
  const source = runtime.currentCandidate?.owner ?? null;
  const attackText =
    attackDelta === 0 ? "" : `攻击${attackDelta > 0 ? "+" : ""}${attackDelta}`;
  const healthText =
    maxHealthDelta === 0
      ? ""
      : `生命${maxHealthDelta > 0 ? "+" : ""}${maxHealthDelta}`;
  const changeText = [attackText, healthText].filter(Boolean).join("、");
  const cueText =
    attackDelta !== 0 && maxHealthDelta !== 0
      ? `${attackDelta > 0 ? "+" : ""}${attackDelta}/${
          maxHealthDelta > 0 ? "+" : ""
        }${maxHealthDelta}`
      : changeText;
  recordBattlePresentationLog(
    runtime,
    "stat",
    `${sourceName || "属性效果"}：${unit.name}${changeText}，当前 ${unit.attack}/${
      unit.health
    }。`,
    {
      sourceName: sourceName || runtime.currentCandidate?.sourceName || "属性效果",
      sourceUnitId: source?.id ?? null,
      sourceSide: source?.side ?? runtime.currentCandidate?.ownerSide ?? null,
      targetUnitId: unit.id,
      targetName: unit.name,
      targetSide: unit.side,
      attackBefore: result.before.attack,
      attackAfter: result.after.attack,
      healthBefore: result.before.health,
      healthAfter: result.after.health,
      maxHealthBefore: result.before.maxHealth,
      maxHealthAfter: result.after.maxHealth,
      attackDelta,
      healthDelta,
      maxHealthDelta,
    },
    {
      kind: "stat",
      title: `${unit.name}属性变化`,
      effectName: sourceName,
      sourceIds: [source?.id],
      targetIds: [unit.id],
      cues: [
        {
          unitId: unit.id,
          text: cueText,
          tone: attackDelta >= 0 && maxHealthDelta >= 0 ? "buff" : "debuff",
        },
      ],
      durationMs: 1450,
    },
  );
  return result;
}

function getSummonedUnitFaction(summonerOrFaction) {
  const faction =
    typeof summonerOrFaction === "string" ? summonerOrFaction : summonerOrFaction?.faction;
  return BOND_FACTIONS.includes(faction) ? faction : "无";
}

function createHeavyCavalry(runtime, side) {
  const summonId = runtime.nextSummonId;
  runtime.nextSummonId += 1;
  return {
    id: `${side}-heavy-cavalry-${summonId}`,
    sourceId: null,
    name: "重骑兵",
    attack: 5,
    health: 5,
    maxHealth: 5,
    faction: "魏",
    extraFactions: [],
    tempExtraFactions: [],
    tier: 0,
    side,
    lineupIndex: runtime.teams[side].length,
    skillEffectIds: ["summon.heavy-cavalry-growth"],
    equipment: null,
    statuses: {},
    level: 1,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[1],
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
  };
}

function summonHeavyCavalry(runtime, side, count, sourceEffectId) {
  for (let index = 0; index < count; index += 1) {
    if (!hasBattleSummonSlot(runtime, side)) {
      recordBattleSummonFailure(runtime, side, "魏武遗风", sourceEffectId);
      break;
    }
    const cavalry = createHeavyCavalry(runtime, side);
    addBattleUnitToTeamFront(runtime, side, cavalry);
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${side === "player" ? "我方" : "敌方"}在最前方召唤重骑兵 ${cavalry.attack}/${cavalry.health}。`,
      {
        unitId: cavalry.id,
        unitName: cavalry.name,
        unitSide: side,
        side,
        sourceEffectId,
      },
      {
        kind: "summon",
        title: `${cavalry.name}加入战场`,
        effectName: BOND_RULES.魏.label,
        targetIds: [cavalry.id],
        cues: [{ unitId: cavalry.id, text: "召唤", tone: "buff" }],
        durationMs: 1550,
      },
    );
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: cavalry,
      side,
      sourceEffectId,
    });
  }
}

function createCavalry(
  runtime,
  side,
  attack = 1,
  health = 1,
  faction = "无",
  level = 1,
) {
  const summonId = runtime.nextSummonId;
  runtime.nextSummonId += 1;
  return {
    id: `${side}-cavalry-${summonId}`,
    sourceId: null,
    name: "骑兵",
    attack,
    health,
    maxHealth: health,
    faction: getSummonedUnitFaction(faction),
    extraFactions: [],
    tempExtraFactions: [],
    tier: 0,
    side,
    lineupIndex: runtime.teams[side].length,
    skillEffectIds: [],
    equipment: null,
    statuses: {},
    level,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[level] ?? UNIT_LEVEL_COPY_THRESHOLDS[1],
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
  };
}

function summonCavalry(
  runtime,
  side,
  count,
  {
    attack = 1,
    health = 1,
    sourceEffectId = null,
    sourceName = "",
    summoner = null,
    target = null,
    position = "tail",
    level = 1,
  } = {},
) {
  const summoned = [];
  let summonAnchor = target;
  for (let index = 0; index < count; index += 1) {
    if (!hasBattleSummonSlot(runtime, side)) {
      recordBattleSummonFailure(runtime, side, sourceName || "召唤效果", sourceEffectId);
      break;
    }
    const cavalry = createCavalry(runtime, side, attack, health, summoner, level);
    const inserted =
      position === "target-front"
        ? insertBattleUnitInFrontOfTarget(runtime, summonAnchor, cavalry)
        : position === "front"
          ? (addBattleUnitToTeamFront(runtime, side, cavalry), true)
          : (addBattleUnitToTeamTail(runtime, side, cavalry), true);
    if (!inserted) {
      recordBattleSummonFailure(runtime, side, sourceName || "召唤效果", sourceEffectId);
      break;
    }
    summonAnchor = cavalry;
    summoned.push(cavalry);
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${sourceName}：${side === "player" ? "我方" : "敌方"}${
        position === "target-front"
          ? "在目标身前"
          : position === "front"
            ? "在最前方"
            : "在队尾"
      }召唤骑兵 ${cavalry.attack}/${cavalry.health}。`,
      {
        unitId: cavalry.id,
        unitName: cavalry.name,
        unitSide: side,
        side,
        sourceEffectId,
        sourceName,
      },
      {
        kind: "summon",
        title: `${cavalry.name}加入战场`,
        effectName: sourceName,
        sourceIds: [summoner?.id],
        targetIds: [cavalry.id],
        cues: [{ unitId: cavalry.id, text: "召唤", tone: "buff" }],
        durationMs: 1550,
      },
    );
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: cavalry,
      side,
      sourceEffectId,
    });
  }
  return summoned;
}

function getBattleFrontUnit(team, side) {
  return side === "player" ? team.at(-1) : team[0];
}

function addBattleUnitToTeamTail(runtime, side, unit) {
  if (side === "player") {
    runtime.teams[side].unshift(unit);
    return;
  }
  runtime.teams[side].push(unit);
}

function hasBattleSummonSlot(runtime, side) {
  return runtime.teams[side].length < LINEUP_SLOT_COUNT;
}

function recordBattleSummonFailure(runtime, side, sourceName, sourceEffectId = null) {
  recordBattlePresentationLog(
    runtime,
    "summon",
    `${sourceName}：${side === "player" ? "我方" : "敌方"}阵容没有空位，召唤失败。`,
    { side, sourceName, sourceEffectId, failed: true },
    {
      kind: "summon-failed",
      title: `${sourceName}召唤失败`,
      effectName: sourceName,
      durationMs: 1150,
    },
  );
}

function captureBattleDeathPosition(runtime, unit) {
  const team = runtime.teams[unit.side];
  const index = team.indexOf(unit);
  if (index < 0) return null;
  return {
    side: unit.side,
    frontRank: unit.side === "player" ? team.length - 1 - index : index,
  };
}

function insertBattleUnitAtDeathPosition(runtime, side, unit, deathPosition) {
  if (!hasBattleSummonSlot(runtime, side)) return false;
  const fromFront = getBattleUnitsFromFront(runtime, side);
  const frontRank = Math.max(
    0,
    Math.min(deathPosition?.frontRank ?? 0, fromFront.length),
  );
  const unitBehindInsertion = fromFront[frontRank] ?? null;
  if (!unitBehindInsertion) {
    addBattleUnitToTeamTail(runtime, side, unit);
    return true;
  }
  const team = runtime.teams[side];
  const anchorIndex = team.indexOf(unitBehindInsertion);
  const insertIndex = side === "player" ? anchorIndex + 1 : anchorIndex;
  team.splice(insertIndex, 0, unit);
  return true;
}

function insertBattleUnitInFrontOfTarget(runtime, target, unit, deathPosition = null) {
  if (!target || !hasBattleSummonSlot(runtime, unit.side)) return false;
  const team = runtime.teams[unit.side];
  const targetIndex = team.indexOf(target);
  if (targetIndex < 0) {
    return insertBattleUnitAtDeathPosition(runtime, unit.side, unit, deathPosition);
  }
  const insertIndex = unit.side === "player" ? targetIndex + 1 : targetIndex;
  team.splice(insertIndex, 0, unit);
  return true;
}

function resolveWeiBondDeath(runtime, candidate, event) {
  const unit = event.payload.unit;
  const side = candidate.ownerSide;
  const level = runtime.lockedBonds[side]?.魏 ?? 0;
  if (
    level <= 0 ||
    !unit ||
    unit.side !== side ||
    !getBattleUnitBonds(unit).includes("魏")
  ) {
    return;
  }

  const counter = runtime.bondCounters[side];
  counter.魏阵亡 += 1;
  const summonProgress = ((counter.魏阵亡 - 1) % 4) + 1;
  const summonName = level >= 3 ? "重骑兵" : "骑兵";
  recordBattlePresentationLog(
    runtime,
    "bond",
    `${BOND_RULES.魏.label} LV${level}：${summonName}召唤进度 ${summonProgress}/4（本场累计 ${counter.魏阵亡} 名魏羁绊武将阵亡）。`,
    {
      faction: "魏",
      level,
      ownerSide: side,
      deathCount: counter.魏阵亡,
      summonProgress,
      summonThreshold: 4,
      summonName,
    },
    {
      kind: "counter",
      title: `${summonName}召唤进度 ${summonProgress}/4`,
      effectId: candidate.effectId,
      effectName: `${BOND_RULES.魏.label} LV${level}`,
      durationMs: 1250,
    },
  );
  if (counter.魏阵亡 % 4 === 0) {
    const summonCount = level % 2 === 0 ? 2 : 1;
    recordBattleLog(
      runtime,
      "bond",
      `${BOND_RULES.魏.label}累计 ${counter.魏阵亡} 名魏羁绊武将阵亡，在己方最前方召唤 ${summonCount} 名${summonName}。`,
      { faction: "魏", level, deathCount: counter.魏阵亡, summonCount, summonName },
    );
    if (level >= 3) {
      summonHeavyCavalry(runtime, side, summonCount, candidate.effectId);
    } else {
      summonCavalry(runtime, side, summonCount, {
        attack: 2,
        health: 1,
        sourceEffectId: candidate.effectId,
        sourceName: BOND_RULES.魏.label,
        summoner: "魏",
        position: "front",
      });
    }
  }
}

function resolveShuBattleUpgrade(runtime, candidate, event) {
  const unit = event.payload.unit;
  const side = candidate.ownerSide;
  const level = runtime.lockedBonds[side]?.蜀 ?? 0;
  if (
    level <= 0 ||
    !unit ||
    unit.side !== side ||
    !getBattleUnitBonds(unit).includes("蜀")
  ) {
    return;
  }
  const statGain = level >= 4 ? 2 : level >= 3 ? 1 : level;
  const targets = level >= 3
    ? runtime.teams[side].filter((target) => target.health > 0)
    : [unit];
  targets.forEach((target) =>
    applyBattleUnitStatBonus(
      runtime,
      target,
      statGain,
      statGain,
      `${BOND_RULES.蜀.label} LV${level}`,
    ),
  );
  recordBattleLog(
    runtime,
    "bond",
    `${BOND_RULES.蜀.label} LV${level}：${unit.name}升级，${
      level >= 3 ? "全军" : unit.name
    }获得 +${statGain}/+${statGain}。`,
    { faction: "蜀", level, unitId: unit.id, affectedUnitIds: targets.map((target) => target.id) },
  );
}

function getWuOpeningTargets(runtime, side, level) {
  const opposingSide = side === "player" ? "enemy" : "player";
  const enemies = getBattleUnitsFromFront(runtime, opposingSide);
  if (level >= 4) return enemies;
  if (level === 3) return enemies.slice(-4);
  if (level === 2) return enemies.slice(-3);
  return pickBattleRandomUnits(runtime, enemies, 2);
}

function applyNegativeStatus(
  runtime,
  target,
  statusId,
  { ownerSide, summonFaction = null, sourceEffectId, sourceName },
) {
  if (!target || target.health <= 0) return false;
  target.statuses ??= {};
  if (target.statuses.unparalleled) {
    recordBattlePresentationLog(
      runtime,
      "status",
      `${target.name}拥有无双，免疫${STATUS_LABELS[statusId] ?? statusId}。`,
      { targetUnitId: target.id, statusId, immune: true },
      {
        kind: "status",
        title: `${target.name}免疫负面状态`,
        effectName: STATUS_LABELS[statusId] ?? statusId,
        targetIds: [target.id],
        cues: [
          {
            unitId: target.id,
            text: `免疫${STATUS_LABELS[statusId] ?? statusId}`,
            tone: "status",
          },
        ],
        durationMs: 1250,
      },
    );
    return false;
  }
  const existingBurn = target.statuses.burn ?? null;
  const appliedStatus = {
    ownerSide,
    summonFaction,
    sourceEffectId,
    sourceName,
  };
  let preserveExistingBurn = false;

  if (existingBurn) {
    const burnOwnerSide = existingBurn.ownerSide;
    const wuLevel = runtime.lockedBonds[burnOwnerSide]?.吴 ?? 0;
    const igniteDamage = wuLevel >= 3 ? 7 : 5;
    const virtualSource = {
      id: `${burnOwnerSide ?? "neutral"}-burn-status`,
      name: "引燃",
      side: burnOwnerSide,
    };
    const damage = dealBattleDamage(runtime, {
      source: virtualSource,
      target,
      amount: igniteDamage,
      type: "true",
      sourceEffectId: "status.burn-ignite",
      extraPayload: { statusId: "ignite" },
    });
    preserveExistingBurn = wuLevel >= 4;
    recordBattleLog(
      runtime,
      "status",
      `${target.name}被引燃，受到 ${damage?.finalAmount ?? 0} 点真实伤害${
        preserveExistingBurn ? "，原灼烧保留" : "，原灼烧清除"
      }。`,
      { targetUnitId: target.id, damage, wuLevel },
    );
    if (target.health <= 0) return true;
  }

  if (preserveExistingBurn) {
    target.statuses = { burn: existingBurn };
  } else {
    target.statuses = { [statusId]: appliedStatus };
  }
  recordBattlePresentationLog(
    runtime,
    "status",
    `${sourceName}：${target.side === "player" ? "我方" : "敌方"} ${
      target.name
    }获得${STATUS_LABELS[statusId] ?? statusId}。`,
    {
      targetUnitId: target.id,
      targetName: target.name,
      targetSide: target.side,
      statusId,
      statusName: STATUS_LABELS[statusId] ?? statusId,
      ownerSide,
      sourceEffectId,
      sourceName,
      sourceSide: ownerSide,
    },
    {
      kind: "status",
      title: `${target.name}获得${STATUS_LABELS[statusId] ?? statusId}`,
      effectName: sourceName,
      sourceIds: [runtime.currentCandidate?.owner?.id],
      targetIds: [target.id],
      cues: [
        {
          unitId: target.id,
          text: STATUS_LABELS[statusId] ?? statusId,
          tone: "status",
        },
      ],
      durationMs: 1450,
    },
  );
  resolveImmediateBattleEvent(runtime, "status:apply", {
    target,
    statusId,
    ownerSide,
    sourceEffectId,
    sourceName,
  });
  return true;
}

function resolveWuOpeningBurn(runtime, candidate) {
  const side = candidate.ownerSide;
  const level = runtime.lockedBonds[side]?.吴 ?? 0;
  if (level <= 0) return;
  const targets = getWuOpeningTargets(runtime, side, level);
  targets.forEach((target) =>
    applyNegativeStatus(runtime, target, "burn", {
      ownerSide: side,
      sourceEffectId: candidate.effectId,
      sourceName: `${BOND_RULES.吴.label} LV${level}`,
    }),
  );
  recordBattleLog(
    runtime,
    "bond",
    `${BOND_RULES.吴.label} LV${level}：战斗开始时使 ${targets.length} 名敌军获得灼烧。`,
    { faction: "吴", level, targetUnitIds: targets.map((target) => target.id) },
  );
}

function resolveBurnTick(runtime, event) {
  const burnedUnits = Object.values(runtime.teams)
    .flat()
    .filter((unit) => unit.health > 0 && unit.statuses?.burn);
  if (burnedUnits.length === 0) return;

  const resolvedDamages = burnedUnits.map((target) => {
    const burn = target.statuses.burn;
    const virtualSource = {
      id: `${burn.ownerSide ?? "neutral"}-burn-status`,
      name: burn.sourceName || STATUS_LABELS.burn,
      side: burn.ownerSide,
    };
    return resolveBattleDamage(runtime, {
      source: virtualSource,
      target,
      amount: 1,
      type: "true",
      sourceEffectId: "status.burn-tick",
    });
  });
  const committedDamages = resolvedDamages
    .map((damage) =>
      commitResolvedBattleDamage(runtime, damage, {
        extraPayload: { statusId: "burn" },
        exchange: event.payload.exchange,
      }),
    )
    .filter(Boolean);
  recordBattleLog(
    runtime,
    "status",
    `第${event.payload.exchange}次交锋后，灼烧结算 1 次：${committedDamages
      .map((damage) => `${damage.target.name}-${damage.finalAmount}`)
      .join("，")}。`,
    {
      exchange: event.payload.exchange,
      targetUnitIds: committedDamages.map((damage) => damage.target.id),
    },
  );
}

function resolveBattleUnitDeath(
  runtime,
  unit,
  exchange,
  {
    deathPosition = captureBattleDeathPosition(runtime, unit),
    killer = unit?.lastDamageSource ?? null,
    sourceEffectId = unit?.lastDamageEffectId ?? null,
    consumed = false,
  } = {},
) {
  if (!unit || unit.health > 0 || runtime.resolvedDeathIds.has(unit.id)) {
    return false;
  }
  runtime.resolvedDeathIds.add(unit.id);
  unit.deathPosition = deathPosition;
  recordBattlePresentationLog(
    runtime,
    "death",
    `${unit.side === "player" ? "我方" : "敌方"} ${unit.name}${
      consumed ? "被吞噬并视为" : ""
    }阵亡。`,
    {
      unitId: unit.id,
      unitName: unit.name,
      unitSide: unit.side,
      exchange,
      consumed,
      killerUnitId: killer?.id ?? null,
      sourceEffectId,
    },
    {
      kind: consumed ? "consume" : "death",
      title: consumed ? `${unit.name}被吞噬` : `${unit.name}阵亡`,
      effectId: sourceEffectId,
      sourceIds: [killer?.id],
      targetIds: [unit.id],
      deathIds: [unit.id],
      cues: [
        {
          unitId: unit.id,
          text: consumed ? "被吞噬" : "阵亡",
          tone: "death",
        },
      ],
      durationMs: 1550,
    },
  );
  resolveImmediateBattleEvent(runtime, "unit:death", {
    unit,
    killer,
    sourceEffectId,
    consumed,
    exchange,
    deathPosition,
  });
  const team = runtime.teams[unit.side];
  const index = team.indexOf(unit);
  if (index >= 0) {
    team.splice(index, 1);
    recordBattlePresentationLog(
      runtime,
      "leave",
      `${unit.side === "player" ? "我方" : "敌方"} ${unit.name}离开战场，队列前移。`,
      {
        unitId: unit.id,
        unitName: unit.name,
        unitSide: unit.side,
        exchange,
      },
      {
        kind: "leave",
        title: `${unit.name}离场`,
        targetIds: [unit.id],
        durationMs: 850,
      },
    );
  }
  return true;
}

function resolveAllBattleDeaths(runtime, exchange) {
  let resolvedCount = 0;
  const deathPositions = new Map();
  ["player", "enemy"].forEach((side) => {
    runtime.teams[side].forEach((unit) => {
      if (
        unit.health > 0 ||
        runtime.resolvedDeathIds.has(unit.id) ||
        runtime.deferredDeathIds.has(unit.id)
      ) {
        return;
      }
      deathPositions.set(unit.id, captureBattleDeathPosition(runtime, unit));
    });
  });
  ["player", "enemy"].forEach((side) => {
    const team = runtime.teams[side];
    [...team].forEach((unit) => {
      if (
        unit.health > 0 ||
        runtime.resolvedDeathIds.has(unit.id) ||
        runtime.deferredDeathIds.has(unit.id)
      ) {
        return;
      }
      const deathPosition = deathPositions.get(unit.id) ?? captureBattleDeathPosition(runtime, unit);
      if (resolveBattleUnitDeath(runtime, unit, exchange, { deathPosition })) {
        resolvedCount += 1;
      }
    });
  });
  return resolvedCount;
}

function createBattleEvent(runtime, type, payload = {}, parentEvent = null) {
  const eventId = `battle-event-${runtime.nextEventId}`;
  runtime.nextEventId += 1;
  const chainId = parentEvent?.chainId ?? `battle-chain-${runtime.nextChainId++}`;
  return {
    id: eventId,
    chainId,
    parentEventId: parentEvent?.id ?? null,
    type,
    payload,
    phase: runtime.phase,
  };
}

function dispatchBattleEvent(runtime, type, payload = {}, parentEvent = runtime.currentEvent) {
  const event = createBattleEvent(runtime, type, payload, parentEvent);
  runtime.queue.push(event);
  processBattleEventQueue(runtime);
  return event;
}

function resolveImmediateBattleEvent(
  runtime,
  type,
  payload = {},
  parentEvent = runtime.currentEvent,
) {
  const event = createBattleEvent(runtime, type, payload, parentEvent);
  const stepCount = (runtime.chainSteps.get(event.chainId) ?? 0) + 1;
  runtime.chainSteps.set(event.chainId, stepCount);
  if (stepCount > MAX_EFFECT_CHAIN_STEPS) {
    runtime.abortedChains.add(event.chainId);
    recordBattleLog(
      runtime,
      "error",
      `事件链 ${event.chainId} 超过 ${MAX_EFFECT_CHAIN_STEPS} 步，已停止后续结算。`,
      { eventId: event.id, chainId: event.chainId },
    );
    return event;
  }

  const previousEvent = runtime.currentEvent;
  runtime.currentEvent = event;
  runtime.structuredLog.push({
    type: "event",
    eventId: event.id,
    chainId: event.chainId,
    parentEventId: event.parentEventId,
    eventType: event.type,
    phase: event.phase,
  });
  resolveBattleEvent(runtime, event);
  runtime.currentEvent = previousEvent;
  return event;
}

function processBattleEventQueue(runtime) {
  if (runtime.processing) return;
  runtime.processing = true;
  while (runtime.queue.length > 0) {
    const event = runtime.queue.shift();
    if (runtime.abortedChains.has(event.chainId)) continue;
    const stepCount = (runtime.chainSteps.get(event.chainId) ?? 0) + 1;
    runtime.chainSteps.set(event.chainId, stepCount);
    if (stepCount > MAX_EFFECT_CHAIN_STEPS) {
      recordBattleLog(
        runtime,
        "error",
        `事件链 ${event.chainId} 超过 ${MAX_EFFECT_CHAIN_STEPS} 步，已停止后续结算。`,
        { eventId: event.id, chainId: event.chainId },
      );
      runtime.abortedChains.add(event.chainId);
      runtime.queue = runtime.queue.filter((queued) => queued.chainId !== event.chainId);
      continue;
    }

    runtime.currentEvent = event;
    runtime.structuredLog.push({
      type: "event",
      eventId: event.id,
      chainId: event.chainId,
      parentEventId: event.parentEventId,
      eventType: event.type,
      phase: event.phase,
    });
    resolveBattleEvent(runtime, event);
  }
  runtime.currentEvent = null;
  runtime.processing = false;
}

function collectBattleEffectCandidates(runtime, event) {
  const candidates = [];
  let sequence = 0;
  const addCandidate = ({ effectId, owner = null, ownerSide = null, sourceName = "" }) => {
    const definition = getEffectDefinition(effectId);
    const triggers = definition?.triggers ?? [definition?.trigger];
    if (!definition || !triggers.includes(event.type)) return;
    candidates.push({
      id: `${event.id}:${effectId}:${sequence}`,
      sequence,
      effectId,
      definition,
      owner,
      ownerSide: ownerSide ?? owner?.side ?? null,
      sourceName,
      battleStartLocked:
        event.type === "battle:start" &&
        definition.sourceType === "hero" &&
        Boolean(owner) &&
        isBattleUnitActive(runtime, owner) &&
        !owner.skillDisabled &&
        !(
          Number.isInteger(owner.skillDisabledUntilExchange) &&
          owner.skillDisabledUntilExchange === runtime.currentExchange
        ),
      resolved: false,
    });
    sequence += 1;
  };

  Object.values(runtime.teams)
    .flat()
    .forEach((unit) => {
      unit.skillEffectIds.forEach((effectId) => {
        addCandidate({ effectId, owner: unit, sourceName: unit.name });
      });
      if (unit.equipment?.effectId) {
        addCandidate({
          effectId: unit.equipment.effectId,
          owner: unit,
          sourceName: unit.equipment.name,
        });
      }
    });

  GLOBAL_STATUS_EFFECT_IDS.forEach((effectId) => {
    addCandidate({
      effectId,
      sourceName: GLOBAL_STATUS_EFFECT_LABELS[effectId],
    });
  });

  Object.entries(runtime.lockedBonds).forEach(([side, levels]) => {
    BOND_FACTIONS.forEach((faction) => {
      const level = levels?.[faction] ?? 0;
      if (level <= 0) return;
      (BOND_RULES[faction].effectIds ?? []).forEach((effectId) => {
        addCandidate({
          effectId,
          ownerSide: side,
          sourceName: `${BOND_RULES[faction].label} LV${level}`,
        });
      });
    });
  });

  return candidates;
}

function isBattleHeroSkillApplicable(runtime, candidate, event) {
  if (candidate.definition.sourceType !== "hero" || !candidate.effectId.startsWith("hero.")) {
    return true;
  }
  const { owner, effectId } = candidate;
  const unit = event.payload.unit ?? null;
  const damage = event.payload.damage ?? null;
  const ownerAttacked = event.payload.attackers?.includes(owner);
  const sameSideUnit = unit?.side === owner.side;
  const sharedUnit = sameSideUnit && shareBattleBond(owner, unit);

  if (event.type === "unit:death") {
    if (["hero.pangde.xunjie", "hero.guojia.yiji-pingliao", "hero.pangtong.niepan"].includes(effectId)) {
      return unit === owner;
    }
    if (effectId === "hero.madai.fuzhan") return unit?.lastDamageSource === owner;
    if (effectId === "hero.dianwei.guzhi-elai") return unit === owner && Boolean(owner.consumedSnapshot);
    if (effectId === "hero.huatuo.jijiu") {
      return Boolean(
        sameSideUnit &&
        unit !== owner &&
        !event.payload.consumed &&
        getNearestBattlePositionUnit(runtime, owner, "ahead") === unit &&
        !event.payload.revived
      );
    }
    if (effectId === "hero.caocao.jianxiong") return Boolean(sharedUnit);
    return false;
  }
  if (event.type === "unit:summon") {
    if (effectId === "hero.zhenji.luoshen") return sameSideUnit;
    return ["hero.xunyou.qice", "hero.xunyu.wangzuo-zhicai"].includes(effectId) &&
      Boolean(sharedUnit);
  }
  if (event.type === "experience:gain") {
    if (["hero.liaohua.sujiang", "hero.weiyan.caigao-qilie"].includes(effectId)) {
      return sameSideUnit && unit !== owner;
    }
    return effectId === "hero.machao.hanqiang-pozhen" && unit === owner;
  }
  if (event.type === "unit:upgrade") {
    if (effectId === "hero.zhaoyun.longdan") return unit === owner;
    return effectId === "hero.fazheng.yiyi-dailao" && sameSideUnit && unit !== owner;
  }
  if (event.type === "status:apply") {
    return effectId === "hero.zhugejin.hongya" &&
      event.payload.target?.side === getOpposingSide(owner.side);
  }
  if (event.type === "damage:before") {
    if (effectId === "hero.zhoutai.roushen-tiebi") {
      return damage?.target === owner &&
        damage.type === "attack" &&
        runtime.currentAttackers?.includes(owner);
    }
    return effectId === "hero.zhouyu.fengzhu-huoshi" &&
      damage?.target?.side === getOpposingSide(owner.side) &&
      ["status.burn-tick", "status.burn-ignite"].includes(damage.sourceEffectId);
  }
  if (event.type === "damage:after") {
    if (["hero.huanggai.kurouji", "hero.xiahoudun.gangyong"].includes(effectId)) {
      return damage?.target === owner && damage.finalAmount > 0;
    }
    if (effectId === "hero.wenchou.hanyong") {
      return event.phase === "battle:start" &&
        damage?.source?.side === owner.side &&
        damage.finalAmount > 0;
    }
    return false;
  }
  if (event.type === "attack:before") {
    return ownerAttacked;
  }
  if (event.type === "attack:after") {
    if (effectId === "hero.xiaoqiao.huaron-yuemao") {
      const target = getNearestBattleUnit(runtime, owner, "ahead");
      return Boolean(target && event.payload.attackers?.includes(target));
    }
    if (effectId === "hero.zhugeliang.yunchou") {
      return event.payload.attackers?.some((attacker) => attacker.side === owner.side);
    }
    return ownerAttacked;
  }
  return true;
}

function isEffectCandidateValid(runtime, candidate, event) {
  if (candidate.resolved) return false;
  if (candidate.definition.sourceType === "bond") {
    const eventUnit = event.payload.unit ?? null;
    if (
      candidate.effectId === "bond.wei-death" &&
      (!eventUnit ||
        eventUnit.side !== candidate.ownerSide ||
        !getBattleUnitBonds(eventUnit).includes("魏"))
    ) {
      return false;
    }
    if (
      candidate.effectId === "bond.shu-upgrade" &&
      (!eventUnit ||
        eventUnit.side !== candidate.ownerSide ||
        !getBattleUnitBonds(eventUnit).includes("蜀"))
    ) {
      return false;
    }
  }
  const isOwnersDeathEvent =
    event.type === "unit:death" && event.payload.unit === candidate.owner;
  const isLockedBattleStartHeroSkill = Boolean(candidate.battleStartLocked);
  if (
    candidate.definition.sourceType === "hero" &&
    !isLockedBattleStartHeroSkill &&
    (candidate.owner?.skillDisabled ||
      (Number.isInteger(candidate.owner?.skillDisabledUntilExchange) &&
        candidate.owner.skillDisabledUntilExchange === runtime.currentExchange))
  ) {
    return false;
  }
  if (!isBattleHeroSkillApplicable(runtime, candidate, event)) return false;

  const conditions = candidate.definition.conditions ?? {};
  const damage = event.payload.damage;
  const isOwnersDamageAfterEvent =
    event.type === "damage:after" && damage?.target === candidate.owner;
  const isOwnersAttackAfterEvent =
    event.type === "attack:after" && event.payload.attackers?.includes(candidate.owner);
  if (conditions.phase && event.phase !== conditions.phase) return false;
  if (conditions.damageTypes && !conditions.damageTypes.includes(damage?.type)) return false;
  if (conditions.targetIsOwner && damage?.target !== candidate.owner) return false;
  if (conditions.sourceIsOwner && damage?.source !== candidate.owner) return false;
  if (conditions.sourceSideIsOwnerSide && damage?.source?.side !== candidate.ownerSide) return false;
  if (conditions.eventUnitIsOwner && event.payload.unit !== candidate.owner) return false;
  if (
    conditions.ownerIsAttacker &&
    !event.payload.attackers?.includes(candidate.owner)
  ) {
    return false;
  }
  if (
    candidate.effectId === "equipment.blood-armor" &&
    event.type === "status:apply" &&
    event.payload.target !== candidate.owner
  ) {
    return false;
  }
  if (
    candidate.effectId === "equipment.blood-armor" &&
    event.type === "damage:after" &&
    (damage?.target !== candidate.owner || damage.finalAmount <= 0)
  ) {
    return false;
  }
  if (
    candidate.owner &&
    !isOwnersDeathEvent &&
    !isOwnersDamageAfterEvent &&
    !isOwnersAttackAfterEvent &&
    !isLockedBattleStartHeroSkill &&
    !isBattleUnitActive(runtime, candidate.owner)
  ) {
    return false;
  }
  return true;
}

function chooseDynamicHeroCandidate(runtime, candidates, event) {
  const valid = candidates.filter((candidate) => isEffectCandidateValid(runtime, candidate, event));
  if (valid.length === 0) return null;
  const highestAttack = Math.max(...valid.map((candidate) => candidate.owner.attack));
  const tied = valid.filter((candidate) => candidate.owner.attack === highestAttack);
  if (tied.length === 1) return tied[0];
  const selected = tied[Math.floor(runtime.random() * tied.length)];
  runtime.structuredLog.push({
    type: "timing-tie",
    eventId: event.id,
    attack: highestAttack,
    candidates: tied.map((candidate) => candidate.owner.name),
    selected: selected.owner.name,
  });
  return selected;
}

function chooseNextEffectCandidate(runtime, candidates, event) {
  const valid = candidates.filter((candidate) => isEffectCandidateValid(runtime, candidate, event));
  if (valid.length === 0) return null;
  const getCandidatePriority = (candidate) => {
    const initiativeBonus =
      candidate.definition.sourceType === "hero" &&
      candidate.owner?.equipment?.effectId === "equipment.initiative-flag"
        ? 1000
        : 0;
    return (candidate.definition.priority ?? 0) + initiativeBonus;
  };
  const highestPriority = Math.max(...valid.map(getCandidatePriority));
  const priorityCandidates = valid.filter(
    (candidate) => getCandidatePriority(candidate) === highestPriority,
  );
  const heroCandidates = priorityCandidates.filter(
    (candidate) => candidate.definition.sourceType === "hero" && candidate.owner,
  );
  if (heroCandidates.length > 0) {
    return chooseDynamicHeroCandidate(runtime, heroCandidates, event);
  }
  return priorityCandidates.sort((left, right) => left.sequence - right.sequence)[0];
}

function getEquipmentRuntimeState(owner, defaultCharges = null) {
  if (!owner?.equipment) return null;
  owner.equipment.runtime ??= {};
  if (
    defaultCharges !== null &&
    !Number.isFinite(owner.equipment.runtime.remainingCharges)
  ) {
    owner.equipment.runtime.remainingCharges = defaultCharges;
  }
  return owner.equipment.runtime;
}

function getOpposingSide(side) {
  return side === "player" ? "enemy" : "player";
}

function getLivingBattleUnits(runtime, side) {
  return runtime.teams[side].filter((unit) => unit.health > 0);
}

function getBattleUnitsFromFront(runtime, side) {
  const units = getLivingBattleUnits(runtime, side);
  return side === "player" ? [...units].reverse() : units;
}

function getNearestBattleUnit(runtime, owner, direction, predicate = () => true) {
  const team = runtime.teams[owner.side];
  const ownerIndex = team.indexOf(owner);
  const step =
    direction === "ahead"
      ? owner.side === "player"
        ? 1
        : -1
      : owner.side === "player"
        ? -1
        : 1;
  if (ownerIndex < 0) {
    const ownerStartPosition = runtime.battleStartPositions?.get(owner.id);
    if (!ownerStartPosition) return null;
    return (
      team
        .filter((target) => target.health > 0 && predicate(target))
        .map((target) => ({
          target,
          position: runtime.battleStartPositions?.get(target.id),
        }))
        .filter(
          ({ position }) =>
            position?.side === ownerStartPosition.side &&
            (position.index - ownerStartPosition.index) * step > 0,
        )
        .sort(
          (left, right) =>
            Math.abs(left.position.index - ownerStartPosition.index) -
            Math.abs(right.position.index - ownerStartPosition.index),
        )[0]?.target ?? null
    );
  }
  for (
    let index = ownerIndex + step;
    index >= 0 && index < team.length;
    index += step
  ) {
    const target = team[index];
    if (target.health > 0 && predicate(target)) return target;
  }
  return null;
}

function getNearestBattlePositionUnit(runtime, owner, direction) {
  const team = runtime.teams[owner.side];
  const ownerIndex = team.indexOf(owner);
  if (ownerIndex < 0) return null;
  const step =
    direction === "ahead"
      ? owner.side === "player"
        ? 1
        : -1
      : owner.side === "player"
        ? -1
        : 1;
  for (
    let index = ownerIndex + step;
    index >= 0 && index < team.length;
    index += step
  ) {
    if (team[index]) return team[index];
  }
  return null;
}

function shareBattleBond(left, right) {
  const rightBonds = new Set(getBattleUnitBonds(right));
  return getBattleUnitBonds(left).some((faction) => rightBonds.has(faction));
}

function getOwnerAttackPair(event, owner) {
  return event.payload.attackPairs?.find((pair) => pair.source === owner) ?? null;
}

function recordHeroBattleSkill(runtime, owner, message, effectId, details = {}) {
  recordBattleLog(runtime, "hero-skill", `${owner.name}：${message}。`, {
    ownerId: owner.id,
    ownerName: owner.name,
    ownerSide: owner.side,
    effectId,
    ...details,
  });
}

function commitResolvedBattleDamage(
  runtime,
  damage,
  {
    extraPayload = {},
    resolveDeaths = true,
    exchange = runtime.currentExchange,
  } = {},
) {
  const { source, target, sourceEffectId } = damage;
  if (!source || !target || target.health <= 0) return null;
  if (damage.finalAmount > 0) {
    target.lastDamageSource = source;
    target.lastDamageEffectId = sourceEffectId;
  }
  const healthBefore = target.health;
  target.health -= damage.finalAmount;
  const entry = recordBattleLog(
    runtime,
    "damage",
    `${source.side === "player" ? "我方" : source.side === "enemy" ? "敌方" : ""} ${
      source.name
    } 对${target.side === "player" ? "我方" : "敌方"} ${target.name}造成${
      damage.finalAmount
    }点伤害${formatDamageModifiers(damage)}。`.trim(),
    {
      damage: damage.finalAmount,
      baseDamage: damage.originalAmount,
      damageType: damage.type,
      modifiers: damage.modifiers.map((modifier) => ({ ...modifier })),
      sourceEffectId,
      sourceUnitId: source.id,
      sourceName: source.name,
      sourceSide: source.side ?? null,
      targetUnitId: target.id,
      targetName: target.name,
      targetSide: target.side ?? null,
      targetHealthBefore: healthBefore,
      targetHealthAfter: target.health,
      exchange,
    },
  );
  recordBattlePresentationStep(runtime, {
    kind: "damage",
    title: `${source.name}对${target.name}造成 ${damage.finalAmount} 点伤害`,
    effectId: sourceEffectId,
    effectName: runtime.currentCandidate?.sourceName || source.name,
    sourceIds: [source.id],
    targetIds: [target.id],
    cues: [
      {
        unitId: target.id,
        text: damage.finalAmount > 0 ? `-${damage.finalAmount}` : "伤害抵挡",
        tone: "damage",
      },
    ],
    entries: [entry],
    durationMs: 1450,
  });
  resolveImmediateBattleEvent(runtime, "damage:after", {
    damage,
    exchange,
    ...extraPayload,
  });
  if (resolveDeaths) resolveAllBattleDeaths(runtime, exchange);
  return damage;
}

function dealBattleDamage(
  runtime,
  {
    source,
    target,
    amount,
    type = "skill",
    sourceEffectId,
    extraPayload = {},
    resolveDeaths = true,
  },
) {
  if (!source || !target || target.health <= 0) return null;
  const damage = resolveBattleDamage(runtime, {
    source,
    target,
    amount,
    type,
    sourceEffectId,
  });
  return commitResolvedBattleDamage(runtime, damage, {
    extraPayload,
    resolveDeaths,
  });
}

function grantBattleExperience(runtime, unit, amount, source, sourceEffectId) {
  const maximumProgress = UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL];
  let granted = 0;
  let convertedToStats = 0;
  for (let point = 0; point < amount; point += 1) {
    if (unit.health <= 0) break;
    const previousLevel = unit.level ?? 1;
    const previousExperience = unit.experience ?? 0;
    const previousAttack = unit.attack;
    const previousHealth = unit.health;
    const previousMaxHealth = unit.maxHealth;
    if (getUnitProgressValue(unit) >= maximumProgress) {
      const statResult = addBattleUnitStats(unit, 1, 1);
      convertedToStats += 1;
      recordBattlePresentationLog(
        runtime,
        "experience",
        `${source?.name ?? "经验效果"}：${unit.name}经验已满，1 点溢出经验转化为 +1/+1，当前 ${unit.attack}/${unit.health}。`,
        {
          ownerId: source?.id ?? null,
          ownerName: source?.name ?? null,
          ownerSide: source?.side ?? null,
          targetUnitId: unit.id,
          targetName: unit.name,
          targetSide: unit.side,
          sourceEffectId,
          grantedExperience: 0,
          convertedToStats: 1,
          levelBefore: previousLevel,
          levelAfter: unit.level ?? previousLevel,
          experienceBefore: previousExperience,
          experienceAfter: unit.experience ?? previousExperience,
          attackBefore: previousAttack,
          attackAfter: unit.attack,
          healthBefore: previousHealth,
          healthAfter: unit.health,
          maxHealthBefore: previousMaxHealth,
          maxHealthAfter: unit.maxHealth,
          attackDelta: statResult?.attackDelta ?? 0,
          healthDelta: statResult?.healthDelta ?? 0,
          maxHealthDelta: statResult?.maxHealthDelta ?? 0,
        },
        {
          kind: "experience",
          title: `${unit.name}溢出经验转化`,
          effectId: sourceEffectId,
          effectName: source?.name ?? "经验效果",
          sourceIds: [source?.id],
          targetIds: [unit.id],
          cues: [
            {
              unitId: unit.id,
              text: "满级经验 → +1/+1",
              tone: "experience",
            },
          ],
          durationMs: 1550,
        },
      );
      continue;
    }
    unit.bonusExperience = Math.max(0, unit.bonusExperience ?? 0) + 1;
    const progress = getUnitProgress(getUnitProgressValue(unit));
    unit.level = progress.level;
    unit.experience = progress.experience;
    const statResult = addBattleUnitStats(unit, 1, 1);
    granted += 1;
    const leveledUp = unit.level > previousLevel;
    const experienceBeforeLabel =
      previousLevel >= MAX_UNIT_LEVEL
        ? "满级"
        : `${previousExperience}/${getExperienceNeeded(previousLevel)}`;
    const experienceAfterLabel =
      unit.level >= MAX_UNIT_LEVEL
        ? "满级"
        : `${unit.experience}/${getExperienceNeeded(unit.level)}`;
    recordBattlePresentationLog(
      runtime,
      "experience",
      `${source?.name ?? "经验效果"}：${unit.name}获得 1 点经验（${experienceBeforeLabel} → ${experienceAfterLabel}）并获得 +1/+1${
        leveledUp ? `，升级至 LV${unit.level}` : ""
      }。`,
      {
        ownerId: source?.id ?? null,
        ownerName: source?.name ?? null,
        ownerSide: source?.side ?? null,
        targetUnitId: unit.id,
        targetName: unit.name,
        targetSide: unit.side,
        sourceEffectId,
        grantedExperience: 1,
        convertedToStats: 0,
        leveledUp,
        levelBefore: previousLevel,
        levelAfter: unit.level,
        experienceBefore: previousExperience,
        experienceAfter: unit.experience,
        attackBefore: previousAttack,
        attackAfter: unit.attack,
        healthBefore: previousHealth,
        healthAfter: unit.health,
        maxHealthBefore: previousMaxHealth,
        maxHealthAfter: unit.maxHealth,
        attackDelta: statResult?.attackDelta ?? 0,
        healthDelta: statResult?.healthDelta ?? 0,
        maxHealthDelta: statResult?.maxHealthDelta ?? 0,
      },
      {
        kind: "experience",
        title: `${unit.name}获得 1 点经验${leveledUp ? `并升至 LV${unit.level}` : ""}`,
        effectId: sourceEffectId,
        effectName: source?.name ?? "经验效果",
        sourceIds: [source?.id],
        targetIds: [unit.id],
        cues: [
          {
            unitId: unit.id,
            text: `EXP +1 · +1/+1${leveledUp ? ` · LV${unit.level}` : ""}`,
            tone: "experience",
          },
        ],
        durationMs: leveledUp ? 1800 : 1550,
      },
    );
    resolveImmediateBattleEvent(runtime, "experience:gain", {
      unit,
      amount: 1,
      source,
      sourceEffectId,
    });
    if (unit.level > previousLevel) {
      resolveImmediateBattleEvent(runtime, "unit:upgrade", {
        unit,
        previousLevel,
        level: unit.level,
        source,
        sourceEffectId,
      });
    }
  }
  if (granted > 0 || convertedToStats > 0) {
    const experienceMessage = granted > 0 ? `${unit.name}获得 ${granted} 点经验` : "";
    const overflowMessage =
      convertedToStats > 0
        ? `${experienceMessage ? "；" : `${unit.name}`}经验已满，${convertedToStats} 点溢出经验转化为 +${convertedToStats}/+${convertedToStats}`
        : "";
    recordBattleLog(
      runtime,
      "hero-skill",
      `${source?.name ?? "经验效果"}：${experienceMessage}${overflowMessage}。`,
      {
        ownerId: source?.id ?? null,
        ownerName: source?.name ?? null,
        ownerSide: source?.side ?? null,
        targetUnitId: unit.id,
        targetUnitName: unit.name,
        effectId: sourceEffectId,
        grantedExperience: granted,
        convertedToStats,
        animationSkip: true,
      },
    );
  }
  return { granted, convertedToStats };
}

function addBattleUnitToTeamFront(runtime, side, unit) {
  if (side === "player") runtime.teams[side].push(unit);
  else runtime.teams[side].unshift(unit);
}

function summonScaledCavalryInFront(runtime, owner, count, effectId) {
  let summonAnchor = owner;
  for (let index = 0; index < count; index += 1) {
    if (!hasBattleSummonSlot(runtime, owner.side)) {
      recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
      break;
    }
    const level = owner.level ?? 1;
    const cavalry = createCavalry(
      runtime,
      owner.side,
      2 * level,
      level,
      owner,
      level,
    );
    if (!insertBattleUnitInFrontOfTarget(runtime, summonAnchor, cavalry)) {
      recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
      break;
    }
    summonAnchor = cavalry;
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${owner.name}：在身前召唤骑兵 LV${level} ${cavalry.attack}/${cavalry.health}。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        unitId: cavalry.id,
        unitName: cavalry.name,
        unitSide: cavalry.side,
        sourceEffectId: effectId,
      },
      {
        kind: "summon",
        title: `${owner.name}召唤骑兵`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [cavalry.id],
        cues: [{ unitId: cavalry.id, text: "召唤", tone: "buff" }],
        durationMs: 1550,
      },
    );
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: cavalry,
      side: owner.side,
      source: owner,
      sourceEffectId: effectId,
    });
  }
}

function cloneBattleIdentityForSummon(
  runtime,
  source,
  side,
  attack,
  health,
  level = 1,
  summonerOrFaction = source.faction,
) {
  const summonId = runtime.nextSummonId++;
  return {
    id: `${side}-${source.name}-skill-summon-${summonId}`,
    sourceId: source.sourceId ?? null,
    name: source.name,
    attack,
    health,
    maxHealth: health,
    faction: getSummonedUnitFaction(summonerOrFaction),
    extraFactions: [],
    tempExtraFactions: [],
    usesBondDefinitionSnapshot: true,
    tier: source.tier,
    side,
    lineupIndex: 0,
    skillEffectIds: [...(source.skillEffectIds ?? [])],
    equipment: null,
    statuses: {},
    level,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[level] ?? 1,
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
    skillDisabledUntilExchange: null,
    consumedSnapshot: null,
    lastDamageSource: null,
  };
}

function releaseDianweiConsumedUnit(runtime, owner, level, effectId) {
  const snapshot = owner.consumedSnapshot;
  if (!snapshot) return;
  const released = cloneBattleIdentityForSummon(
    runtime,
    snapshot,
    owner.side,
    snapshot.attack,
    snapshot.maxHealth,
    level,
    owner,
  );
  released.health = Math.min(snapshot.health, released.maxHealth);
  if (
    !insertBattleUnitAtDeathPosition(
      runtime,
      owner.side,
      released,
      snapshot.deathPosition,
    )
  ) {
    recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
    owner.consumedSnapshot = null;
    return;
  }
  recordBattlePresentationLog(
    runtime,
    "summon",
    `${owner.name}释放被吞噬的${released.name}，以 LV${released.level} ${released.attack}/${released.health}回到战场。`,
    {
      ownerId: owner.id,
      ownerName: owner.name,
      ownerSide: owner.side,
      unitId: released.id,
      unitName: released.name,
      unitSide: released.side,
      sourceEffectId: effectId,
    },
    {
      kind: "summon",
      title: `${released.name}重返战场`,
      effectId,
      effectName: owner.name,
      sourceIds: [owner.id],
      targetIds: [released.id],
      cues: [{ unitId: released.id, text: "释放", tone: "buff" }],
      durationMs: 1550,
    },
  );
  dispatchBattleEvent(runtime, "unit:summon", {
    unit: released,
    side: owner.side,
    source: owner,
    sourceEffectId: effectId,
  });
  owner.consumedSnapshot = null;
}

function resolveRestRecovery(runtime, event) {
  const attackers = event.payload.attackers ?? [];
  Object.values(runtime.teams)
    .flat()
    .filter((unit) => unit.health > 0 && unit.statuses?.rest)
    .forEach((unit) => {
      const triggered = attackers.some(
        (attacker) => attacker.side === unit.side && attacker !== unit,
      );
      if (!triggered) return;
      const amount = unit.statuses.rest.amount ?? 0;
      applyBattleUnitStatBonus(runtime, unit, 0, amount, "休整");
    });
}

function resolveIntimidatedDamage(runtime, event) {
  const damage = event.payload.damage;
  if (!damage?.source?.statuses?.intimidated || damage.type === "true") return;
  const before = damage.amount;
  damage.amount = Math.floor(damage.amount * 0.5);
  damage.modifiers.push({
    effectId: "status.intimidated-damage",
    sourceName: "震慑",
    amount: damage.amount - before,
  });
}

function resolveUnparalleledCleave(runtime, event) {
  (event.payload.attackPairs ?? []).forEach((pair) => {
    const status = pair.source.statuses?.unparalleled;
    if (!status || pair.damage.finalAmount <= 0) return;
    const targets = [];
    let target = getNearestBattleUnit(runtime, pair.target, "behind");
    const count = Math.max(1, status.targetCount ?? 1);
    while (target && targets.length < count) {
      targets.push(target);
      target = getNearestBattleUnit(runtime, target, "behind");
    }
    targets.forEach((cleaveTarget) => {
      const amount = Math.max(1, Math.floor(pair.damage.finalAmount * 0.3));
      dealBattleDamage(runtime, {
        source: pair.source,
        target: cleaveTarget,
        amount,
        sourceEffectId: "status.unparalleled-cleave",
      });
    });
  });
}

function resolveCounterplotRevive(runtime, event) {
  const deadUnit = event.payload.unit;
  const status = deadUnit?.statuses?.counterplot;
  if (!status || status.resolved) return;
  status.resolved = true;
  const side = status.ownerSide;
  if (!hasBattleSummonSlot(runtime, side)) {
    recordBattleSummonFailure(
      runtime,
      side,
      status.sourceName || "反间",
      status.sourceEffectId || "status.counterplot-revive",
    );
    return;
  }
  const summon = cloneBattleIdentityForSummon(
    runtime,
    deadUnit,
    side,
    3,
    3,
    1,
    status.summonFaction,
  );
  addBattleUnitToTeamFront(runtime, side, summon);
  recordBattlePresentationLog(
    runtime,
    "status",
    `${deadUnit.name}的反间触发，在${side === "player" ? "我方" : "敌方"}队首以LV1 3/3加入。`,
    {
      deadUnitId: deadUnit.id,
      deadUnitName: deadUnit.name,
      deadUnitSide: deadUnit.side,
      summonId: summon.id,
      side,
    },
    {
      kind: "summon",
      title: `${deadUnit.name}因反间加入敌方`,
      effectName: status.sourceName || "反间",
      targetIds: [summon.id],
      cues: [{ unitId: summon.id, text: "反间召唤", tone: "status" }],
      durationMs: 1650,
    },
  );
  dispatchBattleEvent(runtime, "unit:summon", {
    unit: summon,
    side,
    sourceEffectId: "status.counterplot-revive",
  });
}

function resolveBattleHeroSkill(runtime, candidate, event) {
  const { owner, effectId } = candidate;
  const level = owner.level ?? 1;
  const eventUnit = event.payload.unit ?? null;
  const enemySide = getOpposingSide(owner.side);
  const ownerAttacked = event.payload.attackers?.includes(owner);
  const sharedEventUnit =
    eventUnit &&
    eventUnit.side === owner.side &&
    shareBattleBond(owner, eventUnit);

  if (
    effectId === "hero.zhenji.luoshen" &&
    event.type === "unit:summon" &&
    eventUnit?.side === owner.side
  ) {
    applyBattleUnitStatBonus(runtime, eventUnit, level, 0, owner.name);
    return;
  }
  if (effectId === "hero.pangde.xunjie" && event.type === "unit:death" && eventUnit === owner) {
    const target = getNearestBattleUnit(runtime, owner, "behind");
    if (target) applyBattleUnitStatBonus(runtime, target, level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.madai.fuzhan" &&
    event.type === "unit:death" &&
    eventUnit?.lastDamageSource === owner
  ) {
    grantBattleExperience(runtime, owner, level, owner, effectId);
    return;
  }
  if (
    effectId === "hero.liaohua.sujiang" &&
    event.type === "experience:gain" &&
    eventUnit?.side === owner.side &&
    eventUnit !== owner
  ) {
    applyBattleUnitStatBonus(runtime, eventUnit, 0, level, owner.name);
    return;
  }
  if (effectId === "hero.mayunlu.xiliang-lienv" && event.type === "battle:start") {
    grantBattleExperience(runtime, owner, level, owner, effectId);
    return;
  }
  if (
    effectId === "hero.zhugejin.hongya" &&
    event.type === "status:apply" &&
    event.payload.target?.side === enemySide
  ) {
    const target = pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, owner.side).filter((unit) => unit !== owner),
      1,
    )[0];
    if (target) applyBattleUnitStatBonus(runtime, target, level, level, owner.name);
    return;
  }
  if (effectId === "hero.handang.yonglie" && event.type === "attack:after" && ownerAttacked) {
    const target = pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), 1)[0];
    if (!target) return;
    dealBattleDamage(runtime, { source: owner, target, amount: level, sourceEffectId: effectId });
    if (target.health > 0) {
      applyNegativeStatus(runtime, target, "burn", {
        ownerSide: owner.side,
        sourceEffectId: effectId,
        sourceName: owner.name,
      });
    }
    return;
  }
  if (effectId === "hero.huaxiong.xiaoyong" && event.type === "battle:start") {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((target) =>
        dealBattleDamage(runtime, { source: owner, target, amount: 2, sourceEffectId: effectId }),
      );
    return;
  }
  if (effectId === "hero.xiahouyuan.qianli-benxi" && event.type === "attack:after" && ownerAttacked) {
    summonCavalry(runtime, owner.side, 1, {
      attack: 2 * level,
      health: level,
      level,
      sourceEffectId: effectId,
      sourceName: owner.name,
      summoner: owner,
      target: owner,
      position: "target-front",
    });
    return;
  }
  if (effectId === "hero.weiyan.caigao-qilie" && event.type === "experience:gain" && eventUnit !== owner) {
    applyBattleUnitStatBonus(runtime, owner, level, 0, owner.name);
    return;
  }
  if (effectId === "hero.xiaoqiao.huaron-yuemao" && event.type === "attack:after") {
    const target = getNearestBattleUnit(runtime, owner, "ahead");
    if (target && event.payload.attackers?.includes(target)) {
      applyBattleUnitStatBonus(runtime, target, 0, 2 * level, owner.name);
    }
    return;
  }
  if (
    effectId === "hero.huanggai.kurouji" &&
    event.type === "damage:after" &&
    event.payload.damage?.target === owner &&
    event.payload.damage.finalAmount > 0
  ) {
    pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), level).forEach(
      (target) =>
        applyNegativeStatus(runtime, target, "burn", {
          ownerSide: owner.side,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
    );
    return;
  }
  if (
    effectId === "hero.xiahoudun.gangyong" &&
    event.type === "damage:after" &&
    event.payload.damage?.target === owner &&
    event.payload.damage.finalAmount > 0
  ) {
    const targets = getLivingBattleUnits(runtime, owner.side).filter(
      (unit) => unit !== owner && shareBattleBond(owner, unit),
    );
    pickBattleRandomUnits(runtime, targets, level).forEach((target) =>
      applyBattleUnitStatBonus(runtime, target, 2, 2, owner.name),
    );
    return;
  }
  if (effectId === "hero.yuejin.xiandeng-xianzhen" && event.type === "attack:before" && ownerAttacked) {
    summonScaledCavalryInFront(runtime, owner, 2, effectId);
    return;
  }
  if (effectId === "hero.xuhuang.changqu-zhiru" && event.type === "battle:start") {
    for (let hit = 0; hit < 2; hit += 1) {
      const target = getBattleUnitsFromFront(runtime, enemySide).at(-1);
      if (!target) break;
      dealBattleDamage(runtime, {
        source: owner,
        target,
        amount: 3 * level,
        sourceEffectId: effectId,
      });
    }
    return;
  }
  if (effectId === "hero.zhangfei.yanren-paoxiao" && event.type === "attack:before" && ownerAttacked) {
    const target = getBattleFrontUnit(runtime.teams[enemySide], enemySide);
    if (target) {
      applyBattleUnitStatBonus(runtime, target, -3 * level, 0, owner.name);
    }
    return;
  }
  if (effectId === "hero.xushu.jiancai" && event.type === "battle:start") {
    const target = getNearestBattleUnit(runtime, owner, "ahead");
    if (target) grantBattleExperience(runtime, target, level, owner, effectId);
    return;
  }
  if (effectId === "hero.taishici.jianwu-xufa" && event.type === "battle:start") {
    const enemies = getLivingBattleUnits(runtime, enemySide);
    const highestHealth = Math.max(...enemies.map((unit) => unit.health), -Infinity);
    const target = pickBattleRandomUnits(
      runtime,
      enemies.filter((unit) => unit.health === highestHealth),
      1,
    )[0];
    if (!target) return;
    dealBattleDamage(runtime, {
      source: owner,
      target,
      amount: 3 * level,
      sourceEffectId: effectId,
    });
    if (target.health > 0) {
      applyNegativeStatus(runtime, target, "burn", {
        ownerSide: owner.side,
        sourceEffectId: effectId,
        sourceName: owner.name,
      });
    }
    return;
  }
  if (
    effectId === "hero.zhoutai.roushen-tiebi" &&
    event.type === "damage:before" &&
    event.payload.damage?.target === owner &&
    runtime.currentAttackers?.includes(owner) &&
    event.payload.damage.type === "attack"
  ) {
    const damage = event.payload.damage;
    const before = damage.amount;
    damage.amount = Math.max(0, damage.amount - 3 * level);
    damage.modifiers.push({
      effectId,
      sourceName: owner.name,
      amount: damage.amount - before,
    });
    return;
  }
  if (
    effectId === "hero.wenchou.hanyong" &&
    event.type === "damage:after" &&
    event.phase === "battle:start" &&
    event.payload.damage?.source?.side === owner.side &&
    event.payload.damage.finalAmount > 0
  ) {
    applyBattleUnitStatBonus(runtime, owner, level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.xunyou.qice" &&
    event.type === "unit:summon" &&
    sharedEventUnit
  ) {
    grantBattleExperience(runtime, eventUnit, 2 * level, owner, effectId);
    return;
  }
  if (effectId === "hero.dianwei.guzhi-elai") {
    if (event.type === "battle:start") {
      const target = getNearestBattleUnit(runtime, owner, "ahead");
      if (!target) return;
      const deathPosition = captureBattleDeathPosition(runtime, target);
      owner.consumedSnapshot = {
        ...getBattleUnitSnapshot(target),
        faction: target.faction,
        extraFactions: [...(target.extraFactions ?? [])],
        tier: target.tier,
        skillEffectIds: [...(target.skillEffectIds ?? [])],
        deathPosition,
      };
      target.health = 0;
      target.deathPosition = deathPosition;
      recordBattlePresentationLog(
        runtime,
        "consume",
        `${owner.name}吞噬${target.name}，${target.name}生命降至 0。`,
        {
          ownerId: owner.id,
          ownerName: owner.name,
          ownerSide: owner.side,
          targetUnitId: target.id,
          targetName: target.name,
          targetSide: target.side,
          sourceEffectId: effectId,
        },
        {
          kind: "consume",
          title: `${owner.name}吞噬${target.name}`,
          effectId,
          effectName: owner.name,
          sourceIds: [owner.id],
          targetIds: [target.id],
          deathIds: [target.id],
          cues: [{ unitId: target.id, text: "被吞噬", tone: "death" }],
          durationMs: 1550,
        },
      );
      resolveImmediateBattleEvent(runtime, "unit:consume", {
        unit: target,
        consumer: owner,
        sourceEffectId: effectId,
        deathPosition,
      });
      resolveBattleUnitDeath(runtime, target, runtime.currentExchange, {
        deathPosition,
        killer: owner,
        sourceEffectId: effectId,
        consumed: true,
      });
      if (!isBattleUnitActive(runtime, owner)) {
        releaseDianweiConsumedUnit(runtime, owner, level, effectId);
      }
      return;
    }
    if (event.type === "unit:death" && eventUnit === owner && owner.consumedSnapshot) {
      releaseDianweiConsumedUnit(runtime, owner, level, effectId);
    }
    return;
  }
  if (effectId === "hero.zhaoyun.longdan" && event.type === "unit:upgrade" && eventUnit === owner) {
    owner.statuses = {
      unparalleled: {
        targetCount: 1,
        sourceEffectId: effectId,
        sourceName: owner.name,
      },
    };
    recordBattlePresentationLog(
      runtime,
      "status",
      `${owner.name}获得无双。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        targetUnitId: owner.id,
        targetName: owner.name,
        targetSide: owner.side,
        statusId: "unparalleled",
        statusName: STATUS_LABELS.unparalleled,
        sourceEffectId: effectId,
      },
      {
        kind: "status",
        title: `${owner.name}获得无双`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [owner.id],
        cues: [{ unitId: owner.id, text: "无双", tone: "status" }],
        durationMs: 1450,
      },
    );
    applyBattleUnitStatBonus(runtime, owner, 2 * level, 2 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.fazheng.yiyi-dailao" &&
    event.type === "unit:upgrade" &&
    eventUnit?.side === owner.side &&
    eventUnit !== owner
  ) {
    grantBattleExperience(runtime, eventUnit, level, owner, effectId);
    eventUnit.statuses = {
      rest: { amount: 2 * level, sourceEffectId: effectId },
    };
    recordBattlePresentationLog(
      runtime,
      "status",
      `${owner.name}使${eventUnit.name}获得休整。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        targetUnitId: eventUnit.id,
        targetName: eventUnit.name,
        targetSide: eventUnit.side,
        statusId: "rest",
        statusName: STATUS_LABELS.rest,
        sourceEffectId: effectId,
      },
      {
        kind: "status",
        title: `${eventUnit.name}获得休整`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [eventUnit.id],
        cues: [{ unitId: eventUnit.id, text: "休整", tone: "status" }],
        durationMs: 1450,
      },
    );
    return;
  }
  if (effectId === "hero.sunce.jiangdong-bawang" && event.type === "battle:start") {
    const count = getLivingBattleUnits(runtime, owner.side).filter((unit) =>
      shareBattleBond(owner, unit),
    ).length;
    applyBattleUnitStatBonus(runtime, owner, count * level, count * 2 * level, owner.name);
    return;
  }
  if (effectId === "hero.lvmeng.baiyi-dujiang" && event.type === "attack:before" && ownerAttacked) {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((unit) => {
        unit.skillDisabledUntilExchange = runtime.currentExchange;
        recordBattlePresentationLog(
          runtime,
          "status",
          `${owner.name}使${unit.name}本次交锋武将技能失效。`,
          {
            ownerId: owner.id,
            ownerName: owner.name,
            ownerSide: owner.side,
            targetUnitId: unit.id,
            targetName: unit.name,
            targetSide: unit.side,
            statusId: "skill-disabled",
            statusName: "技能禁用",
            sourceEffectId: effectId,
          },
          {
            kind: "status",
            title: `${unit.name}本轮技能被禁用`,
            effectId,
            effectName: owner.name,
            sourceIds: [owner.id],
            targetIds: [unit.id],
            cues: [{ unitId: unit.id, text: "技能禁用", tone: "debuff" }],
            durationMs: 1350,
          },
        );
      });
    return;
  }
  if (effectId === "hero.gongsunzan.baima-yicong" && event.type === "battle:start") {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((target) => {
        const removedEquipment = target.equipment;
        target.equipment = null;
        if (removedEquipment) {
          recordBattlePresentationLog(
            runtime,
            "equipment",
            `${owner.name}移除${target.name}的${removedEquipment.name}。`,
            {
              ownerId: owner.id,
              ownerName: owner.name,
              ownerSide: owner.side,
              targetUnitId: target.id,
              targetName: target.name,
              targetSide: target.side,
              equipmentName: removedEquipment.name,
              sourceEffectId: effectId,
            },
            {
              kind: "equipment",
              title: `${target.name}失去${removedEquipment.name}`,
              effectId,
              effectName: owner.name,
              sourceIds: [owner.id],
              targetIds: [target.id],
              cues: [
                {
                  unitId: target.id,
                  text: `卸除${removedEquipment.name}`,
                  tone: "debuff",
                },
              ],
              durationMs: 1450,
            },
          );
        }
        dealBattleDamage(runtime, {
          source: owner,
          target,
          amount: 3,
          sourceEffectId: effectId,
        });
      });
    return;
  }
  if (effectId === "hero.jiaxu.fanjian" && event.type === "battle:start") {
    pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), level).forEach(
      (target) =>
        applyNegativeStatus(runtime, target, "counterplot", {
          ownerSide: owner.side,
          summonFaction: owner.faction,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
    );
    return;
  }
  if (effectId === "hero.guojia.yiji-pingliao" && event.type === "unit:death" && eventUnit === owner) {
    getLivingBattleUnits(runtime, owner.side)
      .filter((unit) => unit !== owner && shareBattleBond(owner, unit))
      .forEach((unit) =>
        applyBattleUnitStatBonus(runtime, unit, 2 * level, 2 * level, owner.name),
      );
    return;
  }
  if (effectId === "hero.zhangliao.weizhen-xiaoyao" && event.type === "battle:start") {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((target) => {
        const healthBefore = target.health;
        target.health *= 0.6;
        recordBattlePresentationLog(
          runtime,
          "health",
          `${owner.name}使${target.name}当前生命降低 40%（${healthBefore} → ${target.health}）。`,
          {
            ownerId: owner.id,
            ownerName: owner.name,
            ownerSide: owner.side,
            targetUnitId: target.id,
            targetName: target.name,
            targetSide: target.side,
            healthBefore,
            healthAfter: target.health,
            healthDelta: target.health - healthBefore,
            sourceEffectId: effectId,
          },
          {
            kind: "health",
            title: `${target.name}当前生命降低 40%`,
            effectId,
            effectName: owner.name,
            sourceIds: [owner.id],
            targetIds: [target.id],
            cues: [
              {
                unitId: target.id,
                text: `生命 ${target.health - healthBefore}`,
                tone: "debuff",
              },
            ],
            durationMs: 1450,
          },
        );
      });
    resolveAllBattleDeaths(runtime, runtime.currentExchange);
    return;
  }
  if (effectId === "hero.machao.hanqiang-pozhen" && event.type === "experience:gain" && eventUnit === owner) {
    applyBattleUnitStatBonus(runtime, owner, level, level, owner.name);
    const target = pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), 1)[0];
    if (target) {
      dealBattleDamage(runtime, {
        source: owner,
        target,
        amount: Math.max(1, Math.floor(owner.attack * 0.5)),
        sourceEffectId: effectId,
      });
    }
    return;
  }
  if (effectId === "hero.pangtong.niepan" && event.type === "unit:death" && eventUnit === owner) {
    pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, owner.side).filter((unit) => unit !== owner),
      2,
    ).forEach((unit) => grantBattleExperience(runtime, unit, level, owner, effectId));
    return;
  }
  if (effectId === "hero.luxun.huoshao-lianying" && event.type === "attack:after" && ownerAttacked) {
    const target = pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), 1)[0];
    if (!target) return;
    for (let count = 0; count < 3 * level && target.health > 0; count += 1) {
      applyNegativeStatus(runtime, target, "burn", {
        ownerSide: owner.side,
        sourceEffectId: effectId,
        sourceName: owner.name,
      });
      resolveAllBattleDeaths(runtime, runtime.currentExchange);
    }
    return;
  }
  if (effectId === "hero.ganning.baiqi-jieying" && event.type === "battle:start") {
    const targets = getBattleUnitsFromFront(runtime, enemySide).slice(-2);
    targets.forEach((target) =>
      applyNegativeStatus(runtime, target, "burn", {
        ownerSide: owner.side,
        sourceEffectId: effectId,
        sourceName: owner.name,
      }),
    );
    for (let trigger = 0; trigger < level; trigger += 1) {
      targets.filter((target) => target.health > 0).forEach((target) => {
        dealBattleDamage(runtime, {
          source: owner,
          target,
          amount: 1,
          type: "true",
          sourceEffectId: "status.burn-tick",
          extraPayload: { statusId: "burn", forcedBy: effectId },
        });
      });
    }
    return;
  }
  if (
    effectId === "hero.huatuo.jijiu" &&
    event.type === "unit:death" &&
    eventUnit?.side === owner.side &&
    eventUnit !== owner &&
    !event.payload.consumed &&
    getNearestBattlePositionUnit(runtime, owner, "ahead") === eventUnit &&
    !event.payload.revived
  ) {
    const revived = cloneBattleIdentityForSummon(
      runtime,
      eventUnit,
      owner.side,
      level,
      level,
      level,
      owner,
    );
    if (
      !insertBattleUnitInFrontOfTarget(
        runtime,
        eventUnit,
        revived,
        event.payload.deathPosition ?? eventUnit.deathPosition,
      )
    ) {
      recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
      return;
    }
    event.payload.revived = true;
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${owner.name}复活${eventUnit.name}，以 LV${revived.level} ${revived.attack}/${revived.health}回到战场。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        unitId: revived.id,
        unitName: revived.name,
        unitSide: revived.side,
        sourceEffectId: effectId,
        revived: true,
      },
      {
        kind: "summon",
        title: `${eventUnit.name}被复活`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [revived.id],
        cues: [{ unitId: revived.id, text: "复活", tone: "buff" }],
        durationMs: 1650,
      },
    );
    dispatchBattleEvent(runtime, "unit:revive", { unit: revived, source: owner });
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: revived,
      side: owner.side,
      source: owner,
      sourceEffectId: effectId,
    });
    return;
  }
  if (
    effectId === "hero.caocao.jianxiong" &&
    event.type === "unit:death" &&
    eventUnit?.side === owner.side &&
    shareBattleBond(owner, eventUnit)
  ) {
    const target = pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, owner.side).filter(
        (unit) => unit !== owner && unit !== eventUnit,
      ),
      1,
    )[0];
    if (target) {
      const statGain = 4 * level;
      applyBattleUnitStatBonus(runtime, target, statGain, statGain, owner.name);
      recordHeroBattleSkill(
        runtime,
        owner,
        `${target.name}获得 +${statGain}/+${statGain}`,
        effectId,
        {
          targetUnitId: target.id,
          targetUnitName: target.name,
          attackGain: statGain,
          healthGain: statGain,
        },
      );
    }
    return;
  }
  if (effectId === "hero.xunyu.wangzuo-zhicai" && event.type === "unit:summon" && sharedEventUnit) {
    applyBattleUnitStatBonus(runtime, eventUnit, 4 * level, 4 * level, owner.name);
    return;
  }
  if (effectId === "hero.zhugeliang.yunchou" && event.type === "attack:after") {
    const friendlyAttacked = event.payload.attackers?.some(
      (attacker) => attacker.side === owner.side,
    );
    if (!friendlyAttacked) return;
    pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, owner.side).filter((unit) => unit !== owner),
      level,
    ).forEach((unit) => grantBattleExperience(runtime, unit, 1, owner, effectId));
    return;
  }
  if (effectId === "hero.guanyu.weizhen-huaxia" && event.type === "attack:after" && ownerAttacked) {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((target) =>
        applyNegativeStatus(runtime, target, "intimidated", {
          ownerSide: owner.side,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
      );
    return;
  }
  if (
    effectId === "hero.zhouyu.fengzhu-huoshi" &&
    event.type === "damage:before" &&
    event.payload.damage?.target?.side === enemySide &&
    ["status.burn-tick", "status.burn-ignite"].includes(
      event.payload.damage.sourceEffectId,
    )
  ) {
    const damage = event.payload.damage;
    const increase = damage.originalAmount * level;
    damage.amount += increase;
    damage.modifiers.push({
      effectId,
      sourceName: owner.name,
      amount: increase,
    });
    return;
  }
  if (effectId === "hero.zhangjiao.wulei-hongding" && event.type === "battle:start") {
    for (let hit = 0; hit < 5; hit += 1) {
      const target = pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), 1)[0];
      if (!target) break;
      dealBattleDamage(runtime, {
        source: owner,
        target,
        amount: Math.max(1, Math.floor(owner.attack * 0.1 * level)),
        sourceEffectId: effectId,
      });
    }
    return;
  }
  if (effectId === "hero.lvbu.tianxia-wushuang" && event.type === "attack:before" && ownerAttacked) {
    owner.statuses = {
      unparalleled: {
        targetCount: level,
        sourceEffectId: effectId,
        sourceName: owner.name,
      },
    };
    recordBattlePresentationLog(
      runtime,
      "status",
      `${owner.name}获得无双。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        targetUnitId: owner.id,
        targetName: owner.name,
        targetSide: owner.side,
        statusId: "unparalleled",
        statusName: STATUS_LABELS.unparalleled,
        sourceEffectId: effectId,
      },
      {
        kind: "status",
        title: `${owner.name}获得无双`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [owner.id],
        cues: [{ unitId: owner.id, text: "无双", tone: "status" }],
        durationMs: 1450,
      },
    );
  }
}

function applyBattleOperation(runtime, candidate, event, operation) {
  const damage = event.payload.damage;
  if (operation.type === "resolve-hero-skill" && candidate.owner) {
    resolveBattleHeroSkill(runtime, candidate, event);
    return;
  }
  if (operation.type === "resolve-rest-recovery") {
    resolveRestRecovery(runtime, event);
    return;
  }
  if (operation.type === "resolve-intimidated-damage") {
    resolveIntimidatedDamage(runtime, event);
    return;
  }
  if (operation.type === "resolve-unparalleled-cleave") {
    resolveUnparalleledCleave(runtime, event);
    return;
  }
  if (operation.type === "resolve-counterplot-revive") {
    resolveCounterplotRevive(runtime, event);
    return;
  }
  if (operation.type === "announce-equipment-ready" && candidate.owner) {
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}生效：相同触发条件下，其武将技能优先结算。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
      },
      {
        kind: "equipment",
        title: `${candidate.owner.name}的${candidate.sourceName}生效`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: candidate.sourceName,
            tone: "equipment",
          },
        ],
        durationMs: 1250,
      },
    );
    return;
  }

  if (operation.type === "summon-cavalry" && candidate.owner) {
    summonCavalry(runtime, candidate.owner.side, operation.count ?? 1, {
      attack: operation.attack ?? 1,
      health: operation.health ?? 1,
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
      summoner: candidate.owner,
      position: operation.position ?? "tail",
    });
    return;
  }

  if (operation.type === "apply-random-negative-status" && candidate.owner) {
    const enemySide = getOpposingSide(candidate.owner.side);
    const target = getBattleUnitsFromFront(runtime, enemySide)[0] ?? null;
    if (!target || target.health <= 0 || NEGATIVE_STATUS_POOL.length === 0) return;
    const statusId =
      NEGATIVE_STATUS_POOL[Math.floor(runtime.random() * NEGATIVE_STATUS_POOL.length)];
    applyNegativeStatus(runtime, target, statusId, {
      ownerSide: candidate.owner.side,
      summonFaction: candidate.owner.faction,
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
    });
    return;
  }

  if (operation.type === "grow-when-hurt-or-debuffed" && candidate.owner) {
    const triggerName = event.type === "status:apply" ? "获得负面状态" : "受到伤害";
    applyBattleUnitStatBonus(
      runtime,
      candidate.owner,
      operation.attack ?? 0,
      operation.health ?? 0,
      candidate.sourceName,
    );
    recordBattleLog(
      runtime,
      "equipment",
      `${candidate.owner.name}${triggerName}，${candidate.sourceName}使其 +${
        operation.attack ?? 0
      }/+${operation.health ?? 0}，当前 ${candidate.owner.attack}/${
        candidate.owner.health
      }。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        trigger: event.type,
      },
    );
    return;
  }

  if (
    operation.type === "resolve-imperial-jade-seal-death" &&
    candidate.owner?.side === "player"
  ) {
    const count = applyImperialJadeSealShopBonus(
      candidate.owner,
      getBattleUnitBonds(candidate.owner),
    );
    if (count > 0) {
      recordBattlePresentationLog(
        runtime,
        "equipment",
        `我方 ${candidate.owner.name}的${candidate.sourceName}结算${count}次，使商店中其羁绊武将永久 +${count}/+${count}。`,
        {
          ownerId: candidate.owner.id,
          ownerName: candidate.owner.name,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          triggerCount: count,
        },
        {
          kind: "equipment",
          title: `${candidate.sourceName}强化商店武将`,
          description: `同羁绊商店武将永久 +${count}/+${count}`,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          sourceIds: [candidate.owner.id],
          targetIds: [candidate.owner.id],
          cues: [
            {
              unitId: candidate.owner.id,
              text: `商店同羁绊 +${count}/+${count}`,
              tone: "equipment",
            },
          ],
          durationMs: 1550,
        },
      );
    }
    return;
  }

  if (operation.type === "block-damage-with-charges" && damage && candidate.owner) {
    const equipmentState = getEquipmentRuntimeState(
      candidate.owner,
      operation.charges ?? 0,
    );
    if (!equipmentState || equipmentState.remainingCharges <= 0 || damage.amount <= 0) return;
    const blocked = Math.min(operation.amount ?? 0, damage.amount);
    if (blocked <= 0) return;
    damage.amount -= blocked;
    equipmentState.remainingCharges -= 1;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: -blocked,
    });
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}抵挡 ${blocked} 点伤害，剩余 ${
        equipmentState.remainingCharges
      } 次。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        blocked,
        remainingCharges: equipmentState.remainingCharges,
      },
      {
        kind: "equipment",
        title: `${candidate.sourceName}抵挡 ${blocked} 点伤害`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: `抵挡 ${blocked} · 剩${equipmentState.remainingCharges}次`,
            tone: "equipment",
          },
        ],
        durationMs: 1350,
      },
    );
    return;
  }

  if (operation.type === "increase-damage-with-charges" && damage && candidate.owner) {
    const equipmentState = getEquipmentRuntimeState(
      candidate.owner,
      operation.charges ?? 0,
    );
    if (!equipmentState || equipmentState.remainingCharges <= 0) return;
    const increase = operation.amount ?? 0;
    damage.amount += increase;
    equipmentState.remainingCharges -= 1;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: increase,
    });
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}使本次攻击伤害 +${increase}，剩余 ${
        equipmentState.remainingCharges
      } 次。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        increase,
        remainingCharges: equipmentState.remainingCharges,
      },
      {
        kind: "equipment",
        title: `${candidate.sourceName}使伤害 +${increase}`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: `伤害 +${increase} · 剩${equipmentState.remainingCharges}次`,
            tone: "equipment",
          },
        ],
        durationMs: 1350,
      },
    );
    return;
  }

  if (operation.type === "resolve-wei-death") {
    resolveWeiBondDeath(runtime, candidate, event);
    return;
  }

  if (operation.type === "resolve-shu-upgrade") {
    resolveShuBattleUpgrade(runtime, candidate, event);
    return;
  }

  if (operation.type === "apply-wu-opening-burn") {
    resolveWuOpeningBurn(runtime, candidate, event);
    return;
  }

  if (operation.type === "resolve-burn-tick") {
    resolveBurnTick(runtime, event);
    return;
  }

  if (operation.type === "modify-battle-unit-stats" && candidate.owner) {
    applyBattleUnitStatBonus(
      runtime,
      candidate.owner,
      operation.attack ?? 0,
      operation.health ?? 0,
      candidate.sourceName,
    );
    recordBattleLog(
      runtime,
      "effect",
      `${candidate.owner.name}在攻击前获得 +${operation.attack ?? 0}/+${
        operation.health ?? 0
      }，当前 ${candidate.owner.attack}/${candidate.owner.health}。`,
      { effectId: candidate.effectId, ownerId: candidate.owner.id },
    );
    return;
  }

  if (operation.type === "modify-damage" && damage) {
    const before = damage.amount;
    damage.amount = Math.max(operation.minimum ?? 0, damage.amount + (operation.amount ?? 0));
    const appliedAmount = damage.amount - before;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: appliedAmount,
    });
    if (appliedAmount !== 0) {
      recordBattlePresentationLog(
        runtime,
        "equipment",
        `${candidate.owner?.name ?? damage.target.name}的${candidate.sourceName}使本次伤害${
          appliedAmount > 0 ? `增加 ${appliedAmount}` : `减少 ${Math.abs(appliedAmount)}`
        }。`,
        {
          ownerId: candidate.owner?.id ?? null,
          ownerName: candidate.owner?.name ?? null,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          damageChange: appliedAmount,
        },
        {
          kind: "equipment",
          title: `${candidate.sourceName}修正伤害`,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          sourceIds: [candidate.owner?.id],
          targetIds: [damage.target?.id],
          cues: [
            {
              unitId: damage.target?.id,
              text: `伤害${appliedAmount > 0 ? "+" : ""}${appliedAmount}`,
              tone: "equipment",
            },
          ],
          durationMs: 1250,
        },
      );
    }
    return;
  }

  if (operation.type === "modify-damage-by-bond-level" && damage) {
    const level = runtime.lockedBonds[candidate.ownerSide]?.[operation.faction] ?? 0;
    if (level <= 0) return;
    damage.amount += level;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: level,
    });
  }
}

function resolveEffectCandidate(runtime, candidate, event) {
  candidate.resolved = true;
  const stepCount = (runtime.chainSteps.get(event.chainId) ?? 0) + 1;
  runtime.chainSteps.set(event.chainId, stepCount);
  if (stepCount > MAX_EFFECT_CHAIN_STEPS) {
    runtime.abortedChains.add(event.chainId);
    runtime.queue = runtime.queue.filter((queued) => queued.chainId !== event.chainId);
    recordBattleLog(
      runtime,
      "error",
      `事件链 ${event.chainId} 超过 ${MAX_EFFECT_CHAIN_STEPS} 步，已停止后续结算。`,
      { eventId: event.id, chainId: event.chainId },
    );
    return;
  }
  candidate.resolvedAttack = candidate.owner?.attack ?? null;
  const previousCandidate = runtime.currentCandidate;
  runtime.currentCandidate = candidate;
  try {
    if (candidate.definition.sourceType === "hero" && candidate.owner) {
      const skillDescription = getHeroSkillDescriptionDisplay(
        candidate.effectId,
        candidate.owner,
      );
      const skillName = getHeroSkillName(candidate.effectId, candidate.owner);
      const entry = recordBattleLog(
        runtime,
        "hero-skill",
        `${candidate.owner.name}【${skillName}】触发（${getEventDisplayName(event.type)}）${
          skillDescription.text ? `：${skillDescription.text}` : ""
        }。`,
        {
          ownerId: candidate.owner.id,
          ownerName: candidate.owner.name,
          ownerSide: candidate.ownerSide,
          effectId: candidate.effectId,
          trigger: event.type,
          triggerName: getEventDisplayName(event.type),
          skillName,
          skillDescriptionHtml: skillDescription.html,
          resolvedAttack: candidate.resolvedAttack,
        },
      );
      recordBattlePresentationStep(runtime, {
        kind: "skill",
        title: `${candidate.owner.name} · ${skillName}`,
        description: `${getEventDisplayName(event.type)}，按当前 ${candidate.resolvedAttack} 攻击力结算`,
        entries: [entry],
        eventType: event.type,
        effectId: candidate.effectId,
        effectName: skillName,
        sourceIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: `【${skillName}】`,
            tone: "skill",
          },
        ],
        resolvedAttack: candidate.resolvedAttack,
        durationMs: 1450,
      });
    } else if (candidate.definition.sourceType === "bond") {
      const entry = recordBattleLog(
        runtime,
        "bond",
        `${candidate.sourceName}触发（${getEventDisplayName(event.type)}）。`,
        {
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          trigger: event.type,
          ownerSide: candidate.ownerSide,
        },
      );
      recordBattlePresentationStep(runtime, {
        kind: "bond",
        title: `${candidate.sourceName}触发`,
        entries: [entry],
        eventType: event.type,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        durationMs: 1250,
      });
    }
    candidate.definition.operations.forEach((operation) => {
      applyBattleOperation(runtime, candidate, event, operation);
    });
    runtime.structuredLog.push({
      type: "effect",
      eventId: event.id,
      chainId: event.chainId,
      parentEventId: event.parentEventId,
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      ownerId: candidate.owner?.id ?? null,
      ownerAttack: candidate.resolvedAttack,
      phase: runtime.phase,
      exchange: runtime.currentExchange,
    });
  } finally {
    runtime.currentCandidate = previousCandidate;
  }
}

function resolveBattleEvent(runtime, event) {
  const candidates = collectBattleEffectCandidates(runtime, event);
  while (!runtime.abortedChains.has(event.chainId)) {
    const candidate = chooseNextEffectCandidate(runtime, candidates, event);
    if (!candidate) break;
    resolveEffectCandidate(runtime, candidate, event);
  }
}

function resolveBattleDamage(runtime, { source, target, amount, type, sourceEffectId }) {
  const damage = {
    source,
    target,
    type,
    sourceEffectId,
    originalAmount: Math.max(0, amount),
    amount: Math.max(0, amount),
    finalAmount: 0,
    phase: runtime.phase,
    modifiers: [],
  };
  resolveImmediateBattleEvent(runtime, "damage:before", { damage });
  damage.finalAmount = Math.max(0, Math.floor(damage.amount));
  return damage;
}

function formatDamageModifiers(damage) {
  if (damage.modifiers.length === 0) return "";
  return `（${damage.modifiers
    .map((modifier) => `${modifier.sourceName}${modifier.amount >= 0 ? "+" : ""}${modifier.amount}`)
    .join("，")}）`;
}

function getBattleUnitSnapshot(unit) {
  return {
    id: unit.id,
    sourceId: unit.sourceId ?? null,
    name: unit.name,
    attack: unit.attack,
    health: unit.health,
    maxHealth: unit.maxHealth,
    faction: unit.faction,
    extraFactions: [...(unit.extraFactions ?? [])],
    tempExtraFactions: [...(unit.tempExtraFactions ?? [])],
    usesBondDefinitionSnapshot: true,
    tier: unit.tier,
    side: unit.side,
    skillEffectIds: [...(unit.skillEffectIds ?? [])],
    equipment: cloneDirectModifier(unit.equipment),
    statuses: cloneDirectModifier(unit.statuses ?? {}),
    level: unit.level ?? 1,
    experience: unit.experience ?? 0,
    copies: getUnitCopies(unit),
    bonusExperience: unit.bonusExperience ?? 0,
    isSummon: Boolean(unit.isSummon),
    skillDisabled: Boolean(unit.skillDisabled),
    skillDisabledUntilExchange: unit.skillDisabledUntilExchange ?? null,
  };
}

function simulateBasicBattle({ preBattleEntries = [] } = {}) {
  const seed = getBattleSeed();
  const player = getLineupUnits().map((unit, index) =>
    cloneBattleUnit(unit, { side: "player", index }),
  );
  const enemySetup = createEnemyBattleSetup();
  const enemy = enemySetup.team;
  const lockedBonds = {
    player: getLockedPlayerBondLevels(),
    enemy: enemySetup.lockedBonds,
  };
  return simulateBattleScenario({
    player,
    enemy,
    seed,
    lockedBonds,
    enemySource: enemySetup.source,
    preBattleEntries,
    battleRound: state.round,
  });
}

function simulateBattleScenario({
  player,
  enemy,
  seed,
  lockedBonds,
  enemySource = { type: "custom" },
  preBattleEntries = [],
  battleRound = state.round,
  maxExchanges = 100,
}) {
  const playerStart = player.map(getBattleUnitSnapshot);
  const enemyStart = enemy.map(getBattleUnitSnapshot);
  const roundSnapshots = [];
  const runtime = createBattleRuntime(player, enemy, { seed, lockedBonds });
  const preparationEntries = [];
  preparationEntries.push(recordBattleLog(
    runtime,
    "system",
    `技能结算底座已启动，战斗随机种子 ${seed}；魏、蜀、吴、群羁绊等级已在战前锁定。`,
    { seed },
  ));
  preparationEntries.push(recordBattleLog(
    runtime,
    "system",
    enemySource.type === "opponent-pool"
      ? `敌方从对手数据池抽取「${enemySource.label}」，使用其第 ${enemySource.round} 回合快照。`
      : enemySource.type === "cavalry-fallback"
        ? `对手数据池缺失或无效，敌方使用第 ${battleRound} 回合测试骑兵阵容。`
        : "敌方阵容已就位。",
    { enemySource },
  ));
  preBattleEntries.forEach((entry) => {
    preparationEntries.push(recordBattleLog(
      runtime,
      entry.type ?? "effect",
      entry.message,
      {
        sourceEffectId: entry.sourceEffectId ?? null,
        sourceName: entry.sourceName ?? "",
        ownerId: entry.ownerId ?? null,
        trigger: entry.trigger ?? "round:end",
        phase: "round:end",
      },
    ));
  });

  BOND_FACTIONS.forEach((faction) => {
    const level = lockedBonds.player[faction] ?? 0;
    if (level <= 0) return;
    preparationEntries.push(recordBattleLog(
      runtime,
      "bond",
      `${BOND_RULES[faction].label} LV${level} 已锁定，本场战斗不再变化。`,
      { faction, level },
    ));
  });
  recordBattlePresentationStep(runtime, {
    kind: "ready",
    title: "双方阵容就位",
    description: "先锁定战斗副本与羁绊，再依次结算战斗开始技能",
    entries: preparationEntries,
    phase: "battle:start",
    durationMs: 1600,
  });

  dispatchBattleEvent(runtime, "battle:start", { player, enemy });
  dispatchBattleEvent(runtime, "battle:start:end", { player, enemy });
  recordBattlePresentationStep(runtime, {
    kind: "timing",
    title: "战斗开始技能结算完毕",
    description: "进入正常交锋",
    phase: "battle:start:end",
    eventType: "battle:start:end",
    durationMs: 900,
  });
  runtime.phase = "battle";

  if (player.length === 0) {
    const resultEntry = recordBattleLog(
      runtime,
      "result",
      "我方没有上阵武将，战斗失败。",
      { result: "loss" },
    );
    recordBattlePresentationStep(runtime, {
      kind: "result",
      title: "我方战斗失败",
      entries: [resultEntry],
      phase: "battle:end",
      durationMs: 2400,
    });
    return {
      result: "loss",
      playerStart,
      enemyStart,
      playerEnd: player.map(getBattleUnitSnapshot),
      enemyEnd: enemy.map(getBattleUnitSnapshot),
      roundSnapshots,
      log: runtime.log,
      structuredLog: runtime.structuredLog,
      presentationTimeline: runtime.presentationTimeline,
      seed,
      lockedBonds,
      enemySource,
      selectedExchange: 0,
    };
  }

  let exchange = 1;
  while (player.length > 0 && enemy.length > 0 && exchange <= maxExchanges) {
    runtime.currentExchange = exchange;
    roundSnapshots.push({
      exchange,
      player: player.map(getBattleUnitSnapshot),
      enemy: enemy.map(getBattleUnitSnapshot),
    });
    const ally = getBattleFrontUnit(player, "player");
    const foe = getBattleFrontUnit(enemy, "enemy");
    runtime.currentAttackers = [ally, foe];
    dispatchBattleEvent(runtime, "attack:before", { attackers: [ally, foe], exchange });
    const allyHealthBefore = ally.health;
    const foeHealthBefore = foe.health;
    const allyAttackDamage = Math.max(1, ally.attack);
    const foeAttackDamage = Math.max(1, foe.attack);

    const damageToEnemy = resolveBattleDamage(runtime, {
      source: ally,
      target: foe,
      amount: allyAttackDamage,
      type: "attack",
      sourceEffectId: "system.basic-attack",
    });
    const damageToPlayer = resolveBattleDamage(runtime, {
      source: foe,
      target: ally,
      amount: foeAttackDamage,
      type: "attack",
      sourceEffectId: "system.basic-attack",
    });

    foe.health -= damageToEnemy.finalAmount;
    ally.health -= damageToPlayer.finalAmount;
    if (damageToEnemy.finalAmount > 0) {
      foe.lastDamageSource = ally;
      foe.lastDamageEffectId = "system.basic-attack";
    }
    if (damageToPlayer.finalAmount > 0) {
      ally.lastDamageSource = foe;
      ally.lastDamageEffectId = "system.basic-attack";
    }
    [ally, foe]
      .filter((unit) => unit.health <= 0)
      .forEach((unit) => runtime.deferredDeathIds.add(unit.id));
    const clashEntry = recordBattleLog(
      runtime,
      "exchange",
      `第${exchange}次交锋：${ally.name}造成${damageToEnemy.finalAmount}点伤害${formatDamageModifiers(
        damageToEnemy,
      )}，${foe.name}造成${damageToPlayer.finalAmount}点伤害${formatDamageModifiers(
        damageToPlayer,
      )}。`,
      {
        exchange,
        damageToEnemy,
        damageToPlayer,
        allyHealthBefore,
        foeHealthBefore,
        allyHealthAfter: ally.health,
        foeHealthAfter: foe.health,
      },
    );
    recordBattlePresentationStep(runtime, {
      kind: "clash",
      title: `第 ${exchange} 轮 · 双方同时攻击`,
      description: `${ally.name}与${foe.name}的普通攻击在同一步同时扣血`,
      entries: [clashEntry],
      phase: "battle",
      exchange,
      eventType: "basic-attack",
      effectId: "system.basic-attack",
      effectName: "普通交锋",
      sourceIds: [ally.id, foe.id],
      targetIds: [ally.id, foe.id],
      actorIds: [ally.id, foe.id],
      cues: [
        {
          unitId: ally.id,
          text: `-${damageToPlayer.finalAmount}`,
          tone: "damage",
        },
        {
          unitId: foe.id,
          text: `-${damageToEnemy.finalAmount}`,
          tone: "damage",
        },
      ],
      simultaneous: true,
      durationMs: 2200,
    });

    dispatchBattleEvent(runtime, "damage:after", { damage: damageToEnemy, exchange });
    dispatchBattleEvent(runtime, "damage:after", { damage: damageToPlayer, exchange });
    dispatchBattleEvent(runtime, "attack:after", {
      attackers: [ally, foe],
      attackPairs: [
        { source: ally, target: foe, damage: damageToEnemy },
        { source: foe, target: ally, damage: damageToPlayer },
      ],
      exchange,
    });
    runtime.deferredDeathIds.clear();
    resolveAllBattleDeaths(runtime, exchange);
    runtime.currentAttackers = null;
    recordBattleLog(
      runtime,
      "round-summary",
      `第${exchange}次交锋结束：${ally.name} ${Math.max(0, ally.health)} 生命，${
        foe.name
      } ${Math.max(0, foe.health)} 生命。`,
      {
        exchange,
        ally: {
          id: ally.id,
          name: ally.name,
          healthBefore: allyHealthBefore,
          healthAfter: Math.max(0, ally.health),
          alive: ally.health > 0,
        },
        foe: {
          id: foe.id,
          name: foe.name,
          healthBefore: foeHealthBefore,
          healthAfter: Math.max(0, foe.health),
          alive: foe.health > 0,
        },
        damageToEnemy,
        damageToPlayer,
      },
    );
    exchange += 1;
  }

  runtime.currentExchange = null;
  runtime.phase = "battle:end";
  const result =
    player.length > 0 && enemy.length === 0
      ? "win"
      : enemy.length > 0 && player.length === 0
        ? "loss"
        : "draw";
  dispatchBattleEvent(runtime, "battle:end", { result });
  const resultEntry = recordBattleLog(
    runtime,
    "result",
    result === "win" ? "战斗胜利。" : result === "loss" ? "战斗失败。" : "战斗平局。",
    { result },
  );
  recordBattlePresentationStep(runtime, {
    kind: "result",
    title:
      result === "win"
        ? "我方取得胜利"
        : result === "loss"
          ? "我方战斗失败"
          : "本场战斗平局",
    entries: [resultEntry],
    phase: "battle:end",
    durationMs: 2400,
  });
  return {
    result,
    playerStart,
    enemyStart,
    playerEnd: player.map(getBattleUnitSnapshot),
    enemyEnd: enemy.map(getBattleUnitSnapshot),
    roundSnapshots,
    log: runtime.log,
    structuredLog: runtime.structuredLog,
    presentationTimeline: runtime.presentationTimeline,
    seed,
    lockedBonds,
    enemySource,
    selectedExchange: 0,
  };
}

function endTurn() {
  if (state.phase !== "shop") return;
  if (state.pendingHeroBondChoice) {
    notify("请先完成司马徽的额外羁绊选择。");
    return;
  }
  resolvingEndTurn = true;
  const effectEventStart = state.effectEvents.length;
  const previousBondLevels = getShopBondLevelSnapshot();
  dispatchShopEvent("round:end", { round: state.round });
  dispatchShopBondLevelChanges(previousBondLevels);
  pendingEndTurnReportEntries = state.effectEvents
    .slice(effectEventStart)
    .filter((entry) => entry.message)
    .map((entry) => ({
      ...entry,
      type: entry.sourceEffectId?.startsWith("bond.") ? "bond" : "hero-skill",
    }));
  recordCurrentPlayerLineup();
  state.phase = "end-turn";
  render();
}

function startNextRound() {
  if (state.gameOver) {
    resetDemo();
    return;
  }
  if (state.gameOutcome) {
    state.gameOver = true;
    render();
    return;
  }
  state.round += 1;
  state.phase = "shop";
  state.gold = TURN_GOLD;
  state.battle = null;
  const previousBondLevels = getShopBondLevelSnapshot();
  clearTemporaryBonds();
  dispatchShopBondLevelChanges(previousBondLevels);
  addLog(`第 ${state.round} 回合开始，获得 ${TURN_GOLD} 金币。`);
  if (state.round === ROUND_THREE_LIFE_RECOVERY_ROUND) {
    const previousLife = state.life;
    state.life = getLifeAfterRoundStart(state.life, state.round);
    const recoveredLife = state.life - previousLife;
    addLog(
      recoveredLife > 0
        ? `第 3 回合生命补给，生命 +${recoveredLife}（${state.life}/${PLAYER_MAX_LIFE}）。`
        : `第 3 回合生命补给触发，生命已达上限 ${PLAYER_MAX_LIFE}。`,
    );
  }
  dispatchShopEvent("round:start", { round: state.round });
  refreshShop({ free: true });
}

function resetDemo() {
  closeCodex({ restoreFocus: false });
  window.clearTimeout(shopPresentationTimer);
  shopPresentationTimer = 0;
  queuedShopBonusAnimations = [];
  queuedShopUpgradeAnimations = [];
  pendingEndTurnReportEntries = [];
  resolvingEndTurn = false;
  previousRenderedBondLevels = null;
  queuedBondUpgradeCelebrations = [];
  clearBondUpgradeEffects();
  clearAllBondSelectionHints();
  state = createInitialState();
  refreshShop({ free: true });
}

function addLog(message) {
  if (state.playerDataTest) {
    state.playerDataTest.operations.push({
      sequence: state.playerDataTest.operations.length + 1,
      round: state.round,
      phase: state.phase,
      recordedAt: new Date().toISOString(),
      message,
    });
  }
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
  return `${unit.tier} 阶 · ${unit.level} 级 ${unit.experience ?? 0} 经验 · ${unit.attack}/${unit.health}`;
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
  Object.values(state.heroBondDefinitions ?? {}).forEach((definition) => {
    definition.tempExtraFactions = [];
  });
  state.lineup.forEach((unit) => {
    if (unit) unit.tempExtraFactions = [];
  });
  state.shop.forEach((card) => {
    if (card?.type !== "hero") return;
    card.tempExtraFactions = [];
    syncShopHeroCardBonuses(card);
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

function getHeroBondDefinition(heroName) {
  const definition = state.heroBondDefinitions?.[heroName];
  return {
    extraFactions: [...(definition?.extraFactions ?? [])],
    tempExtraFactions: [...(definition?.tempExtraFactions ?? [])],
  };
}

function ensureHeroBondDefinition(heroName) {
  state.heroBondDefinitions ??= {};
  state.heroBondDefinitions[heroName] ??= {
    extraFactions: [],
    tempExtraFactions: [],
  };
  return state.heroBondDefinitions[heroName];
}

function getShopBondBonus(faction) {
  return state.shopBondBonuses?.[faction] ?? { attack: 0, health: 0 };
}

function addShopBondBonus(faction, attack, health) {
  state.shopBondBonuses ??= {};
  const current = getShopBondBonus(faction);
  const next = {
    attack: current.attack + Math.max(0, attack),
    health: current.health + Math.max(0, health),
  };
  state.shopBondBonuses[faction] = next;
  return next;
}

function getImperialJadeSealTriggerCount(unit) {
  const isYuanShu =
    unit?.name === "袁术" &&
    unit.skillEffectIds?.includes("hero.yuanshu.yuxi");
  return 1 + (isYuanShu ? Math.max(1, unit.level ?? 1) : 0);
}

function applyImperialJadeSealShopBonus(unit, bonds) {
  const factions = normalizeBondTags(bonds);
  if (factions.length === 0) return 0;
  const count = getImperialJadeSealTriggerCount(unit);
  factions.forEach((faction) => addShopBondBonus(faction, count, count));
  state.shop.forEach((card) => syncShopHeroCardBonuses(card));
  return count;
}

function getShopBondBonusTotals(card) {
  return getBaseUnitBonds(card).reduce(
    (total, faction) => {
      const bonus = getShopBondBonus(faction);
      total.attack += bonus.attack;
      total.health += bonus.health;
      return total;
    },
    { attack: 0, health: 0 },
  );
}

function syncShopHeroCardBonuses(card) {
  if (!card || card.type !== "hero") return false;
  const previousBodyAttackBonus = card.bodyAttackBonus ?? 0;
  const previousBodyHealthBonus = card.bodyHealthBonus ?? 0;
  card.baseAttack ??= card.attack - previousBodyAttackBonus;
  card.baseHealth ??= card.health - previousBodyHealthBonus;
  card.intrinsicBodyAttackBonus ??=
    previousBodyAttackBonus - (card.shopBondAttackBonus ?? 0);
  card.intrinsicBodyHealthBonus ??=
    previousBodyHealthBonus - (card.shopBondHealthBonus ?? 0);
  const shopBonus = getShopBondBonusTotals(card);
  card.shopBondAttackBonus = shopBonus.attack;
  card.shopBondHealthBonus = shopBonus.health;
  card.bodyAttackBonus = card.intrinsicBodyAttackBonus + shopBonus.attack;
  card.bodyHealthBonus = card.intrinsicBodyHealthBonus + shopBonus.health;
  card.attack = Math.min(50, card.baseAttack + card.bodyAttackBonus);
  card.health = Math.min(50, card.baseHealth + card.bodyHealthBonus);
  return true;
}

function syncHeroBondDefinitionInstances(heroName) {
  const definition = getHeroBondDefinition(heroName);
  state.lineup.forEach((unit) => {
    if (!unit || unit.name !== heroName) return;
    unit.extraFactions = [...definition.extraFactions];
    unit.tempExtraFactions = [...definition.tempExtraFactions];
  });
  state.shop.forEach((card) => {
    if (card?.type !== "hero" || card.name !== heroName) return;
    card.extraFactions = [...definition.extraFactions];
    card.tempExtraFactions = [...definition.tempExtraFactions];
    syncShopHeroCardBonuses(card);
  });
}

function getBaseUnitBonds(unit) {
  if (!unit) return [];
  const definition = unit.usesBondDefinitionSnapshot
    ? { extraFactions: [], tempExtraFactions: [] }
    : getHeroBondDefinition(unit.name);
  return normalizeBondTags([
    unit.faction,
    ...definition.extraFactions,
    ...definition.tempExtraFactions,
    ...(unit.extraFactions ?? []),
    ...(unit.tempExtraFactions ?? []),
  ]);
}

function getHighlightedBondFactions() {
  return new Set(Array.from(bondSelectionHintSources.values()).flat());
}

function applyBondSelectionHints() {
  const highlighted = getHighlightedBondFactions();
  elements.bondList?.querySelectorAll(".bond-card").forEach((card) => {
    const isHighlighted = highlighted.has(card.dataset.faction);
    card.classList.toggle("card-selection-hint", isHighlighted);
    card.setAttribute("aria-highlighted", isHighlighted ? "true" : "false");
  });
}

function setBondSelectionHintSource(source, factions) {
  const normalized = normalizeBondTags(factions ?? []);
  if (normalized.length > 0) {
    bondSelectionHintSources.set(source, normalized);
  } else {
    bondSelectionHintSources.delete(source);
  }
  applyBondSelectionHints();
}

function clearAllBondSelectionHints() {
  bondSelectionHintSources.clear();
  applyBondSelectionHints();
}

function bindCardBondSelectionHint(element, card, sourcePrefix) {
  const factions = getBaseUnitBonds(card);
  if (!element || factions.length === 0) return;

  element.addEventListener("pointerenter", () => {
    setBondSelectionHintSource(`${sourcePrefix}-hover`, factions);
  });
  element.addEventListener("pointerleave", () => {
    setBondSelectionHintSource(`${sourcePrefix}-hover`, []);
  });
  element.addEventListener("focusin", () => {
    setBondSelectionHintSource(`${sourcePrefix}-focus`, factions);
  });
  element.addEventListener("focusout", (event) => {
    if (!element.contains(event.relatedTarget)) {
      setBondSelectionHintSource(`${sourcePrefix}-focus`, []);
    }
  });
}

function getEffectiveUnitBonds(unit, index = -1) {
  return getBaseUnitBonds(unit);
}

function addExtraBond(unit, faction, { temporary = false } = {}) {
  if (!BOND_RULES[faction]) return false;
  if (getBaseUnitBonds(unit).includes(faction)) return false;
  if (getBaseUnitBonds(unit).length >= MAX_UNIT_BONDS) return false;

  const key = temporary ? "tempExtraFactions" : "extraFactions";
  const definition = ensureHeroBondDefinition(unit.name);
  definition[key] = normalizeBondTags([...(definition[key] ?? []), faction]);
  syncHeroBondDefinitionInstances(unit.name);
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
  return BOND_RULES[faction]?.label ?? "无羁绊";
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

function getShopFixedSlotRects() {
  return Array.from({ length: SHOP_POSITION_COUNT }, (_, index) => ({
    x: SHOP_POSITION_X[index],
    y: -210,
    w: 210,
    h: 270,
  }));
}

function getShopPositionIndex(index, round) {
  const rule = getShopRule(round);
  const standardSlotCount = rule.heroSlots + rule.itemSlots;

  if (index < rule.heroSlots) return index;
  if (index < standardSlotCount) {
    const itemOffset = index - rule.heroSlots;
    return SHOP_POSITION_COUNT - rule.itemSlots + itemOffset;
  }

  const rewardOffset = index - standardSlotCount;
  return SHOP_OVERFLOW_SLOT_INDICES[
    Math.min(rewardOffset, SHOP_OVERFLOW_SLOT_INDICES.length - 1)
  ];
}

function getShopSlotRects(cards, round) {
  const fixedRects = getShopFixedSlotRects();
  return cards.map((card, index) => fixedRects[getShopPositionIndex(index, round)]);
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

function createHeroCardMarkup(
  hero,
  { showCost = false, lineupIndex = null, battleSnapshot = false } = {},
) {
  const isLineupUnit = Number.isInteger(lineupIndex);
  const showOwnedDetails = isLineupUnit || battleSnapshot;
  const fateMarkup = createHeroFateMarkup(hero, isLineupUnit ? lineupIndex : null);
  const portraitImage = hero.image ?? HERO_IMAGE_BY_NAME[hero.name] ?? "";
  const heroEffectId = hero.effectId ?? hero.skillEffectIds?.[0] ?? null;
  const equipment = battleSnapshot ? hero.equipment ?? null : isLineupUnit ? getUnitEquipment(hero) : null;
  const equipmentSkillDisplay = equipment
    ? resolveHeroSkillDisplay(equipment.skill, 1, hero)
    : null;
  const remainingEquipmentCharges = equipment?.runtime?.remainingCharges;
  const equipmentRuntimeLabel =
    battleSnapshot && Number.isFinite(remainingEquipmentCharges)
      ? `，剩余${remainingEquipmentCharges}次`
      : "";
  const level = hero.level ?? 1;
  const experience = hero.experience ?? 0;
  const skillDisplay = resolveHeroSkillDisplay(hero.skill, level, hero);
  const experienceNeeded = getExperienceNeeded(level);
  const experienceProgress =
    level >= MAX_UNIT_LEVEL ? 100 : Math.round((experience / experienceNeeded) * 100);
  const progressionLabel =
    level >= MAX_UNIT_LEVEL ? `${level}级，满级` : `${level}级，${experience}/${experienceNeeded}经验`;
  const progressionMarkup = showOwnedDetails
    ? `
      <div class="hero-progression" aria-label="${progressionLabel}">
        <div class="hero-level-text">LV${level}</div>
        <div class="hero-exp-track" style="--exp-progress: ${experienceProgress}%">
          <img class="hero-exp-base" src="res/ShopPanel/exp-bar-base.png" alt="" />
          <img class="hero-exp-fill" src="res/ShopPanel/exp-bar-fill.png" alt="" />
        </div>
      </div>
    `
    : "";
  const bondLabel = (Number.isInteger(lineupIndex) ? getEffectiveUnitBonds(hero, lineupIndex) : getBaseUnitBonds(hero))
    .map(getFateLabel)
    .join("、") || "无羁绊";
  const portraitContent = portraitImage
    ? `<img class="hero-portrait" src="${portraitImage}" alt="${hero.name}" />`
    : `<div class="hero-portrait-placeholder" aria-hidden="true">${hero.name.slice(0, 1)}</div>`;
  const portraitMarkup = `<div class="hero-portrait-viewport">${portraitContent}</div>`;
  const equipmentMarkup = showOwnedDetails
    ? `
      <div class="hero-equipment-slot ${equipment ? "equipped" : "empty"}" aria-label="${
        equipment
          ? battleSnapshot
            ? `已装备${equipment.name}${equipmentRuntimeLabel}`
            : `已装备${equipment.name}，可拖拽移动、交换或出售`
          : "空装备槽"
      }">
        ${
          equipment
            ? `<img class="hero-equipment-icon" src="${equipment.image}" alt="${equipment.name}" />
               ${
                 Number.isFinite(remainingEquipmentCharges)
                   ? `<span class="battle-equipment-charges">${remainingEquipmentCharges}</span>`
                   : ""
               }
               <div class="hero-equipment-tooltip">
                 <strong>${equipment.name}</strong>
                 ${equipmentSkillDisplay?.html ?? escapeBattleReportHtml(equipment.skill)}
                 ${equipmentRuntimeLabel ? `<em>${equipmentRuntimeLabel.slice(1)}</em>` : ""}
               </div>`
            : ""
        }
      </div>
    `
    : "";
  const statusEntries = showOwnedDetails ? getBattleUnitStatusEntries(hero) : [];
  const statusNames = statusEntries.map((status) => status.label);
  const statusClassNames = statusEntries
    .map((status) => ` has-status-${status.id}`)
    .join("");
  const statusMarkup =
    statusEntries.length > 0
      ? `<div class="hero-card-status-effects" role="img" aria-label="状态特效：${statusNames.join("、")}">${statusEntries
          .map(
            (status, index) =>
              `<span class="hero-card-status-effect status-effect-${status.id}" style="--status-offset: ${index * 3}px" aria-hidden="true"></span>`,
          )
          .join("")}</div>`
      : "";

  return `
    <div class="hero-card${battleSnapshot ? " battle-snapshot-card" : ""}${statusEntries.length > 0 ? " has-status-effect" : ""}${statusClassNames}" tabindex="0" aria-label="${hero.name}，${hero.isLocked ? "已锁定，" : ""}${showOwnedDetails ? `${progressionLabel}，` : ""}${bondLabel}，${equipment ? `装备${equipment.name}，` : ""}${statusNames.length > 0 ? `状态${statusNames.join("、")}，` : ""}${skillDisplay.text}">
      ${portraitMarkup}
      <div class="hero-nameplate">${hero.name}</div>
      ${showCost ? `<div class="hero-cost"><img src="res/HeroCard/coin_no_diamond_preview2.png" alt="" /><span>${hero.cost}</span></div>` : ""}
      ${hero.isReward ? `<div class="reward-badge">升级奖励</div>` : ""}
      ${progressionMarkup}
      ${equipmentMarkup}
      ${statusMarkup}
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
      <div class="hero-skill-tooltip"><strong>技能描述</strong>${skillDisplay.html}</div>
      ${hero.isLocked ? '<div class="shop-card-lock-overlay" aria-hidden="true"><span>锁定</span></div>' : ""}
    </div>
  `;
}

function createItemCardMarkup(item, { showDragHint = true } = {}) {
  const dragHint =
    item.category === "装备"
      ? "拖到阵容武将的空装备槽购买"
      : item.targetMode === "unit"
        ? "拖到一名阵容武将上使用"
        : "拖到任意阵容位使用";
  return `
    <div class="item-card" tabindex="0" aria-label="${item.name}，${item.isLocked ? "已锁定，" : ""}${item.skill}">
      <img class="item-icon" src="${item.image}" alt="${item.name}" />
      <div class="item-nameplate">${item.name}</div>
      <div class="item-cost">
        <img src="res/HeroCard/coin_no_diamond_preview2.png" alt="" />
        <span>${item.cost}</span>
      </div>
      <img class="item-wave" src="res/HeroCard/wave.png" alt="" />
      <div class="item-stars">${createTierStars(item.tier ?? 1)}</div>
      <div class="item-type-tag">${item.category ?? "装备/计策"}</div>
      <div class="item-skill-tooltip"><strong>${item.category ?? "装备/计策"}描述</strong>${item.skill}${showDragHint ? `<em>${dragHint}</em>` : ""}</div>
      ${item.isLocked ? '<div class="shop-card-lock-overlay" aria-hidden="true"><span>锁定</span></div>' : ""}
    </div>
  `;
}

function getCodexEntries() {
  const matchesTier = (entry) =>
    codexFilters.tier === "全部" || entry.tier === codexFilters.tier;
  const entries = [];

  if (codexFilters.type === "全部" || codexFilters.type === "武将") {
    entries.push(
      ...CARD_POOLS.hero
        .filter(
          (hero) =>
            matchesTier(hero) &&
            (codexFilters.type !== "武将" ||
              codexFilters.faction === "全部" ||
              hero.faction === codexFilters.faction),
        )
        .map((hero) => ({ ...hero, codexType: "武将" })),
    );
  }

  if (codexFilters.type !== "武将") {
    entries.push(
      ...CARD_POOLS.stratagem
        .filter(
          (item) =>
            matchesTier(item) &&
            (codexFilters.type === "全部" || item.category === codexFilters.type),
        )
        .map((item) => ({ ...item, codexType: item.category })),
    );
  }

  return entries;
}

function getCodexTypeTotal() {
  if (codexFilters.type === "全部") {
    return CARD_POOLS.hero.length + CARD_POOLS.stratagem.length;
  }
  if (codexFilters.type === "武将") return CARD_POOLS.hero.length;
  return CARD_POOLS.stratagem.filter((item) => item.category === codexFilters.type).length;
}

function createCodexCardView(entry) {
  if (entry.codexType === "武将") {
    return {
      ...entry,
      type: "hero",
      cost: entry.cost ?? HERO_COST,
      image: entry.image ?? HERO_IMAGE_BY_NAME[entry.name] ?? "",
      usesBondDefinitionSnapshot: true,
      extraFactions: [],
      tempExtraFactions: [],
    };
  }
  return {
    ...entry,
    type: "stratagem",
    cost:
      entry.cost ??
      (entry.category === "计策" ? STRATAGEM_COST : ITEM_COST),
    image: entry.image ?? "res/item_icon/50100010.png",
  };
}

function renderCodexFilters() {
  elements.codexTypeFilters?.querySelectorAll("[data-codex-type]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      button.dataset.codexType === codexFilters.type ? "true" : "false",
    );
  });
  elements.codexTierFilters?.querySelectorAll("[data-codex-tier]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      button.dataset.codexTier === String(codexFilters.tier)
        ? "true"
        : "false",
    );
  });
  if (elements.codexFactionFilterGroup) {
    elements.codexFactionFilterGroup.hidden = codexFilters.type !== "武将";
  }
  elements.codexFactionFilters
    ?.querySelectorAll("[data-codex-faction]")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.dataset.codexFaction === codexFilters.faction ? "true" : "false",
      );
    });
}

function renderCodex() {
  if (!elements.codexGrid) return;
  renderCodexFilters();
  const entries = getCodexEntries();
  const tierLabel =
    codexFilters.tier === "全部" ? "全部阶数" : `${codexFilters.tier}阶`;
  const typeLabel =
    codexFilters.type === "全部" ? "全部卡牌" : codexFilters.type;
  const factionLabel =
    codexFilters.type === "武将" && codexFilters.faction !== "全部"
      ? ` · ${codexFilters.faction}羁绊`
      : "";
  if (elements.codexCount) {
    elements.codexCount.innerHTML = `${tierLabel}${factionLabel} · 当前 <strong>${entries.length}</strong> 张 / ${typeLabel}总计 ${getCodexTypeTotal()} 张`;
  }

  elements.codexGrid.replaceChildren();
  if (entries.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "codex-empty-state";
    const emptyTypeLabel =
      codexFilters.type === "全部" ? "卡牌" : codexFilters.type;
    emptyState.innerHTML = `<div><strong>暂无对应卡牌</strong><span>${tierLabel}没有符合当前筛选条件的${emptyTypeLabel}。</span></div>`;
    elements.codexGrid.append(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => {
    const card = createCodexCardView(entry);
    const shell = document.createElement("article");
    shell.className = "codex-card-shell";
    shell.setAttribute("aria-label", `${card.name}图鉴卡牌`);
    shell.innerHTML =
      card.type === "hero"
        ? createHeroCardMarkup(card, { showCost: true })
        : createItemCardMarkup(card, { showDragHint: false });
    fragment.append(shell);
  });
  elements.codexGrid.append(fragment);
}

function openCodex() {
  if (!elements.codexOverlay) return;
  Object.assign(codexFilters, {
    type: "全部",
    tier: "全部",
    faction: "全部",
  });
  renderCodex();
  elements.codexOverlay.hidden = false;
  elements.codexCloseButton?.focus();
}

function closeCodex({ restoreFocus = true } = {}) {
  if (!elements.codexOverlay || elements.codexOverlay.hidden) return;
  elements.codexOverlay.hidden = true;
  if (restoreFocus) elements.codexButton?.focus();
}

function renderShop() {
  setBondSelectionHintSource("shop-hover", []);
  setBondSelectionHintSource("shop-focus", []);
  elements.shopGrid.replaceChildren();
  const lineupHeroNames =
    state.phase === "shop"
      ? new Set(state.lineup.filter(Boolean).map((unit) => unit.name))
      : new Set();
  const fixedSlotRects = getShopFixedSlotRects();
  const slotRects = getShopSlotRects(state.shop, state.round);
  const usedPositionIndices = new Set(
    state.shop.map((card, index) => getShopPositionIndex(index, state.round)),
  );

  fixedSlotRects.forEach((rect, positionIndex) => {
    if (usedPositionIndices.has(positionIndex)) return;
    const placeholder = document.createElement("article");
    placeholder.className = "slot shop-slot-shell shop-slot-placeholder disabled";
    placeholder.setAttribute("aria-hidden", "true");
    applyShopPanelRect(placeholder, rect);

    const body = document.createElement("div");
    body.className = "slot-body";
    placeholder.append(body);
    elements.shopGrid.append(placeholder);
  });

  state.shop.forEach((card, index) => {
    const enabled = isRefreshSlot(index, state.round);
    const slot = document.createElement("article");
    slot.className = [
      "slot",
      "shop-slot-shell",
      enabled ? "enabled" : "disabled",
      card ? "draggable-card" : "",
    ].join(" ");
    applyShopPanelRect(slot, slotRects[index]);
    if (card) {
      slot.draggable = false;
      slot.dataset.cardId = card.id;
      slot.dataset.cardType = card.type;
      slot.classList.toggle("shop-card-locked", card.isLocked);
      slot.classList.toggle(
        "lineup-name-match",
        card.type === "hero" && lineupHeroNames.has(card.name),
      );
      slot.title = card.isLocked
        ? "已锁定：右键解除锁定"
        : "右键锁定，刷新时保留";
      slot.addEventListener("contextmenu", (event) => {
        if (state.phase !== "shop") return;
        event.preventDefault();
        card.isLocked = !card.isLocked;
        addLog(`${card.name}${card.isLocked ? "已锁定" : "已解除锁定"}。`);
        render();
      });
      slot.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target.closest("button") || state.phase !== "shop") return;
        event.preventDefault();
        resetLineupDragDirection();
        pointerDraggedShopIndex = index;
        pointerDraggedLineupIndex = null;
        pointerDraggedEquipmentIndex = null;
        pointerMoved = false;
        setBondSelectionHintSource(
          "shop-drag",
          card.type === "hero" ? getBaseUnitBonds(card) : [],
        );
        startDragPreview(
          slot.querySelector(".hero-card, .item-card"),
          event.clientX,
          event.clientY,
        );
      });
    }

    const header = document.createElement("div");
    header.className = "slot-index";
    header.innerHTML = `<span>${index + 1} 号位</span><span class="slot-type">${card?.type === "hero" ? "武将" : card?.category ?? "装备/计策"}</span>`;

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
      body.setAttribute("aria-label", "空商店槽位");
    }

    const actions = document.createElement("div");
    actions.className = "slot-actions";

    slot.append(header, body, actions);
    if (card?.type === "hero") {
      bindCardBondSelectionHint(body.querySelector(".hero-card"), card, "shop");
    }
    elements.shopGrid.append(slot);
  });
}

function renderLineup() {
  elements.lineupGrid.replaceChildren();
  state.lineup.forEach((unit, index) => {
    const slot = document.createElement("article");
    slot.className = "slot lineup-slot enabled";
    slot.draggable = false;
    applyLocalRect(slot, TEAM_SLOT_RECTS[index], 1125, 337);
    slot.style.zIndex = String(LINEUP_SLOT_COUNT - index);
    slot.dataset.lineupIndex = String(index);
    if (unit) slot.dataset.unitId = unit.id;
    slot.addEventListener("pointerdown", (event) => {
      if (!unit || event.target.closest("button") || state.phase !== "shop") return;
      const equipmentSlot = event.target.closest(".hero-equipment-slot");
      if (equipmentSlot) {
        if (!getUnitEquipment(unit)) return;
        event.preventDefault();
        resetLineupDragDirection();
        pointerDraggedEquipmentIndex = index;
        pointerDraggedLineupIndex = null;
        pointerDraggedShopIndex = null;
        pointerMoved = false;
        setBondSelectionHintSource("shop-drag", []);
        startDragPreview(equipmentSlot, event.clientX, event.clientY);
        setSellZoneVisible(true);
        return;
      }
      event.preventDefault();
      beginLineupDragDirection(event.clientX);
      pointerDraggedLineupIndex = index;
      pointerDraggedEquipmentIndex = null;
      pointerDraggedShopIndex = null;
      pointerMoved = false;
      setBondSelectionHintSource("shop-drag", []);
      startDragPreview(slot.querySelector(".hero-card"), event.clientX, event.clientY);
      setSellZoneVisible(true);
    });

    const header = document.createElement("div");
    header.className = "slot-index";
    header.innerHTML = `<span>${index + 1} 号位</span><span class="slot-type">上阵</span>`;

    const body = document.createElement("div");
    body.className = "slot-body";
    if (unit) {
      body.innerHTML = createHeroCardMarkup(unit, { lineupIndex: index });
    } else {
      body.setAttribute("aria-label", `第${index + 1}个空阵位`);
    }

    const actions = document.createElement("div");
    actions.className = "slot-actions";

    slot.append(header, body, actions);
    elements.lineupGrid.append(slot);
  });
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
  const currentLevels = Object.fromEntries(
    BOND_FACTIONS.map((faction) => [faction, getBondLevel(counts[faction] ?? 0)]),
  );
  if (previousRenderedBondLevels) {
    BOND_FACTIONS.forEach((faction) => {
      const previousLevel = previousRenderedBondLevels[faction] ?? 0;
      const level = currentLevels[faction] ?? 0;
      if (level <= previousLevel) return;

      queuedBondUpgradeCelebrations.push({
        faction,
        previousLevel,
        level,
        unitIds: state.lineup
          .filter(Boolean)
          .filter((unit) => getEffectiveUnitBonds(unit).includes(faction))
          .map((unit) => unit.id),
      });
    });
  }
  previousRenderedBondLevels = currentLevels;
  elements.bondList.replaceChildren();

  Object.values(BOND_RULES).forEach((bond) => {
    const count = counts[bond.name] ?? 0;
    const level = getBondLevel(count);
    const effectText = bond.effects[level > 0 ? level : 1];
    const tooltipId = `bond-level-tooltip-${bond.name}`;
    const levelEffects = [1, 2, 3, 4]
      .map(
        (effectLevel) => `
          <li class="bond-level-effect ${effectLevel === level ? "current" : ""}">
            <span class="bond-level-badge">${effectLevel === 4 ? "LVMAX" : `LV${effectLevel}`}</span>
            <span class="bond-level-requirement">${effectLevel + 1}人</span>
            <span class="bond-level-copy">${bond.effects[effectLevel]}</span>
            ${effectLevel === level ? '<em class="bond-level-current">当前</em>' : ""}
          </li>
        `,
      )
      .join("");
    const item = document.createElement("article");
    item.className = `bond-card bond-${bond.name} bond-level-${level} ${level > 0 ? "active" : ""} ${getFactionClass(bond.name)}`;
    item.dataset.faction = bond.name;
    item.tabIndex = 0;
    item.setAttribute("aria-describedby", tooltipId);
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
      <div id="${tooltipId}" class="bond-level-tooltip" role="tooltip">
        <div class="bond-level-tooltip-title">
          <strong>${bond.label}</strong>
          <span>四级效果</span>
        </div>
        <ol class="bond-level-effects">
          ${levelEffects}
        </ol>
      </div>
    `;
    elements.bondList.append(item);
  });
  applyBondSelectionHints();
}

function clearBondUpgradeEffects() {
  window.clearTimeout(bondUpgradeAnimationTimer);
  bondUpgradeAnimationTimer = 0;
  elements.lineupGrid?.querySelectorAll(".bond-upgrade-effect").forEach((effect) => effect.remove());
  elements.lineupGrid?.querySelectorAll(".bond-upgrade-active").forEach((card) => {
    card.classList.remove("bond-upgrade-active");
    card.style.removeProperty("--bond-upgrade-color");
  });
}

function playQueuedBondUpgradeCelebrations() {
  if (queuedBondUpgradeCelebrations.length === 0) return;
  clearBondUpgradeEffects();
  const celebrations = queuedBondUpgradeCelebrations.splice(0);
  let longestDelay = 0;

  celebrations.forEach((celebration) => {
    celebration.unitIds.forEach((unitId) => {
      const slot = Array.from(elements.lineupGrid.querySelectorAll(".lineup-slot")).find(
        (candidate) => candidate.dataset.unitId === unitId,
      );
      const card = slot?.querySelector(".hero-card");
      if (!card) return;

      const delay = 0;
      longestDelay = Math.max(longestDelay, delay);
      const color = BOND_VISUAL_COLORS[celebration.faction] ?? "#ffe39a";
      card.classList.add("bond-upgrade-active");
      card.style.setProperty("--bond-upgrade-color", color);

      const effect = document.createElement("div");
      effect.className = "bond-upgrade-effect";
      effect.dataset.faction = celebration.faction;
      effect.setAttribute("aria-hidden", "true");
      effect.style.setProperty("--bond-upgrade-color", color);
      effect.style.setProperty("--bond-upgrade-delay", `${delay}ms`);

      const wash = document.createElement("span");
      wash.className = "bond-upgrade-wash";
      effect.append(wash);
      card.append(effect);
    });
  });

  bondUpgradeAnimationTimer = window.setTimeout(
    clearBondUpgradeEffects,
    BOND_UPGRADE_ANIMATION_DURATION + longestDelay + 120,
  );
}

function escapeBattleReportHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getBattleSideFromUnitId(unitId) {
  if (String(unitId || "").startsWith("player-")) return "player";
  if (String(unitId || "").startsWith("enemy-")) return "enemy";
  return null;
}

function getBattleUnitSideClass(side) {
  return side === "player" || side === "enemy" ? side : "neutral";
}

function renderBattleUnitToken(name, side) {
  return `<span class="battle-token-unit ${getBattleUnitSideClass(side)}">${escapeBattleReportHtml(
    name,
  )}</span>`;
}

function collectBattleUnitSidesByName(battle) {
  const sidesByName = new Map();
  const collectTeam = (units, side) => {
    (units ?? []).forEach((unit) => {
      if (!unit?.name) return;
      if (!sidesByName.has(unit.name)) sidesByName.set(unit.name, new Set());
      sidesByName.get(unit.name).add(side);
    });
  };
  collectTeam(battle.playerStart, "player");
  collectTeam(battle.enemyStart, "enemy");
  (battle.roundSnapshots ?? []).forEach((snapshot) => {
    collectTeam(snapshot.player, "player");
    collectTeam(snapshot.enemy, "enemy");
  });
  (battle.presentationTimeline ?? []).forEach((step) => {
    collectTeam(step.snapshot?.player, "player");
    collectTeam(step.snapshot?.enemy, "enemy");
  });
  return new Map(
    [...sidesByName].map(([name, sides]) => [
      name,
      sides.size === 1 ? [...sides][0] : null,
    ]),
  );
}

function getEntryUnitSidesByName(entry) {
  const sidesByName = new Map();
  const details = entry ?? {};
  [
    ["ownerName", "ownerSide", "ownerId"],
    ["sourceName", "sourceSide", "sourceUnitId"],
    ["targetName", "targetSide", "targetUnitId"],
    ["unitName", "unitSide", "unitId"],
    ["deadUnitName", "deadUnitSide", "deadUnitId"],
  ].forEach(([nameKey, sideKey, idKey]) => {
    const name = details[nameKey];
    if (!name) return;
    sidesByName.set(
      name,
      details[sideKey] ?? getBattleSideFromUnitId(details[idKey]),
    );
  });
  return sidesByName;
}

function formatBattleReportMessage(message, entry = {}, battleSidesByName = new Map()) {
  let output = escapeBattleReportHtml(message);
  const placeholders = [];
  const entrySidesByName = getEntryUnitSidesByName(entry);
  const protect = (html) => {
    const token = `\uE000${placeholders.length}\uE001`;
    placeholders.push(html);
    return token;
  };
  const replaceTokens = (tokens, className, renderToken = null) => {
    const uniqueTokens = [...new Set(tokens.filter(Boolean))].sort(
      (left, right) => right.length - left.length,
    );
    if (uniqueTokens.length === 0) return;
    const pattern = new RegExp(uniqueTokens.map(escapeRegExp).join("|"), "g");
    output = output.replace(pattern, (token) =>
      protect(
        renderToken
          ? renderToken(token)
          : `<span class="${className}">${token}</span>`,
      ),
    );
  };

  replaceTokens(
    [
      ...CARD_POOLS.hero.map((hero) => hero.name),
      "重骑兵",
      "骑兵",
    ],
    "battle-token-unit",
    (token) =>
      renderBattleUnitToken(
        token,
        entrySidesByName.get(token) ?? battleSidesByName.get(token),
      ),
  );
  replaceTokens(
    [
      ...CARD_POOLS.stratagem
        .filter((item) => item.category === "装备")
        .map((item) => item.name),
      ...Object.values(BOND_RULES).map((bond) => bond.label),
      ...CARD_POOLS.hero.map((hero) => getHeroSkillName(hero.effectId, hero)),
      ...Object.values(STATUS_LABELS),
      "引燃",
    ],
    "battle-token-effect",
  );
  output = output.replace(
    /(?:\+\d+\/\+\d+|\+\d+\/\d+|\d+\/\d+|\d+\s*点(?:真实)?伤害|\d+\s*生命)/g,
    (token) => protect(`<span class="battle-token-health">${token}</span>`),
  );
  placeholders.forEach((html, index) => {
    output = output.replace(`\uE000${index}\uE001`, html);
  });
  return output;
}

function renderBattleReportEntry(entry, battleSidesByName) {
  if (entry.type === "hero-skill" && entry.skillDescriptionHtml) {
    const ownerSide =
      entry.ownerSide ?? getBattleSideFromUnitId(entry.ownerId) ?? battleSidesByName.get(entry.ownerName);
    const sideLabel = ownerSide === "player" ? "我方" : ownerSide === "enemy" ? "敌方" : "";
    return `${sideLabel ? `<span class="battle-side-label ${getBattleUnitSideClass(ownerSide)}">${sideLabel}</span> ` : ""}${renderBattleUnitToken(
      entry.ownerName,
      ownerSide,
    )}【<span class="battle-token-effect">${escapeBattleReportHtml(
      entry.skillName,
    )}</span>】触发（${escapeBattleReportHtml(
      entry.triggerName ?? getEventDisplayName(entry.trigger),
    )}）${entry.skillDescriptionHtml ? `：${entry.skillDescriptionHtml}` : ""}。`;
  }

  if (entry.type === "damage" && Number.isFinite(entry.damage)) {
    const sourceSide =
      entry.sourceSide ??
      getBattleSideFromUnitId(entry.sourceUnitId) ??
      battleSidesByName.get(entry.sourceName);
    const targetSide =
      entry.targetSide ??
      getBattleSideFromUnitId(entry.targetUnitId) ??
      battleSidesByName.get(entry.targetName);
    const sourceSideLabel =
      sourceSide === "player" ? "我方" : sourceSide === "enemy" ? "敌方" : "";
    const targetSideLabel =
      targetSide === "player" ? "我方" : targetSide === "enemy" ? "敌方" : "";
    const modifiers = (entry.modifiers ?? []).filter((modifier) => modifier.amount !== 0);
    const breakdown = [
      `<span>基础 <strong>${entry.baseDamage ?? entry.damage}</strong></span>`,
      ...modifiers.map(
        (modifier) =>
          `<span><span class="battle-token-effect">${escapeBattleReportHtml(
            modifier.sourceName,
          )}</span> <strong>${modifier.amount >= 0 ? "+" : ""}${
            modifier.amount
          }</strong></span>`,
      ),
    ].join("<i>；</i>");
    return `<span class="battle-side-label ${getBattleUnitSideClass(sourceSide)}">${sourceSideLabel}</span> ${renderBattleUnitToken(
      entry.sourceName,
      sourceSide,
    )} 对<span class="battle-side-label ${getBattleUnitSideClass(targetSide)}">${targetSideLabel}</span> ${renderBattleUnitToken(
      entry.targetName,
      targetSide,
    )}造成<span class="battle-damage-final">${entry.damage}点伤害</span><span class="battle-damage-breakdown">（${breakdown}）</span>。`;
  }

  return formatBattleReportMessage(entry.message, entry, battleSidesByName);
}

function formatBattleDamageModifiersForReport(damage) {
  if (!damage?.modifiers?.length) return "";
  return `<span class="battle-round-modifiers">${damage.modifiers
    .map(
      (modifier) =>
        `<span class="battle-token-effect">${escapeBattleReportHtml(
          modifier.sourceName,
        )}</span><span class="battle-token-health">${
          modifier.amount >= 0 ? "+" : ""
        }${modifier.amount}</span>`,
    )
    .join(" ")}</span>`;
}

function renderBattleRoundSummary(entry) {
  const ally = entry.ally;
  const foe = entry.foe;
  const allyDamage = entry.damageToEnemy;
  const foeDamage = entry.damageToPlayer;
  if (!ally || !foe || !allyDamage || !foeDamage) return "";
  const renderFighter = (fighter, sideClass) => `
    <div class="battle-round-fighter ${sideClass}">
      ${renderBattleUnitToken(fighter.name, sideClass)}
      <span class="battle-token-health">${fighter.healthBefore} → ${fighter.healthAfter}</span>
      <span class="battle-round-state ${fighter.alive ? "alive" : "defeated"}">${
        fighter.alive ? "存活" : "阵亡"
      }</span>
    </div>
  `;
  const renderDamage = (source, sourceSide, target, targetSide, damage) => `
    <div class="battle-round-damage">
      ${renderBattleUnitToken(source.name, sourceSide)}
      <span class="battle-round-arrow">→</span>
      ${renderBattleUnitToken(target.name, targetSide)}
      <span class="battle-token-health">${damage.finalAmount} 点伤害</span>
      ${formatBattleDamageModifiersForReport(damage)}
    </div>
  `;
  return `
    <div class="battle-round-summary">
      <div class="battle-round-health">
        ${renderFighter(ally, "player")}
        <span class="battle-round-versus">VS</span>
        ${renderFighter(foe, "enemy")}
      </div>
      <div class="battle-round-damages">
        ${renderDamage(ally, "player", foe, "enemy", allyDamage)}
        ${renderDamage(foe, "enemy", ally, "player", foeDamage)}
      </div>
    </div>
  `;
}

function renderBattleReport(battle, selectedExchange = null) {
  const entries = battle.structuredLog.filter((entry) => entry.message);
  const battleSidesByName = collectBattleUnitSidesByName(battle);
  const preBattleEntries = entries.filter(
    (entry) => !Number.isInteger(entry.exchange) && entry.type !== "result",
  );
  const resultEntries = entries.filter((entry) => entry.type === "result");
  const exchangeNumbers = [
    ...new Set(
      entries
        .filter((entry) => Number.isInteger(entry.exchange))
        .map((entry) => entry.exchange),
    ),
  ].sort((left, right) => left - right);
  const renderEntries = (items) =>
    items
      .map(
        (entry) =>
          `<div class="battle-report-entry battle-report-${entry.type}">${renderBattleReportEntry(
            entry,
            battleSidesByName,
          )}</div>`,
      )
      .join("");

  const sections = [];
  sections.push(`
    <section
      class="battle-report-section battle-report-opening battle-report-round${
        selectedExchange === 0 ? " selected" : ""
      }"
      data-exchange="0"
      role="button"
      tabindex="0"
      aria-pressed="${selectedExchange === 0}"
      aria-label="查看战斗开始技能结算前阵容"
    >
      <h3><span>战斗开始时机</span></h3>
      <div class="battle-report-entry">查看全部“战斗开始时”效果结算前的双方阵容。</div>
    </section>
  `);
  if (preBattleEntries.length > 0) {
    sections.push(`
      <section class="battle-report-section battle-report-opening">
        <h3>战前结算</h3>
        ${renderEntries(preBattleEntries)}
      </section>
    `);
  }
  exchangeNumbers.forEach((exchange) => {
    const roundEntries = entries.filter((entry) => entry.exchange === exchange);
    const summary = roundEntries.find((entry) => entry.type === "round-summary");
    const details = roundEntries.filter(
      (entry) => entry.type !== "exchange" && entry.type !== "round-summary",
    );
    sections.push(`
      <section
        class="battle-report-section battle-report-round${
          exchange === selectedExchange ? " selected" : ""
        }"
        data-exchange="${exchange}"
        role="button"
        tabindex="0"
        aria-pressed="${exchange === selectedExchange}"
        aria-label="查看第 ${exchange} 轮交锋前阵容"
      >
        <h3><span>第 ${exchange} 轮交锋</span></h3>
        ${summary ? renderBattleRoundSummary(summary) : ""}
        ${details.length > 0 ? `<div class="battle-round-details">${renderEntries(details)}</div>` : ""}
      </section>
    `);
  });
  if (resultEntries.length > 0) {
    sections.push(`
      <section class="battle-report-section battle-report-result">
        <h3>战斗结果</h3>
        ${renderEntries(resultEntries)}
      </section>
    `);
  }
  return sections.join("");
}

function getSelectedBattleSnapshot(battle) {
  const snapshots = battle.roundSnapshots ?? [];
  if (battle.selectedExchange === 0) {
    return {
      exchange: 0,
      player: battle.playerStart,
      enemy: battle.enemyStart,
    };
  }
  if (snapshots.length === 0) {
    return {
      exchange: 0,
      player: battle.playerStart,
      enemy: battle.enemyStart,
    };
  }
  const selectedExchange = Number.isInteger(battle.selectedExchange)
    ? battle.selectedExchange
    : snapshots[0].exchange;
  return (
    snapshots.find((snapshot) => snapshot.exchange === selectedExchange) ?? snapshots[0]
  );
}

function getBattleUnitStatusEntries(unit) {
  const statusIds = Object.entries(unit.statuses ?? {})
    .filter(([, status]) => Boolean(status))
    .map(([statusId]) => statusId);
  if (unit.skillDisabled) statusIds.push("skill-disabled");
  return [...new Set(statusIds)]
    .sort((left, right) => {
      const leftIndex = STATUS_PRESENTATION_ORDER.indexOf(left);
      const rightIndex = STATUS_PRESENTATION_ORDER.indexOf(right);
      return (
        (leftIndex < 0 ? STATUS_PRESENTATION_ORDER.length : leftIndex) -
        (rightIndex < 0 ? STATUS_PRESENTATION_ORDER.length : rightIndex)
      );
    })
    .map((statusId) => ({
      id: STATUS_LABELS[statusId] ? statusId : "unknown",
      label: STATUS_LABELS[statusId] ?? statusId,
    }));
}

function getBattleUnitStatusNames(unit) {
  return getBattleUnitStatusEntries(unit).map((status) => status.label);
}

function getBattleSnapshotCardUnit(unit, exchange) {
  const definition = CARD_POOLS.hero.find((hero) => hero.name === unit.name) ?? {};
  return {
    ...definition,
    ...unit,
    image: unit.image ?? definition.image ?? HERO_IMAGE_BY_NAME[unit.name] ?? "",
    skill: unit.skill ?? definition.skill ?? "",
    effectId:
      unit.effectId ?? definition.effectId ?? unit.skillEffectIds?.[0] ?? null,
    equipment: cloneDirectModifier(unit.equipment),
    statuses: cloneDirectModifier(unit.statuses ?? {}),
    extraFactions: [...(unit.extraFactions ?? [])],
    tempExtraFactions: [...(unit.tempExtraFactions ?? [])],
    usesBondDefinitionSnapshot: true,
    health: Math.max(0, unit.health),
    skillDisabled:
      Boolean(unit.skillDisabled) ||
      unit.skillDisabledUntilExchange === exchange,
  };
}

function getBattleTeamCardSlots(units, side) {
  const visibleUnits =
    side === "player"
      ? units.slice(-LINEUP_SLOT_COUNT)
      : units.slice(0, LINEUP_SLOT_COUNT);
  const emptySlots = Array.from(
    { length: Math.max(0, LINEUP_SLOT_COUNT - visibleUnits.length) },
    () => null,
  );
  return side === "player"
    ? [...emptySlots, ...visibleUnits]
    : [...visibleUnits, ...emptySlots];
}

function renderBattleTeams(battle) {
  const snapshot = getSelectedBattleSnapshot(battle);
  battle.selectedExchange = snapshot.exchange;
  const roundLabel =
    snapshot.exchange === 0
      ? " · 战斗开始前"
      : Number.isInteger(snapshot.exchange)
        ? ` · 第 ${snapshot.exchange} 轮交锋前`
        : "";
  const renderTeam = (title, units, side) => {
    const frontUnit = side === "player" ? units.at(-1) : units[0];
    const cardSlots = getBattleTeamCardSlots(units, side);
    return `
      <section class="battle-team battle-team-${side}">
        <h3>${title}${roundLabel}</h3>
        <div class="battle-card-row" data-side="${side}">
          ${cardSlots
            .map(
              (unit, slotIndex) => {
                if (!unit) {
                  return `<article class="battle-card-slot empty" aria-label="${
                    side === "player" ? "我方" : "敌方"
                  }第 ${slotIndex + 1} 个空位"><span>空位</span></article>`;
                }
                const isFront = unit.id === frontUnit?.id;
                const cardUnit = getBattleSnapshotCardUnit(unit, snapshot.exchange);
                return `<article class="battle-card-slot occupied${
                  isFront ? " front" : ""
                }" data-unit-id="${escapeBattleReportHtml(unit.id)}">
                  ${createHeroCardMarkup(cardUnit, { battleSnapshot: true })}
                  ${isFront ? '<em class="battle-card-front-marker">前排</em>' : ""}
                </article>`;
              },
            )
            .join("")}
        </div>
      </section>
    `;
  };
  elements.battleTeams.innerHTML =
    renderTeam("我方战斗副本", snapshot.player, "player") +
    '<div class="battle-versus" aria-hidden="true"><strong>VS</strong></div>' +
    renderTeam(
      battle.enemySource?.type === "opponent-pool"
        ? `对手数据池 · ${escapeBattleReportHtml(battle.enemySource.label ?? "未知数据")}`
        : "测试骑兵敌军",
      snapshot.enemy,
      "enemy",
    );
}

function getBattleExchangeSequence(battle) {
  return [
    0,
    ...new Set(
      (battle?.roundSnapshots ?? [])
        .map((snapshot) => snapshot.exchange)
        .filter(Number.isInteger),
    ),
  ].sort((left, right) => left - right);
}

function getNextBattleExchange(battle) {
  const sequence = getBattleExchangeSequence(battle);
  const currentIndex = sequence.indexOf(battle?.selectedExchange ?? 0);
  return currentIndex >= 0 && currentIndex < sequence.length - 1
    ? sequence[currentIndex + 1]
    : null;
}

function updateBattleExchangeControls(battle) {
  if (!elements.nextExchangeButton) return;
  const nextExchange = getNextBattleExchange(battle);
  elements.nextExchangeButton.disabled = !Number.isInteger(nextExchange);
  elements.nextExchangeButton.textContent = Number.isInteger(nextExchange)
    ? `查看第${nextExchange}轮交锋`
    : "已到最后一轮";
}

function selectBattleExchange(exchange) {
  const battle = state.battle;
  if (
    !battle ||
    (exchange !== 0 &&
      !battle.roundSnapshots?.some((snapshot) => snapshot.exchange === exchange))
  ) {
    return;
  }
  battle.selectedExchange = exchange;
  renderBattleTeams(battle);
  elements.battleLog.querySelectorAll(".battle-report-round").forEach((round) => {
    const selected = Number.parseInt(round.dataset.exchange ?? "", 10) === exchange;
    round.classList.toggle("selected", selected);
    round.setAttribute("aria-pressed", String(selected));
  });
  updateBattleExchangeControls(battle);
}

function selectNextBattleExchange() {
  const battle = state.battle;
  if (!battle) return;
  const nextExchange = getNextBattleExchange(battle);
  if (!Number.isInteger(nextExchange)) return;
  selectBattleExchange(nextExchange);
  elements.battleLog
    ?.querySelector(`.battle-report-round[data-exchange="${nextExchange}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getBattleAnimationSteps(battle) {
  if (Array.isArray(battle.presentationTimeline) && battle.presentationTimeline.length > 0) {
    if (
      !Array.isArray(battle.animationSteps) ||
      battle.animationSteps.length !== battle.presentationTimeline.length ||
      battle.animationSteps[0]?.id !== battle.presentationTimeline[0]?.id
    ) {
      battle.animationSteps = battle.presentationTimeline.map((step) => ({
        ...step,
        entries: (step.entries ?? []).filter((entry) => !entry.animationSkip),
      }));
    }
    return battle.animationSteps;
  }
  if (Array.isArray(battle.animationSteps)) return battle.animationSteps;
  const entries = (battle.structuredLog ?? []).filter(
    (entry) => entry.message && !entry.animationSkip,
  );
  const openingEntries = entries.filter(
    (entry) => !Number.isInteger(entry.exchange) && entry.type !== "result",
  );
  const steps = openingEntries.map((entry, index) => ({
    id: `opening-${index}`,
    kind: "opening",
    phase: entry.phase ?? entry.trigger ?? "battle:start",
    title:
      entry.type === "hero-skill"
        ? `${entry.ownerName || "武将"} · ${entry.skillName || "技能触发"}`
        : entry.type === "bond"
          ? entry.sourceName || BOND_RULES[entry.faction]?.label || "羁绊效果"
          : entry.type === "equipment"
            ? entry.sourceName || "装备效果"
            : entry.type === "damage"
              ? `${entry.sourceName || "效果"}造成伤害`
              : "战斗准备",
    entries: [entry],
  }));

  if (steps.length === 0) {
    steps.push({
      id: "opening-ready",
      kind: "opening",
      phase: "battle:start",
      title: "双方准备交锋",
      entries: [],
    });
  }

  (battle.roundSnapshots ?? []).forEach((snapshot) => {
    const roundEntries = entries.filter((entry) => entry.exchange === snapshot.exchange);
    steps.push({
      id: `exchange-${snapshot.exchange}`,
      kind: "exchange",
      phase: "battle",
      title: `第 ${snapshot.exchange} 轮 · 卡牌对撞`,
      exchange: snapshot.exchange,
      snapshot,
      entries: roundEntries,
    });
  });

  const resultEntries = entries.filter((entry) => entry.type === "result");
  steps.push({
    id: "battle-result",
    kind: "result",
    phase: "battle:end",
    title:
      battle.result === "win"
        ? "我方取得胜利"
        : battle.result === "loss"
          ? "我方战斗失败"
          : "本场战斗平局",
    entries: resultEntries,
  });
  battle.animationSteps = steps;
  return steps;
}

function getBattleAnimationPhaseLabel(step) {
  if (step.kind === "ready") return "战斗准备";
  if (step.kind === "clash") return `第 ${step.exchange} 轮 · 同时交锋`;
  if (step.kind === "exchange") return `第 ${step.exchange} 轮交锋`;
  if (step.kind === "result") return "战斗结果";
  if (step.kind === "death" || step.kind === "consume" || step.kind === "leave") {
    return Number.isInteger(step.exchange) && step.exchange > 0
      ? `第 ${step.exchange} 轮 · 阵亡结算`
      : "战斗开始 · 阵亡结算";
  }
  if (Number.isInteger(step.exchange) && step.exchange > 0) {
    const timingLabel =
      step.timingWindow === "attack:before"
        ? "攻击前"
        : step.timingWindow === "damage:after"
          ? "伤害后"
          : step.timingWindow === "attack:after"
            ? "攻击后"
            : step.timingWindow === "unit:death"
              ? "阵亡结算"
              : step.timingWindow === "status:apply"
                ? "状态连锁"
                : "技能结算";
    return `第 ${step.exchange} 轮 · ${timingLabel}`;
  }
  if (step.phase === "round:end") return "回合结束效果";
  if (
    step.phase === "battle:start" ||
    step.timingWindow === "battle:start"
  ) {
    return "战斗开始技能";
  }
  if (
    step.phase === "battle:start:end" ||
    step.timingWindow === "battle:start:end"
  ) {
    return "战斗开始阶段结束";
  }
  return getEventDisplayName(step.phase) || "战前结算";
}

function renderBattleAnimationContextRow(step, position) {
  const labels = {
    previous: "上一条操作",
    current: "当前操作",
    next: "下一条操作",
  };
  const emptyCopy = {
    previous: "已经是本场战斗的第一条操作",
    current: "暂无战斗操作",
    next: "已经是本场战斗的最后一条操作",
  };
  const currentAttribute = position === "current" ? ' aria-current="step"' : "";
  if (!step) {
    return `
      <div class="battle-animation-context-row is-${position} is-empty"${currentAttribute}>
        <span class="battle-animation-context-position">${labels[position]}</span>
        <span class="battle-animation-context-phase">—</span>
        <strong>${emptyCopy[position]}</strong>
      </div>
    `;
  }
  const title = escapeBattleReportHtml(step.title || step.description || "战斗操作");
  return `
    <div class="battle-animation-context-row is-${position}"${currentAttribute}>
      <span class="battle-animation-context-position">${labels[position]}</span>
      <span class="battle-animation-context-phase">${escapeBattleReportHtml(
        getBattleAnimationPhaseLabel(step),
      )}</span>
      <strong>${title}</strong>
    </div>
  `;
}

function renderBattleAnimationContextList(steps, currentIndex) {
  return [
    renderBattleAnimationContextRow(steps[currentIndex - 1], "previous"),
    renderBattleAnimationContextRow(steps[currentIndex], "current"),
    renderBattleAnimationContextRow(steps[currentIndex + 1], "next"),
  ].join("");
}

function getBattleAnimationSnapshot(battle, step) {
  if (step.snapshot) return step.snapshot;
  if (step.afterSnapshot) return step.afterSnapshot;
  if (step.kind === "result") {
    return {
      exchange: battle.roundSnapshots?.at(-1)?.exchange ?? 0,
      player: battle.playerEnd ?? [],
      enemy: battle.enemyEnd ?? [],
    };
  }
  return {
    exchange: 0,
    player: battle.playerStart ?? [],
    enemy: battle.enemyStart ?? [],
  };
}

function getBattleAnimationEffectName(entry) {
  return (
    entry?.skillName ||
    (entry?.sourceEffectId?.startsWith("bond.")
      ? Object.values(BOND_RULES).find((bond) =>
          bond.effectIds?.includes(entry.sourceEffectId),
        )?.label
      : "") ||
    (entry?.type === "bond" ? BOND_RULES[entry.faction]?.label : "") ||
    entry?.sourceName ||
    ""
  );
}

function getBattleBondFactionByEffectId(effectId) {
  if (!effectId) return null;
  return (
    BOND_FACTIONS.find((faction) =>
      BOND_RULES[faction]?.effectIds?.includes(effectId),
    ) ?? null
  );
}

function getBattleAnimationTriggeredBonds(step, snapshot) {
  const triggered = {
    player: new Set(),
    enemy: new Set(),
  };
  const snapshotUnits = [
    ...(snapshot?.player ?? []),
    ...(snapshot?.enemy ?? []),
    ...(step.beforeSnapshot?.player ?? []),
    ...(step.beforeSnapshot?.enemy ?? []),
  ];
  const addTriggeredBond = (effectId, details = {}) => {
    const faction = getBattleBondFactionByEffectId(effectId);
    if (!faction) return;
    const sides = new Set(
      [
        details.sourceSide,
        details.ownerSide,
        details.unitSide,
        details.side,
      ].filter((side) => side === "player" || side === "enemy"),
    );
    if (sides.size === 0) {
      (step.sourceIds ?? []).forEach((unitId) => {
        const side = snapshotUnits.find((unit) => unit.id === unitId)?.side;
        if (side === "player" || side === "enemy") sides.add(side);
      });
    }
    if (sides.size === 0 && faction === "魏") {
      ["player", "enemy"].forEach((side) => {
        const beforeCount =
          step.beforeSnapshot?.bondCounters?.[side]?.魏阵亡 ?? 0;
        const afterCount = snapshot?.bondCounters?.[side]?.魏阵亡 ?? 0;
        if (beforeCount !== afterCount) sides.add(side);
      });
    }
    if (
      sides.size === 0 &&
      (details.targetSide === "player" || details.targetSide === "enemy")
    ) {
      sides.add(
        faction === "吴"
          ? getOpposingSide(details.targetSide)
          : details.targetSide,
      );
    }
    sides.forEach((side) => triggered[side].add(faction));
  };

  (step.entries ?? []).forEach((entry) => {
    addTriggeredBond(entry.effectId, entry);
    addTriggeredBond(entry.sourceEffectId, entry);
    (entry.modifiers ?? []).forEach((modifier) =>
      addTriggeredBond(modifier.effectId, entry),
    );
    addTriggeredBond(step.effectId, entry);
  });
  if ((step.entries ?? []).length === 0) {
    addTriggeredBond(step.effectId);
  }

  return {
    player: [...triggered.player],
    enemy: [...triggered.enemy],
  };
}

function getBattleAnimationFieldState(battle, step, snapshot) {
  const sources = [];
  const targets = [];
  const deaths = [];
  const popups = [];
  const addIdentity = (collection, id, name) => {
    if (id) {
      collection.push({ id, name: null });
    } else if (name) {
      collection.push({ id: null, name });
    }
  };
  const addPopup = (id, name, text, tone = "effect") => {
    if (!text || (!id && !name)) return;
    popups.push({ id: id ?? null, name: name ?? null, text, tone });
  };
  const findStepUnit = (unitId) =>
    ["player", "enemy"]
      .flatMap((side) => [
        ...(snapshot?.[side] ?? []),
        ...(step.beforeSnapshot?.[side] ?? []),
      ])
      .find((unit) => unit.id === unitId) ?? null;

  (step.sourceIds ?? []).forEach((unitId) =>
    addIdentity(sources, unitId, findStepUnit(unitId)?.name),
  );
  (step.targetIds ?? []).forEach((unitId) =>
    addIdentity(targets, unitId, findStepUnit(unitId)?.name),
  );
  (step.deathIds ?? []).forEach((unitId) =>
    addIdentity(deaths, unitId, findStepUnit(unitId)?.name),
  );
  (step.cues ?? []).forEach((cue) =>
    addPopup(cue.unitId, findStepUnit(cue.unitId)?.name, cue.text, cue.tone),
  );

  (step.entries ?? []).forEach((entry) => {
    addIdentity(
      sources,
      entry.ownerId ?? entry.sourceUnitId,
      entry.ownerName ?? entry.sourceName,
    );
    addIdentity(
      targets,
      entry.targetUnitId ?? entry.deadUnitId ?? entry.unitId,
      entry.targetName ?? entry.deadUnitName ?? entry.unitName,
    );

    if ((step.cues ?? []).length > 0) return;
    if (entry.type === "hero-skill") {
      addPopup(
        entry.ownerId ?? entry.sourceUnitId,
        entry.ownerName ?? entry.sourceName,
        `【${entry.skillName || "技能"}】`,
        "skill",
      );
    } else if (entry.type === "damage" && Number.isFinite(entry.damage)) {
      addPopup(
        entry.targetUnitId,
        entry.targetName,
        `-${entry.damage}`,
        "damage",
      );
    } else if (entry.type === "status") {
      addPopup(
        entry.targetUnitId ?? entry.unitId,
        entry.targetName ?? entry.unitName,
        entry.statusName || STATUS_LABELS[entry.statusId] || "状态变化",
        "status",
      );
    } else if (entry.type === "death") {
      addIdentity(
        deaths,
        entry.deadUnitId ?? entry.unitId,
        entry.deadUnitName ?? entry.unitName,
      );
      addPopup(
        entry.deadUnitId ?? entry.unitId,
        entry.deadUnitName ?? entry.unitName,
        "阵亡",
        "death",
      );
    } else if (entry.type === "summon") {
      addPopup(entry.unitId, entry.unitName, "召唤", "buff");
    }
  });

  const summary = (step.entries ?? []).find((entry) => entry.type === "round-summary");
  const actorUnits = (step.actorIds ?? [])
    .map(findStepUnit)
    .filter(Boolean);
  const ally =
    actorUnits.find((unit) => unit.side === "player") ??
    snapshot.player?.find((unit) => unit.id === summary?.ally?.id) ??
    (step.kind === "exchange" ? snapshot.player?.at(-1) : null);
  const foe =
    actorUnits.find((unit) => unit.side === "enemy") ??
    snapshot.enemy?.find((unit) => unit.id === summary?.foe?.id) ??
    (step.kind === "exchange" ? snapshot.enemy?.[0] : null);
  if (step.kind === "exchange") {
    addIdentity(sources, ally?.id, ally?.name);
    addIdentity(sources, foe?.id, foe?.name);
    addIdentity(targets, ally?.id, ally?.name);
    addIdentity(targets, foe?.id, foe?.name);
    addPopup(
      ally?.id,
      ally?.name,
      `-${summary?.damageToPlayer?.finalAmount ?? 0}`,
      "damage",
    );
    addPopup(
      foe?.id,
      foe?.name,
      `-${summary?.damageToEnemy?.finalAmount ?? 0}`,
      "damage",
    );
    if (summary?.ally?.alive === false) addIdentity(deaths, ally?.id, ally?.name);
    if (summary?.foe?.alive === false) addIdentity(deaths, foe?.id, foe?.name);
  }

  return {
    sources,
    targets,
    deaths,
    popups,
    ally,
    foe,
    changedUnitIds: [
      ...new Set(
        (step.changes ?? [])
          .map((change) => change.unitId)
          .filter(Boolean),
      ),
    ],
    effectName:
      step.effectName ||
      getBattleAnimationEffectName((step.entries ?? [])[0]) ||
      step.title,
    triggeredBonds: getBattleAnimationTriggeredBonds(step, snapshot),
  };
}

function battleAnimationIdentityMatches(unit, identities) {
  return identities.some(
    (identity) =>
      identity.id
        ? identity.id === unit.id
        : Boolean(identity.name && identity.name === unit.name),
  );
}

function renderBattleAnimationFieldCard(unit, side, exchange, fieldState, slotIndex) {
  if (!unit) {
    return `<article class="battle-field-slot empty" aria-label="${
      side === "player" ? "我方" : "敌方"
    }第 ${slotIndex + 1} 个空位"><span>空</span></article>`;
  }
  const isSource = battleAnimationIdentityMatches(unit, fieldState.sources);
  const isTarget = battleAnimationIdentityMatches(unit, fieldState.targets);
  const isDead = battleAnimationIdentityMatches(unit, fieldState.deaths);
  const isClashing =
    fieldState.ally?.id === unit.id || fieldState.foe?.id === unit.id;
  const unitPopups = fieldState.popups.filter((popup) =>
    battleAnimationIdentityMatches(unit, [popup]),
  );
  const cardUnit = getBattleSnapshotCardUnit(unit, exchange);
  return `
    <article
      class="battle-field-slot occupied ${side}${
        isSource ? " is-source" : ""
      }${isTarget ? " is-target" : ""}${isClashing ? " is-clashing" : ""}${
        isDead ? " is-defeated" : ""
      }"
      data-unit-id="${escapeBattleReportHtml(unit.id)}"
    >
      <div class="battle-field-card">
        ${createHeroCardMarkup(cardUnit, { battleSnapshot: true })}
      </div>
      <div class="battle-field-popups">
        ${unitPopups
          .map(
            (popup) =>
              `<strong class="${escapeBattleReportHtml(
                popup.tone,
              )}">${escapeBattleReportHtml(popup.text)}</strong>`,
          )
          .join("")}
      </div>
    </article>
  `;
}

function getBattleAnimationWeiProgress(step, snapshot, side) {
  const counterEntry = (step.entries ?? []).find(
    (entry) =>
      getBattleBondFactionByEffectId(entry.effectId) === "魏" &&
      entry.ownerSide === side &&
      Number.isFinite(entry.summonProgress),
  );
  if (counterEntry) return counterEntry.summonProgress;
  const deathCount = snapshot?.bondCounters?.[side]?.魏阵亡 ?? 0;
  return Math.max(0, deathCount % 4);
}

function renderBattleAnimationFieldBonds(
  battle,
  side,
  step,
  snapshot,
  fieldState,
) {
  const activeBonds = BOND_FACTIONS.map((faction) => ({
    faction,
    level: battle.lockedBonds?.[side]?.[faction] ?? 0,
  })).filter((entry) => entry.level > 0);
  const sideLabel = side === "player" ? "我方" : "敌方";
  if (activeBonds.length === 0) {
    return `<div class="battle-field-bonds empty" aria-label="${sideLabel}无激活羁绊">无激活羁绊</div>`;
  }
  return `
    <div class="battle-field-bonds" aria-label="${sideLabel}激活羁绊">
      ${activeBonds
        .map(({ faction, level }) => {
          const bond = BOND_RULES[faction];
          const triggered = fieldState.triggeredBonds?.[side]?.includes(faction);
          const levelLabel = level >= 4 ? "LVMAX" : `LV${level}`;
          const weiProgress =
            faction === "魏"
              ? `<span class="battle-field-bond-progress">召唤 ${getBattleAnimationWeiProgress(
                  step,
                  snapshot,
                  side,
                )}/4</span>`
              : "";
          return `
            <article
              class="battle-field-bond${triggered ? " is-triggered" : ""}"
              data-faction="${faction}"
              aria-label="${escapeBattleReportHtml(
                `${bond.label} ${levelLabel}：${bond.effects[level]}${
                  triggered ? "，当前正在触发" : ""
                }`,
              )}"
            >
              <div class="battle-field-bond-title">
                <strong>${escapeBattleReportHtml(bond.label)}</strong>
                <em>${levelLabel}</em>
                ${weiProgress}
              </div>
              <p>${escapeBattleReportHtml(bond.effects[level])}</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderBattleAnimationFieldTeam(
  units,
  side,
  exchange,
  fieldState,
) {
  const slots = getBattleTeamCardSlots(units ?? [], side);
  const livingCount = (units ?? []).filter((unit) => unit.health > 0).length;
  return `
    <section class="battle-field-team ${side}">
      <header>
        <span>${side === "player" ? "我方阵容" : "敌方阵容"}</span>
        <small>${livingCount} 名存活</small>
      </header>
      <div class="battle-field-cards">
        ${slots
          .map((unit, slotIndex) =>
            renderBattleAnimationFieldCard(
              unit,
              side,
              exchange,
              fieldState,
              slotIndex,
            ),
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderBattleAnimationFatePanel(
  battle,
  side,
  step,
  snapshot,
  fieldState,
) {
  const activeCount = BOND_FACTIONS.filter(
    (faction) => (battle.lockedBonds?.[side]?.[faction] ?? 0) > 0,
  ).length;
  const sideLabel = side === "player" ? "我方" : "敌方";
  return `
    <aside class="battle-fate-summary ${side}" aria-label="${sideLabel}缘分技能">
      <header>
        <strong>${sideLabel}缘分</strong>
        <small>${activeCount > 0 ? `${activeCount} 项技能生效` : "尚未激活技能"}</small>
      </header>
      ${renderBattleAnimationFieldBonds(
        battle,
        side,
        step,
        snapshot,
        fieldState,
      )}
    </aside>
  `;
}

function renderBattleAnimationBattlefield(battle, step) {
  const snapshot = getBattleAnimationSnapshot(battle, step);
  const fieldState = getBattleAnimationFieldState(battle, step, snapshot);
  const summary = (step.entries ?? []).find((entry) => entry.type === "round-summary");
  const clash = (step.entries ?? []).find((entry) => entry.type === "exchange");
  const resultClass =
    battle.result === "win" ? "win" : battle.result === "loss" ? "loss" : "draw";
  const centerContent =
    step.kind === "exchange" || step.kind === "clash"
      ? `
        <div class="battle-field-impact" aria-hidden="true"><span>交锋</span></div>
        <small>${clash?.damageToEnemy?.finalAmount ?? summary?.damageToEnemy?.finalAmount ?? 0} ↔ ${
          clash?.damageToPlayer?.finalAmount ?? summary?.damageToPlayer?.finalAmount ?? 0
        }</small>
      `
      : step.kind === "result"
        ? `<div class="battle-field-result-mark ${resultClass}">${
            battle.result === "win" ? "胜" : battle.result === "loss" ? "败" : "平"
          }</div>`
        : `
          <span class="battle-field-effect-title">${escapeBattleReportHtml(
            fieldState.effectName,
          )}</span>
          <small>${escapeBattleReportHtml(
            step.description ||
              (step.kind === "damage"
                ? "本段伤害完成后再进入下一段"
                : "当前效果独立结算"),
          )}</small>
        `;
  return `
    <div class="battle-animation-field">
      ${renderBattleAnimationFatePanel(
        battle,
        "player",
        step,
        snapshot,
        fieldState,
      )}
      ${renderBattleAnimationFatePanel(
        battle,
        "enemy",
        step,
        snapshot,
        fieldState,
      )}
      <div class="battle-field-armies">
        ${renderBattleAnimationFieldTeam(
          snapshot.player,
          "player",
          snapshot.exchange ?? 0,
          fieldState,
        )}
        <div class="battle-field-divider" aria-hidden="true"></div>
        ${renderBattleAnimationFieldTeam(
          snapshot.enemy,
          "enemy",
          snapshot.exchange ?? 0,
          fieldState,
        )}
      </div>
      <div class="battle-field-center ${step.kind}">
        ${centerContent}
      </div>
      ${
        step.kind === "result"
          ? `<div class="battle-field-result-copy ${resultClass}">
              <strong>${escapeBattleReportHtml(step.title)}</strong>
              <small>完整过程可切换到“查看战报”逐条回看</small>
            </div>`
          : ""
      }
    </div>
  `;
}

function getBattleAnimationSpeed(value) {
  const speed = Number(value);
  return BATTLE_ANIMATION_SPEEDS.includes(speed)
    ? speed
    : BATTLE_ANIMATION_SPEEDS[0];
}

function getBattleAnimationStepDuration(step) {
  return (
    step.durationMs ??
    (step.kind === "exchange" || step.kind === "clash"
      ? 2500
      : step.kind === "result"
        ? 2600
        : 1500)
  );
}

function syncBattleAnimationSpeedControl(battle) {
  const speed = getBattleAnimationSpeed(
    battle?.animationSpeed ?? battleAnimationPlaybackSpeed,
  );
  if (battle) battle.animationSpeed = speed;
  if (elements.battleAnimationSpeed) {
    elements.battleAnimationSpeed.value = String(
      BATTLE_ANIMATION_SPEEDS.indexOf(speed),
    );
    elements.battleAnimationSpeed.setAttribute("aria-valuetext", `${speed}倍速`);
  }
  if (elements.battleAnimationSpeedValue) {
    elements.battleAnimationSpeedValue.textContent = `${speed}×`;
  }
  if (elements.battleAnimationFastForward) {
    elements.battleAnimationFastForward.setAttribute(
      "aria-label",
      `切换战斗动画倍速，当前${speed}倍速`,
    );
  }
}

function applyBattleAnimationPlaybackSpeed(speed) {
  if (typeof elements.battleAnimationStage?.getAnimations !== "function") return;
  elements.battleAnimationStage
    .getAnimations({ subtree: true })
    .forEach((animation) => {
      animation.playbackRate = speed;
    });
}

function scheduleBattleAnimation(battle, step, remainingBaseDuration = null) {
  window.clearTimeout(battleAnimationTimer);
  battleAnimationTimer = 0;
  battle.animationTimerStartedAt = 0;
  battle.animationTimerBaseDuration = 0;
  if (!battle.animationPlaying || battle.view !== "animation") return;
  const speed = getBattleAnimationSpeed(battle.animationSpeed);
  const baseDuration =
    remainingBaseDuration ?? getBattleAnimationStepDuration(step);
  battle.animationTimerStartedAt = performance.now();
  battle.animationTimerBaseDuration = baseDuration;
  battleAnimationTimer = window.setTimeout(() => {
    battle.animationTimerStartedAt = 0;
    battle.animationTimerBaseDuration = 0;
    const steps = getBattleAnimationSteps(battle);
    if (battle.animationIndex >= steps.length - 1) {
      battle.animationPlaying = false;
      renderBattleAnimationStep(battle);
      return;
    }
    battle.animationIndex += 1;
    renderBattleAnimationStep(battle);
  }, baseDuration / speed);
}

function setBattleAnimationSpeedFromControl() {
  const sliderIndex = Math.min(
    BATTLE_ANIMATION_SPEEDS.length - 1,
    Math.max(0, Math.round(Number(elements.battleAnimationSpeed?.value) || 0)),
  );
  const speed = BATTLE_ANIMATION_SPEEDS[sliderIndex];
  const battle = state.battle;
  const previousSpeed = getBattleAnimationSpeed(
    battle?.animationSpeed ?? battleAnimationPlaybackSpeed,
  );
  let remainingBaseDuration = null;
  if (
    battle?.animationPlaying &&
    battle.view === "animation" &&
    battle.animationTimerStartedAt > 0
  ) {
    const elapsed = Math.max(0, performance.now() - battle.animationTimerStartedAt);
    remainingBaseDuration = Math.max(
      0,
      battle.animationTimerBaseDuration - elapsed * previousSpeed,
    );
  }
  battleAnimationPlaybackSpeed = speed;
  if (battle) battle.animationSpeed = speed;
  syncBattleAnimationSpeedControl(battle);
  applyBattleAnimationPlaybackSpeed(speed);
  if (battle?.animationPlaying && battle.view === "animation") {
    const steps = getBattleAnimationSteps(battle);
    scheduleBattleAnimation(
      battle,
      steps[battle.animationIndex],
      remainingBaseDuration,
    );
  }
}

function cycleBattleAnimationSpeed() {
  if (!elements.battleAnimationSpeed) return;
  const currentIndex = Math.min(
    BATTLE_ANIMATION_SPEEDS.length - 1,
    Math.max(0, Math.round(Number(elements.battleAnimationSpeed.value) || 0)),
  );
  elements.battleAnimationSpeed.value = String(
    (currentIndex + 1) % BATTLE_ANIMATION_SPEEDS.length,
  );
  setBattleAnimationSpeedFromControl();
}

function renderBattleAnimationStep(battle) {
  if (!elements.battleAnimationStage) return;
  const steps = getBattleAnimationSteps(battle);
  battle.animationIndex = Math.min(
    Math.max(0, battle.animationIndex ?? 0),
    Math.max(0, steps.length - 1),
  );
  const step = steps[battle.animationIndex];
  elements.battleAnimationPhase.textContent = getBattleAnimationPhaseLabel(step);
  elements.battleAnimationProgress.textContent = `${battle.animationIndex + 1} / ${steps.length}`;
  elements.battleAnimationStage.className = `battle-animation-stage is-${step.kind}`;
  elements.battleAnimationStage.innerHTML = renderBattleAnimationBattlefield(
    battle,
    step,
  );
  syncBattleAnimationSpeedControl(battle);
  applyBattleAnimationPlaybackSpeed(battle.animationSpeed);
  elements.battleAnimationEvents.innerHTML = renderBattleAnimationContextList(
    steps,
    battle.animationIndex,
  );
  elements.battleAnimationPrevious.disabled = battle.animationIndex === 0;
  elements.battleAnimationNext.disabled = battle.animationIndex >= steps.length - 1;
  const playLabel = battle.animationPlaying
    ? "暂停"
    : battle.animationIndex >= steps.length - 1
      ? "从头播放"
      : "继续";
  const playLabelElement =
    elements.battleAnimationPlay?.querySelector(".battle-operation-label");
  if (playLabelElement) {
    playLabelElement.textContent = playLabel;
  } else if (elements.battleAnimationPlay) {
    elements.battleAnimationPlay.textContent = playLabel;
  }
  elements.battleAnimationPlay?.classList.toggle(
    "is-active",
    battle.animationPlaying,
  );
  elements.battleAnimationPlay?.setAttribute("aria-label", playLabel);

  if (step.kind === "exchange" || step.kind === "clash") {
    battle.selectedExchange = step.exchange;
    renderBattleTeams(battle);
  } else if (step.kind === "opening" || step.exchange === 0) {
    battle.selectedExchange = 0;
    renderBattleTeams(battle);
  }
  scheduleBattleAnimation(battle, step);
}

function setBattleAnimationIndex(index, { keepPlaying = false } = {}) {
  const battle = state.battle;
  if (!battle) return;
  const steps = getBattleAnimationSteps(battle);
  battle.animationIndex = Math.min(Math.max(0, index), steps.length - 1);
  if (!keepPlaying) battle.animationPlaying = false;
  renderBattleAnimationStep(battle);
}

function toggleBattleAnimationPlayback() {
  const battle = state.battle;
  if (!battle) return;
  const steps = getBattleAnimationSteps(battle);
  if (!battle.animationPlaying && battle.animationIndex >= steps.length - 1) {
    battle.animationIndex = 0;
  }
  battle.animationPlaying = !battle.animationPlaying;
  renderBattleAnimationStep(battle);
}

function replayBattleAnimation() {
  const battle = state.battle;
  if (!battle) return;
  battle.animationIndex = 0;
  battle.animationPlaying = true;
  setBattleView("animation");
  renderBattleAnimationStep(battle);
}

function skipBattleAnimation() {
  const battle = state.battle;
  if (!battle) return;
  const steps = getBattleAnimationSteps(battle);
  setBattleAnimationIndex(steps.length - 1);
}

function setBattleView(view) {
  const battle = state.battle;
  if (!battle) return;
  battle.view = view === "report" ? "report" : "animation";
  const showAnimation = battle.view === "animation";
  elements.battleAnimation.hidden = !showAnimation;
  elements.battleLog.hidden = showAnimation;
  elements.nextExchangeButton.hidden = showAnimation;
  elements.battleAnimationTab.classList.toggle("active", showAnimation);
  elements.battleReportTab.classList.toggle("active", !showAnimation);
  elements.battleAnimationTab.setAttribute("aria-selected", String(showAnimation));
  elements.battleReportTab.setAttribute("aria-selected", String(!showAnimation));
  if (elements.battleLineupPanel) {
    elements.battleLineupPanel.hidden = showAnimation;
    elements.battleLineupPanel.open = !showAnimation;
  }
  if (!showAnimation) {
    battle.animationPlaying = false;
    window.clearTimeout(battleAnimationTimer);
    battleAnimationTimer = 0;
  } else {
    renderBattleAnimationStep(battle);
  }
}

function renderBattle() {
  if (!elements.battleOverlay) return;
  const battle = state.battle;
  elements.battleOverlay.hidden = state.phase !== "battle" || !battle || state.gameOver;
  if (!battle || state.gameOver) {
    window.clearTimeout(battleAnimationTimer);
    battleAnimationTimer = 0;
    return;
  }

  const resultLabel =
    battle.result === "win" ? "战斗胜利" : battle.result === "loss" ? "战斗失败" : "战斗平局";
  elements.battleTitle.textContent = resultLabel;
  elements.battleSummary.textContent =
    state.playerDataTest?.status === "completed"
      ? "第 20 回合玩家阵容数据已记录并导出；本局继续按生命与旗帜条件进行。"
      : "本场使用商店阵容的独立副本；结算完成后不会回写任何战斗状态。";
  renderBattleTeams(battle);
  elements.battleLog.innerHTML = renderBattleReport(battle, battle.selectedExchange);
  elements.battleLog.scrollTop = 0;
  battle.view ??= "animation";
  battle.animationIndex ??= 0;
  battle.animationPlaying ??= true;
  battle.animationSpeed ??= battleAnimationPlaybackSpeed;
  if (elements.battleLineupPanel) elements.battleLineupPanel.open = false;
  setBattleView(battle.view);
  updateBattleExchangeControls(battle);
  elements.continueButton.textContent = state.gameOutcome
    ? "游戏结算"
    : "进入下一回合";
}

function renderGameResult() {
  if (!elements.gameResultOverlay) return;
  const outcome = state.gameOver ? state.gameOutcome : null;
  const isVictory = outcome === "victory";
  const isDefeat = outcome === "defeat";
  document.body.classList.toggle("game-result-visible", isVictory || isDefeat);
  elements.gameResultOverlay.hidden = !isVictory && !isDefeat;
  if (!isVictory && !isDefeat) return;

  elements.gameResultDialog.classList.toggle("victory", isVictory);
  elements.gameResultDialog.classList.toggle("defeat", isDefeat);
  elements.gameResultKicker.textContent = isVictory ? "十旗定鼎 · 战局终结" : "心火尽灭 · 战局终结";
  elements.gameResultTitle.textContent = isVictory ? "问鼎中原" : "本局落败";
  elements.gameResultSeal.textContent = isVictory ? "胜" : "败";
  elements.gameResultMessage.textContent = isVictory
    ? `第 ${state.round} 回合集齐 ${FLAG_VICTORY_TARGET} 面旗帜，你赢得了本局。`
    : `生命在第 ${state.round} 回合归零，本局征途到此为止。`;

  const stats = [
    ["最终回合", state.round],
    ["旗帜", `${state.flags} / ${FLAG_VICTORY_TARGET}`],
    ["生命", `${state.life} / ${PLAYER_MAX_LIFE}`],
    ["胜场", state.battleRecord.wins],
    ["负场", state.battleRecord.losses],
    ["平局", state.battleRecord.draws],
  ];
  elements.gameResultStats.innerHTML = stats
    .map(
      ([label, value]) => `
        <article class="game-result-stat">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `,
    )
    .join("");

  elements.gameResultLineup.replaceChildren();
  state.lineup.forEach((unit, index) => {
    const slot = document.createElement("article");
    slot.className = `game-result-lineup-slot${unit ? " occupied" : " empty"}`;
    slot.innerHTML = `
      <span class="game-result-slot-number">${index + 1}号位</span>
      <div class="game-result-card-frame">
        ${
          unit
            ? createHeroCardMarkup(unit, { lineupIndex: index })
            : '<span class="game-result-empty-mark">空</span>'
        }
      </div>
    `;
    elements.gameResultLineup.append(slot);
  });

  const activeBonds = getBondEntries().filter((entry) => entry.level > 0);
  elements.gameResultBondSummary.textContent =
    activeBonds.length > 0
      ? activeBonds
          .map((entry) => `${BOND_RULES[entry.faction].label} ${entry.count}人 · LV${entry.level}`)
          .join("　")
      : "未激活羁绊";
}

function renderRewardChoice() {
  if (!elements.rewardOverlay) return;
  setBondSelectionHintSource("reward-hover", []);
  setBondSelectionHintSource("reward-focus", []);
  const reward = state.pendingRewards[0];
  const canShow = Boolean(
    state.phase === "shop" &&
    reward &&
    reward.ready !== false &&
    (reward.availableRound ?? state.round) <= state.round,
  );
  elements.rewardOverlay.hidden = !canShow;
  if (!canShow) return;
  setBondSelectionHintSource("shop-hover", []);
  setBondSelectionHintSource("shop-focus", []);
  setBondSelectionHintSource("shop-drag", []);

  elements.rewardTitle.textContent = `${reward.unitName} 升到 ${reward.level} 级：选择1名${reward.rewardTier}阶武将`;
  elements.rewardOptions.replaceChildren();
  reward.candidates.forEach((candidate, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reward-option";
    button.setAttribute("aria-label", `选择${candidate.name}作为升级奖励`);
    button.innerHTML = createHeroCardMarkup(
      {
        ...candidate,
        cost: HERO_COST,
        isReward: true,
      },
      { showCost: true },
    );
    bindCardBondSelectionHint(button, candidate, "reward");
    button.addEventListener("click", () => selectUpgradeReward(index));
    elements.rewardOptions.append(button);
  });
}

function renderStratagemChoice() {
  if (!elements.stratagemChoiceOverlay) return;
  const pending = state.pendingStratagemUse;
  const heroPending = state.pendingHeroBondChoice;
  elements.stratagemChoiceOverlay.hidden = !pending && !heroPending;
  if (!pending && !heroPending) return;

  if (heroPending) {
    elements.stratagemChoiceTitle.textContent = `${heroPending.ownerName}【广识】：选择额外羁绊`;
    elements.stratagemChoiceDescription.textContent =
      `选择一名友军及其本局永久获得的额外羁绊，并使目标 +${heroPending.statBonus}/+${heroPending.statBonus}；购买成功后的选择不可取消。`;
    elements.stratagemChoiceOptions.replaceChildren();
    heroPending.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `stratagem-bond-option bond-${option.faction}`;
      button.innerHTML = `<strong>${option.unitName} · ${BOND_RULES[option.faction].label}</strong><span>永久添加${option.faction}羁绊，并 +${heroPending.statBonus}/+${heroPending.statBonus}</span>`;
      button.addEventListener("click", () => selectHeroBondChoice(index));
      elements.stratagemChoiceOptions.append(button);
    });
    elements.stratagemChoiceCancelButton.hidden = true;
    return;
  }

  elements.stratagemChoiceTitle.textContent = `${pending.cardName}：选择羁绊`;
  elements.stratagemChoiceDescription.textContent = pending.choiceDescription;
  elements.stratagemChoiceOptions.replaceChildren();
  pending.availableFactions.forEach((faction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `stratagem-bond-option bond-${faction}`;
    const affectedShopCount =
      pending.cardName === "整军经武"
        ? state.shop.filter(
            (card) => card?.type === "hero" && getBaseUnitBonds(card).includes(faction),
          ).length
        : null;
    button.innerHTML = `
      <strong>${BOND_RULES[faction].label}</strong>
      <span>${faction}羁绊${
        affectedShopCount === null ? "" : ` · 当前可强化 ${affectedShopCount} 张商店武将`
      }</span>
    `;
    button.addEventListener("click", () => selectStratagemBondChoice(faction));
    elements.stratagemChoiceOptions.append(button);
  });
  elements.stratagemChoiceCancelButton.hidden = false;
}

function render() {
  const shopRule = getShopRule(state.round);
  elements.roundText.textContent = state.round;
  elements.phaseText.textContent =
    state.phase === "shop"
      ? "商店"
      : state.phase === "end-turn"
        ? "回合结束结算"
        : "战斗";
  elements.tierText.textContent = `${shopRule.tier}阶 · ${shopRule.heroSlots}武将 / ${shopRule.itemSlots}道具`;
  elements.shopTipText.textContent = `当前商店阶数 - ${shopRule.tier}阶 · ${shopRule.heroSlots}武将 + ${shopRule.itemSlots}道具；鼠标右键可以锁定指定的卡牌`;
  elements.goldText.textContent = state.gold;
  elements.lifeText.textContent = state.life;
  document.querySelectorAll(".heart-strip img").forEach((heart, index) => {
    heart.style.opacity = index < state.life ? "1" : "0.18";
  });
  elements.flagText.textContent = `${state.flags} / ${FLAG_VICTORY_TARGET}`;
  elements.refreshButton.disabled =
    state.phase !== "shop" ||
    state.gold < REFRESH_COST ||
    state.pendingRewards.length > 0 ||
    Boolean(state.pendingStratagemUse) ||
    Boolean(state.pendingHeroBondChoice);
  elements.endTurnButton.disabled =
    state.phase !== "shop" ||
    state.pendingRewards.length > 0 ||
    Boolean(state.pendingStratagemUse) ||
    Boolean(state.pendingHeroBondChoice);
  renderFlow();
  renderBonds();
  renderShop();
  renderLineup();
  renderLogs();
  renderBattle();
  renderGameResult();
  renderRewardChoice();
  renderStratagemChoice();
  playQueuedShopPresentations();
  playQueuedBondUpgradeCelebrations();
}

elements.refreshButton.addEventListener("click", () => refreshShop());
elements.endTurnButton.addEventListener("click", endTurn);
elements.codexButton?.addEventListener("click", openCodex);
elements.fullscreenButton?.addEventListener("click", togglePageFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
updateFullscreenButton();
elements.codexCloseButton?.addEventListener("click", () => closeCodex());
elements.codexTypeFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-codex-type]");
  if (!button) return;
  codexFilters.type = button.dataset.codexType;
  renderCodex();
});
elements.codexTierFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-codex-tier]");
  if (!button) return;
  if (button.dataset.codexTier === "全部") {
    codexFilters.tier = "全部";
    renderCodex();
    return;
  }
  const tier = Number.parseInt(button.dataset.codexTier ?? "", 10);
  if (!Number.isInteger(tier)) return;
  codexFilters.tier = tier;
  renderCodex();
});
elements.codexFactionFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-codex-faction]");
  if (!button) return;
  codexFilters.faction = button.dataset.codexFaction;
  renderCodex();
});
elements.codexOverlay?.addEventListener("click", (event) => {
  if (event.target === elements.codexOverlay) closeCodex();
});
elements.nextExchangeButton?.addEventListener("click", selectNextBattleExchange);
elements.continueButton?.addEventListener("click", startNextRound);
elements.gameResultRestartButton?.addEventListener("click", resetDemo);
elements.battleAnimationTab?.addEventListener("click", () => setBattleView("animation"));
elements.battleReportTab?.addEventListener("click", () => setBattleView("report"));
elements.battleAnimationPrevious?.addEventListener("click", () => {
  const battle = state.battle;
  if (battle) setBattleAnimationIndex((battle.animationIndex ?? 0) - 1);
});
elements.battleAnimationPlay?.addEventListener("click", toggleBattleAnimationPlayback);
elements.battleAnimationFastForward?.addEventListener(
  "click",
  cycleBattleAnimationSpeed,
);
elements.battleAnimationSpeed?.addEventListener(
  "input",
  setBattleAnimationSpeedFromControl,
);
elements.battleAnimationNext?.addEventListener("click", () => {
  const battle = state.battle;
  if (battle) setBattleAnimationIndex((battle.animationIndex ?? 0) + 1);
});
elements.battleAnimationReplay?.addEventListener("click", replayBattleAnimation);
elements.battleAnimationSkip?.addEventListener("click", skipBattleAnimation);
elements.battleLineupPanel?.addEventListener("toggle", () => {
  if (!elements.battleLineupHint) return;
  elements.battleLineupHint.textContent = elements.battleLineupPanel.open
    ? "收起完整卡牌"
    : "展开查看完整卡牌";
});
elements.battleLog?.addEventListener("click", (event) => {
  const round = event.target.closest(".battle-report-round");
  if (!round) return;
  const exchange = Number.parseInt(round.dataset.exchange ?? "", 10);
  if (Number.isInteger(exchange)) selectBattleExchange(exchange);
});
elements.battleLog?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const round = event.target.closest(".battle-report-round");
  if (!round) return;
  event.preventDefault();
  const exchange = Number.parseInt(round.dataset.exchange ?? "", 10);
  if (Number.isInteger(exchange)) selectBattleExchange(exchange);
});
elements.rewardSkipButton?.addEventListener("click", skipUpgradeReward);
elements.stratagemChoiceCancelButton?.addEventListener("click", cancelStratagemChoice);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (elements.codexOverlay && !elements.codexOverlay.hidden) {
    closeCodex();
  }
});
document.addEventListener("pointermove", (event) => {
  if (
    pointerDraggedShopIndex === null &&
    pointerDraggedLineupIndex === null &&
    pointerDraggedEquipmentIndex === null
  ) {
    return;
  }
  event.preventDefault();
  pointerMoved = true;
  updateDragPreview(event.clientX, event.clientY);
  showDragPreview();
  if (pointerDraggedEquipmentIndex !== null) {
    markLineupEquipmentTarget(
      event.clientX,
      event.clientY,
      pointerDraggedEquipmentIndex,
    );
    markSellZoneTarget(event.clientX, event.clientY);
    return;
  }
  if (pointerDraggedShopIndex !== null) {
    markLineupDropTarget(event.clientX, event.clientY);
    return;
  }
  updateLineupDragDirection(event.clientX);
  markLineupReorderTarget(event.clientX, event.clientY, pointerDraggedLineupIndex);
  markSellZoneTarget(event.clientX, event.clientY);
});
document.addEventListener("pointerup", (event) => {
  if (
    pointerDraggedShopIndex === null &&
    pointerDraggedLineupIndex === null &&
    pointerDraggedEquipmentIndex === null
  ) {
    return;
  }
  if (pointerDraggedLineupIndex !== null) {
    updateLineupDragDirection(event.clientX);
  }
  const lineupDragIntent =
    pointerDraggedLineupIndex !== null
      ? getLineupDragIntent(
          event.clientX,
          event.clientY,
          pointerDraggedLineupIndex,
        )
      : null;
  resetLineupDragDirection();
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const droppedInSellZone = isPointInSellZone(event.clientX, event.clientY);
  clearDragPreview();
  clearLineupDropState();
  setSellZoneVisible(false);
  setBondSelectionHintSource("shop-drag", []);
  if (pointerDraggedEquipmentIndex !== null) {
    const sourceIndex = pointerDraggedEquipmentIndex;
    pointerDraggedEquipmentIndex = null;
    if (!pointerMoved) return;
    if (droppedInSellZone) {
      sellEquipment(sourceIndex);
      return;
    }
    const targetSlot = target?.closest(".lineup-slot");
    const targetIndex = Number.parseInt(targetSlot?.dataset.lineupIndex ?? "", 10);
    if (Number.isInteger(targetIndex)) moveOrSwapEquipment(sourceIndex, targetIndex);
    return;
  }
  if (pointerDraggedLineupIndex !== null) {
    const sourceIndex = pointerDraggedLineupIndex;
    pointerDraggedLineupIndex = null;
    if (!pointerMoved) return;
    if (droppedInSellZone) {
      sellUnit(sourceIndex);
      return;
    }
    if (lineupDragIntent) {
      moveOrMergeLineupUnit(
        sourceIndex,
        lineupDragIntent.targetIndex,
        lineupDragIntent,
      );
    }
    return;
  }
  const shopIndex = pointerDraggedShopIndex;
  pointerDraggedShopIndex = null;
  if (!pointerMoved) return;
  const targetSlot = target?.closest(".lineup-slot");
  const lineupIndex = Number.parseInt(targetSlot?.dataset.lineupIndex ?? "", 10);
  if (!Number.isInteger(lineupIndex)) return;
  const card = state.shop[shopIndex];
  if (card?.category === "装备") {
    buyEquipmentToLineup(shopIndex, lineupIndex);
    return;
  }
  if (card?.category === "计策") {
    useStratagemOnLineup(shopIndex, lineupIndex);
    return;
  }
  buyHeroToLineup(shopIndex, lineupIndex);
});
document.addEventListener("pointercancel", () => {
  pointerDraggedShopIndex = null;
  pointerDraggedLineupIndex = null;
  pointerDraggedEquipmentIndex = null;
  pointerMoved = false;
  resetLineupDragDirection();
  clearDragPreview();
  setSellZoneVisible(false);
  clearLineupDropState();
  setBondSelectionHintSource("shop-drag", []);
});

function createBattleTestUnit({
  name,
  side,
  index = 0,
  attack = null,
  health = null,
  level = 1,
  experience = 0,
  copies = null,
  bonusExperience = 0,
  skillEffectIds = null,
  equipment = null,
  statuses = {},
  faction = null,
}) {
  const definition = CARD_POOLS.hero.find((hero) => hero.name === name) ?? {};
  const unit = {
    ...definition,
    id: `test-${side}-${name}-${index}`,
    name,
    attack: attack ?? definition.attack ?? 1,
    health: health ?? definition.health ?? 1,
    faction: faction ?? definition.faction ?? "无",
    tier: definition.tier ?? 0,
    level,
    experience,
    copies: copies ?? UNIT_LEVEL_COPY_THRESHOLDS[level] ?? 1,
    bonusExperience,
    skillEffectIds:
      skillEffectIds ??
      [definition.effectId].filter(Boolean),
    directModifiers: {
      equipment: cloneDirectModifier(equipment),
    },
    statuses: cloneDirectModifier(statuses),
    extraFactions: [],
    tempExtraFactions: [],
  };
  return cloneBattleUnit(unit, { side, index });
}

function simulateBattleTestScenario({
  player = [],
  enemy = [],
  seed = 1,
  lockedBonds = {},
  maxExchanges = 100,
}) {
  const emptyBondLevels = Object.fromEntries(
    BOND_FACTIONS.map((faction) => [faction, 0]),
  );
  return simulateBattleScenario({
    player: player.map((unit, index) =>
      createBattleTestUnit({ ...unit, side: "player", index }),
    ),
    enemy: enemy.map((unit, index) =>
      createBattleTestUnit({ ...unit, side: "enemy", index }),
    ),
    seed,
    lockedBonds: {
      player: { ...emptyBondLevels, ...(lockedBonds.player ?? {}) },
      enemy: { ...emptyBondLevels, ...(lockedBonds.enemy ?? {}) },
    },
    enemySource: { type: "custom" },
    battleRound: 1,
    maxExchanges,
  });
}

function runBattleAnimationRegressionTests() {
  const tests = [];
  const test = (name, callback) => {
    try {
      callback();
      tests.push({ name, passed: true });
    } catch (error) {
      tests.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const getUnit = (step, side, name) =>
    step?.snapshot?.[side]?.find((unit) => unit.name === name) ?? null;
  const assertContinuous = (battle) => {
    battle.presentationTimeline.forEach((step, index) => {
      if (index === 0) return;
      assert(
        JSON.stringify(battle.presentationTimeline[index - 1].snapshot) ===
          JSON.stringify(step.beforeSnapshot),
        `步骤 ${index} 的前态与上一步后态不连续`,
      );
    });
  };
  const createShopSkillTestUnit = ({
    id,
    name,
    faction,
    level = 1,
    copies = 1,
    bonusExperience = 0,
    attack = 5,
    health = 5,
  }) => ({
    id,
    name,
    faction,
    level,
    copies,
    bonusExperience,
    experience: getUnitProgress(copies + bonusExperience).experience,
    attack: attack + Math.max(0, copies + bonusExperience - 1),
    health: health + Math.max(0, copies + bonusExperience - 1),
    baseAttack: attack,
    baseHealth: health,
    bodyAttack: attack,
    bodyHealth: health,
    directModifiers: { equipment: null, status: null, bond: null },
    statuses: {},
    extraFactions: [],
    tempExtraFactions: [],
  });

  test("3级刘备仁泽只影响最近目标且经验固定减少1点", () => {
    const previousLineup = state.lineup;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    try {
      const liubei = createShopSkillTestUnit({
        id: "liubei-renze-owner",
        name: "刘备",
        faction: "蜀",
        level: 3,
        copies: UNIT_LEVEL_COPY_THRESHOLDS[3],
        attack: 7,
        health: 7,
      });
      const nearestTarget = createShopSkillTestUnit({
        id: "liubei-renze-nearest",
        name: "赵云",
        faction: "蜀",
        copies: 1,
        bonusExperience: 2,
      });
      const fartherTarget = createShopSkillTestUnit({
        id: "liubei-renze-farther",
        name: "马超",
        faction: "蜀",
        copies: 1,
        bonusExperience: 2,
      });
      state.lineup = [liubei, nearestTarget, fartherTarget, null, null];
      const nearestProgressBefore = getUnitProgressValue(nearestTarget);
      const fartherProgressBefore = getUnitProgressValue(fartherTarget);
      const nearestBodyAttackBefore = nearestTarget.bodyAttack;
      const nearestBodyHealthBefore = nearestTarget.bodyHealth;
      const fartherBodyAttackBefore = fartherTarget.bodyAttack;
      const fartherBodyHealthBefore = fartherTarget.bodyHealth;

      resolveShopHeroSkill(
        { owner: liubei, effectId: "hero.liubei.renze" },
        { type: "round:end", payload: {} },
      );

      assert(
        getUnitProgressValue(nearestTarget) === nearestProgressBefore - 1,
        "3级刘备使最近目标减少的经验不是固定1点",
      );
      assert(
        nearestTarget.bodyAttack === nearestBodyAttackBefore + 15 &&
          nearestTarget.bodyHealth === nearestBodyHealthBefore + 15,
        "3级刘备没有使最近目标获得 +15/+15",
      );
      assert(
        getUnitProgressValue(fartherTarget) === fartherProgressBefore &&
          fartherTarget.bodyAttack === fartherBodyAttackBefore &&
          fartherTarget.bodyHealth === fartherBodyHealthBefore,
        "3级刘备错误影响了第二名同羁绊目标",
      );
    } finally {
      state.lineup = previousLineup;
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
    }
  });

  test("3级孙权权衡使前方加15攻击且后方加15生命", () => {
    const previousLineup = state.lineup;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    try {
      const behindTarget = createShopSkillTestUnit({
        id: "sunquan-quanheng-behind",
        name: "韩当",
        faction: "吴",
      });
      const sunquan = createShopSkillTestUnit({
        id: "sunquan-quanheng-owner",
        name: "孙权",
        faction: "吴",
        level: 3,
        copies: UNIT_LEVEL_COPY_THRESHOLDS[3],
      });
      const aheadTarget = createShopSkillTestUnit({
        id: "sunquan-quanheng-ahead",
        name: "太史慈",
        faction: "吴",
      });
      state.lineup = [behindTarget, sunquan, aheadTarget, null, null];
      const behindBodyAttackBefore = behindTarget.bodyAttack;
      const behindBodyHealthBefore = behindTarget.bodyHealth;
      const aheadBodyAttackBefore = aheadTarget.bodyAttack;
      const aheadBodyHealthBefore = aheadTarget.bodyHealth;

      resolveShopHeroSkill(
        { owner: sunquan, effectId: "hero.sunquan.quanheng" },
        { type: "round:end", payload: {} },
      );

      assert(
        aheadTarget.bodyAttack === aheadBodyAttackBefore + 15 &&
          aheadTarget.bodyHealth === aheadBodyHealthBefore,
        "3级孙权没有使前方最近目标获得 +15 攻击",
      );
      assert(
        behindTarget.bodyAttack === behindBodyAttackBefore &&
          behindTarget.bodyHealth === behindBodyHealthBefore + 15,
        "3级孙权没有使后方最近目标获得 +15 生命",
      );
    } finally {
      state.lineup = previousLineup;
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
    }
  });

  test("对手数据池包含至少4份完整的20回合数据", () => {
    const pool = getOpponentDataPool();
    assert(pool.length >= OPPONENT_POOL_MIN_SIZE, `有效对手数据只有 ${pool.length} 份`);
    pool.forEach((entry) => {
      assert(
        hasCompleteOpponentRounds(entry.session),
        `${entry.label} 不是完整的20回合对手数据`,
      );
    });
  });

  test("对手抽取表禁止连续重复且任意10回合单份最多3次", () => {
    const schedule = createOpponentPoolSchedule(getOpponentDataPool(), {
      random: () => 0,
    });
    assert(
      schedule.length === PLAYER_DATA_TEST_MAX_ROUND,
      `抽取表应有${PLAYER_DATA_TEST_MAX_ROUND}回合，实际为${schedule.length}`,
    );
    schedule.forEach((entry, index) => {
      if (index === 0) return;
      assert(entry.key !== schedule[index - 1].key, `第${entry.round}回合连续抽到重复数据`);
    });
    for (
      let start = 0;
      start <= schedule.length - OPPONENT_POOL_WINDOW_SIZE;
      start += 1
    ) {
      const windowEntries = schedule.slice(start, start + OPPONENT_POOL_WINDOW_SIZE);
      const counts = windowEntries.reduce((result, entry) => {
        result.set(entry.key, (result.get(entry.key) ?? 0) + 1);
        return result;
      }, new Map());
      counts.forEach((count, key) => {
        assert(
          count <= OPPONENT_POOL_MAX_PER_WINDOW,
          `第${start + 1}～${start + OPPONENT_POOL_WINDOW_SIZE}回合中 ${key} 出现${count}次`,
        );
      });
    }
  });

  test("马云禄开场经验立即更新卡面", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "马云禄" }],
      enemy: [{ name: "木桩", attack: 1, health: 20, skillEffectIds: [] }],
      seed: 17,
      maxExchanges: 0,
    });
    const skillIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "skill" &&
        step.effectId === "hero.mayunlu.xiliang-lienv",
    );
    const experienceIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "experience" &&
        step.effectId === "hero.mayunlu.xiliang-lienv",
    );
    const experienceStep = battle.presentationTimeline[experienceIndex];
    const mayunlu = getUnit(experienceStep, "player", "马云禄");
    assert(skillIndex >= 0, "缺少马云禄技能宣布步骤");
    assert(experienceIndex > skillIndex, "经验变化没有排在技能宣布之后");
    assert(
      mayunlu?.attack === 3 &&
        mayunlu?.health === 3 &&
        mayunlu?.experience === 1,
      "马云禄经验步骤后的攻血或经验不正确",
    );
    assert(
      experienceStep.changes.some(
        (change) => change.unitName === "马云禄" && change.field === "experience",
      ),
      "经验变化未写入步骤差异",
    );
    assertContinuous(battle);
  });

  test("华雄开场伤害逐段扣血", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "华雄", health: 20 }],
      enemy: [{ name: "木桩", attack: 1, health: 10, skillEffectIds: [] }],
      seed: 23,
      maxExchanges: 0,
    });
    const skillIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "skill" && step.effectId === "hero.huaxiong.xiaoyong",
    );
    const damageIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "damage" && step.effectId === "hero.huaxiong.xiaoyong",
    );
    const target = getUnit(battle.presentationTimeline[damageIndex], "enemy", "木桩");
    assert(skillIndex >= 0 && damageIndex > skillIndex, "华雄技能与伤害步骤顺序错误");
    assert(target?.health === 8, `华雄伤害后生命应为8，实际为${target?.health}`);
    assertContinuous(battle);
  });

  test("基础交锋在单一步骤同时扣除双方生命", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "甲", attack: 3, health: 10, skillEffectIds: [] }],
      enemy: [{ name: "乙", attack: 4, health: 10, skillEffectIds: [] }],
      seed: 31,
      maxExchanges: 1,
    });
    const clashes = battle.presentationTimeline.filter(
      (step) => step.kind === "clash",
    );
    assert(clashes.length === 1, "基础交锋应只有一个同步扣血步骤");
    const clash = clashes[0];
    assert(clash.simultaneous, "基础交锋没有标记为同时结算");
    assert(
      getUnit(clash, "player", "甲")?.health === 6 &&
        getUnit(clash, "enemy", "乙")?.health === 7,
      "同步交锋后的双方生命不正确",
    );
    const healthChanges = clash.changes.filter(
      (change) => change.field === "health",
    );
    assert(healthChanges.length === 2, "同步交锋未在同一步记录两份生命变化");
    assertContinuous(battle);
  });

  test("攻击后技能按当前攻击力逐个播放", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "韩当", attack: 5, health: 20 }],
      enemy: [{ name: "夏侯渊", attack: 3, health: 20 }],
      seed: 41,
      maxExchanges: 1,
    });
    const attackAfterSkills = battle.presentationTimeline.filter(
      (step) => step.kind === "skill" && step.timingWindow === "attack:after",
    );
    assert(attackAfterSkills.length >= 2, "缺少双方攻击后技能步骤");
    assert(
      attackAfterSkills[0].effectId === "hero.handang.yonglie" &&
        attackAfterSkills[1].effectId === "hero.xiahouyuan.qianli-benxi",
      "攻击后技能没有按当前攻击力从高到低结算",
    );
    assert(
      attackAfterSkills[0].resolvedAttack === 5 &&
        attackAfterSkills[1].resolvedAttack === 3,
      "技能步骤没有记录实际排序攻击力",
    );
    assertContinuous(battle);
  });

  test("装备效果不会打乱攻击后武将技能排序", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "夏侯渊",
          attack: 3,
          health: 30,
          equipment: {
            name: "灾厄之刃",
            effectId: "equipment.calamity-blade",
          },
        },
      ],
      enemy: [{ name: "韩当", attack: 5, health: 30 }],
      seed: 43,
      maxExchanges: 1,
    });
    const attackAfterSkills = battle.presentationTimeline.filter(
      (step) => step.kind === "skill" && step.timingWindow === "attack:after",
    );
    assert(
      attackAfterSkills[0]?.effectId === "hero.handang.yonglie" &&
        attackAfterSkills[1]?.effectId === "hero.xiahouyuan.qianli-benxi",
      "同优先级装备效果打乱了武将技能的动态攻击力排序",
    );
    assertContinuous(battle);
  });

  test("百厄角可随机施加全部当前负面状态", () => {
    assert(
      JSON.stringify(NEGATIVE_STATUS_POOL) ===
        JSON.stringify(["burn", "intimidated", "counterplot"]),
      `百厄角负面状态池不完整：${NEGATIVE_STATUS_POOL.join("、")}`,
    );
    const appliedStatuses = new Set();
    for (let seed = 1; seed <= 30 && appliedStatuses.size < NEGATIVE_STATUS_POOL.length; seed += 1) {
      const battle = simulateBattleTestScenario({
        player: [
          {
            name: "百厄角测试武将",
            faction: "魏",
            attack: 1,
            health: 100,
            skillEffectIds: [],
            equipment: {
              name: "百厄角",
              effectId: "equipment.calamity-blade",
            },
          },
        ],
        enemy: [
          { name: "百厄角原前排", attack: 1, health: 1, skillEffectIds: [] },
          { name: "百厄角后续前排", attack: 1, health: 100, skillEffectIds: [] },
        ],
        seed,
        maxExchanges: 1,
      });
      battle.presentationTimeline
        .filter(
          (step) =>
            step.kind === "status" &&
            step.effectId === "equipment.calamity-blade",
        )
        .forEach((step) => {
          assert(
            step.entries?.[0]?.targetName === "百厄角后续前排",
            `百厄角应作用于触发时的敌方最前排，实际为${step.entries?.[0]?.targetName}`,
          );
          appliedStatuses.add(step.entries?.[0]?.statusId);
        });
      assertContinuous(battle);
    }
    NEGATIVE_STATUS_POOL.forEach((statusId) => {
      assert(
        appliedStatuses.has(statusId),
        `百厄角回归场景未能施加${STATUS_LABELS[statusId] ?? statusId}`,
      );
    });
  });

  test("蚩尤古盾抵挡与剩余次数形成独立动画步骤", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "木桩甲", attack: 20, health: 30, skillEffectIds: [] }],
      enemy: [
        {
          name: "木桩乙",
          attack: 1,
          health: 30,
          skillEffectIds: [],
          equipment: {
            name: "蚩尤古盾",
            effectId: "equipment.black-tortoise-shield",
          },
        },
      ],
      seed: 45,
      maxExchanges: 1,
    });
    const shieldStep = battle.presentationTimeline.find(
      (step) =>
        step.kind === "equipment" &&
        step.effectId === "equipment.black-tortoise-shield",
    );
    const shieldOwner = getUnit(shieldStep, "enemy", "木桩乙");
    assert(shieldStep, "蚩尤古盾没有生成独立动画步骤");
    assert(
      shieldOwner?.equipment?.runtime?.remainingCharges === 1,
      "蚩尤古盾动画快照没有显示扣除后的剩余次数",
    );
    assertContinuous(battle);
  });

  test("传国玉玺的跨阶段强化进入独立动画步骤", () => {
    const previousShop = state.shop;
    const previousShopBondBonuses = state.shopBondBonuses;
    state.shop = [];
    state.shopBondBonuses = {};
    try {
      const battle = simulateBattleTestScenario({
        player: [
          {
            name: "玉玺测试武将",
            faction: "魏",
            attack: 1,
            health: 1,
            skillEffectIds: [],
            equipment: {
              name: "传国玉玺",
              effectId: "equipment.imperial-jade-seal",
            },
          },
        ],
        enemy: [{ name: "玉玺测试木桩", attack: 10, health: 30, skillEffectIds: [] }],
        seed: 46,
        maxExchanges: 1,
      });
      const jadeSealStep = battle.presentationTimeline.find(
        (step) =>
          step.kind === "equipment" &&
          step.effectId === "equipment.imperial-jade-seal",
      );
      assert(jadeSealStep, "传国玉玺没有生成独立动画步骤");
      assert(
        state.shopBondBonuses.魏?.attack === 1 &&
          state.shopBondBonuses.魏?.health === 1,
        "传国玉玺的商店永久加成没有实际写入",
      );
      assertContinuous(battle);
    } finally {
      state.shop = previousShop;
      state.shopBondBonuses = previousShopBondBonuses;
    }
  });

  test("交锋中阵亡的攻击者先结算攻击后技能再离场", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "韩当", attack: 5, health: 3 }],
      enemy: [{ name: "夏侯渊", attack: 3, health: 5 }],
      seed: 47,
      maxExchanges: 1,
    });
    const skillIndices = battle.presentationTimeline
      .map((step, index) => ({ step, index }))
      .filter(
        ({ step }) =>
          step.kind === "skill" && step.timingWindow === "attack:after",
      )
      .map(({ index }) => index);
    const deathIndices = battle.presentationTimeline
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.kind === "death")
      .map(({ index }) => index);
    assert(skillIndices.length === 2, "阵亡攻击者的攻击后技能没有全部锁定");
    assert(deathIndices.length >= 2, "交锋后的双方阵亡步骤缺失");
    assert(
      Math.max(...skillIndices) < Math.min(...deathIndices),
      "阵亡表现插入到了攻击后技能队列之前",
    );
    assertContinuous(battle);
  });

  test("满5人时阵亡待离场单位仍占用格子，召唤当次失败", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "后排甲", health: 20, skillEffectIds: [] },
        { name: "后排乙", health: 20, skillEffectIds: [] },
        { name: "后排丙", health: 20, skillEffectIds: [] },
        { name: "后排丁", health: 20, skillEffectIds: [] },
        { name: "夏侯渊", health: 1 },
      ],
      enemy: [
        {
          name: "召唤容量测试木桩",
          attack: 10,
          health: 100,
          skillEffectIds: [],
        },
      ],
      seed: 49,
      maxExchanges: 1,
    });
    const summonFailure = battle.presentationTimeline.find(
      (step) =>
        step.kind === "summon-failed" &&
        step.effectId === "hero.xiahouyuan.qianli-benxi",
    );
    assert(summonFailure, "满5人时夏侯渊的召唤没有判定失败");
    assert(
      !battle.playerEnd.some((unit) => unit.name === "骑兵"),
      "失败的召唤物仍在后续空位出现",
    );
    assert(
      battle.playerEnd.length === LINEUP_SLOT_COUNT - 1,
      `夏侯渊离场后应只剩4名武将，实际为${battle.playerEnd.length}名`,
    );
    battle.presentationTimeline.forEach((step, index) => {
      assert(
        step.snapshot.player.length <= LINEUP_SLOT_COUNT,
        `步骤${index}的我方阵容超过5格`,
      );
    });
    assertContinuous(battle);
  });

  test("多段技能每段伤害都是独立步骤", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "张角", health: 20 }],
      enemy: [{ name: "木桩", attack: 1, health: 100, skillEffectIds: [] }],
      seed: 53,
      maxExchanges: 0,
    });
    const damageSteps = battle.presentationTimeline.filter(
      (step) =>
        step.kind === "damage" &&
        step.effectId === "hero.zhangjiao.wulei-hongding",
    );
    assert(damageSteps.length === 5, `张角应有5段伤害，实际为${damageSteps.length}`);
    damageSteps.forEach((step, index) => {
      assert(
        step.cues.length === 1,
        `张角第${index + 1}段伤害没有独立浮字`,
      );
    });
    assertContinuous(battle);
  });

  test("2级荀攸单次触发只使1级召唤物升至2级2经验", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "荀攸",
          level: 2,
          copies: UNIT_LEVEL_COPY_THRESHOLDS[2],
          health: 100,
        },
        {
          name: "夏侯渊",
          level: 1,
          copies: UNIT_LEVEL_COPY_THRESHOLDS[1],
          health: 100,
        },
      ],
      enemy: [
        {
          name: "荀攸经验测试木桩",
          attack: 1,
          health: 100,
          skillEffectIds: [],
        },
      ],
      seed: 59,
      maxExchanges: 1,
    });
    const cavalry = battle.playerEnd.find((unit) => unit.name === "骑兵");
    assert(cavalry, "夏侯渊没有召唤出用于验证荀攸经验的骑兵");
    assert(
      cavalry.level === 2 &&
        cavalry.experience === 2 &&
        cavalry.bonusExperience === 4,
      `2级荀攸单次应给予4点经验，使LV1召唤物停在LV2 2/3；实际为LV${
        cavalry.level
      }、经验${cavalry.experience}、直接经验${cavalry.bonusExperience}`,
    );
    assertContinuous(battle);
  });

  test("全部60名武将可生成连续的一轮动画时间线", () => {
    CARD_POOLS.hero.forEach((hero, heroIndex) => {
      const battle = simulateBattleTestScenario({
        player: [{ name: hero.name, health: 200 }],
        enemy: [
          {
            name: `木桩${heroIndex + 1}`,
            attack: 1,
            health: 200,
            skillEffectIds: [],
          },
        ],
        seed: 1000 + heroIndex,
        maxExchanges: 1,
      });
      assert(
        battle.presentationTimeline.length >= 4,
        `${hero.name}没有生成完整动画时间线`,
      );
      battle.presentationTimeline.forEach((step) => {
        ["player", "enemy"].forEach((side) => {
          step.snapshot[side].forEach((unit) => {
            assert(
              Number.isFinite(unit.attack) && Number.isFinite(unit.health),
              `${hero.name}时间线出现非法攻血`,
            );
          });
        });
      });
      assertContinuous(battle);
    });
  });

  test("敌我双方东吴业火均锁定对方最后方武将", () => {
    const assertBurnedUnits = (battle, side, expectedNames) => {
      const actualNames = battle[`${side}End`]
        .filter((unit) => unit.statuses?.burn)
        .map((unit) => unit.name)
        .sort();
      const sortedExpectedNames = [...expectedNames].sort();
      assert(
        JSON.stringify(actualNames) === JSON.stringify(sortedExpectedNames),
        `${side === "player" ? "我方" : "敌方"}灼烧目标应为${sortedExpectedNames.join(
          "、",
        )}，实际为${actualNames.join("、")}`,
      );
    };

    const enemyWuBattle = simulateBattleTestScenario({
      player: [
        { name: "我方最后方", health: 20, skillEffectIds: [] },
        { name: "我方后方第二", health: 20, skillEffectIds: [] },
        { name: "我方中间", health: 20, skillEffectIds: [] },
        { name: "我方前方第二", health: 20, skillEffectIds: [] },
        { name: "我方最前方", health: 20, skillEffectIds: [] },
      ],
      enemy: [
        {
          name: "敌方吴羁绊载体",
          faction: "吴",
          health: 20,
          skillEffectIds: [],
        },
      ],
      lockedBonds: { enemy: { 吴: 2 } },
      seed: 77,
      maxExchanges: 0,
    });
    assertBurnedUnits(enemyWuBattle, "player", [
      "我方最后方",
      "我方后方第二",
      "我方中间",
    ]);

    const playerWuBattle = simulateBattleTestScenario({
      player: [
        {
          name: "我方吴羁绊载体",
          faction: "吴",
          health: 20,
          skillEffectIds: [],
        },
      ],
      enemy: [
        { name: "敌方最前方", health: 20, skillEffectIds: [] },
        { name: "敌方前方第二", health: 20, skillEffectIds: [] },
        { name: "敌方中间", health: 20, skillEffectIds: [] },
        { name: "敌方后方第二", health: 20, skillEffectIds: [] },
        { name: "敌方最后方", health: 20, skillEffectIds: [] },
      ],
      lockedBonds: { player: { 吴: 2 } },
      seed: 79,
      maxExchanges: 0,
    });
    assertBurnedUnits(playerWuBattle, "enemy", [
      "敌方中间",
      "敌方后方第二",
      "敌方最后方",
    ]);
  });

  test("四类羁绊变化均进入可见时间线", () => {
    const weiBattle = simulateBattleTestScenario({
      player: Array.from({ length: 4 }, (_, index) => ({
        name: `魏兵${index + 1}`,
        faction: "魏",
        attack: 1,
        health: 1,
        skillEffectIds: [],
      })),
      enemy: [{ name: "魏测试木桩", attack: 10, health: 100, skillEffectIds: [] }],
      lockedBonds: { player: { 魏: 1 } },
      seed: 71,
      maxExchanges: 4,
    });
    const counterSteps = weiBattle.presentationTimeline.filter(
      (step) => step.kind === "counter" && step.effectId === "bond.wei-death",
    );
    assert(counterSteps.length === 4, "魏羁绊的4次阵亡计数没有逐次展示");
    assert(
      counterSteps[0].snapshot.bondCounters.player.魏阵亡 === 1 &&
        counterSteps[3].snapshot.bondCounters.player.魏阵亡 === 4,
      "魏羁绊计数快照被后续变化污染",
    );
    assert(
      weiBattle.presentationTimeline.some(
        (step) => step.kind === "summon" && step.effectId === "bond.wei-death",
      ),
      "魏羁绊达到4次后没有召唤表现",
    );
    const firstWeiCounterState = getBattleAnimationFieldState(
      weiBattle,
      counterSteps[0],
      counterSteps[0].snapshot,
    );
    const firstWeiBondMarkup = renderBattleAnimationFieldBonds(
      weiBattle,
      "player",
      counterSteps[0],
      counterSteps[0].snapshot,
      firstWeiCounterState,
    );
    assert(
      firstWeiBondMarkup.includes("魏武遗风") &&
        firstWeiBondMarkup.includes("每阵亡4名魏将") &&
        firstWeiBondMarkup.includes("召唤 1/4"),
      "魏羁绊名称、效果或召唤进度没有显示在阵容上方",
    );
    assert(
      firstWeiBondMarkup.includes("is-triggered"),
      "魏羁绊计数增加时没有高亮",
    );

    const shuBattle = simulateBattleTestScenario({
      player: [
        {
          name: "马云禄",
          experience: 1,
          bonusExperience: 1,
          health: 20,
        },
      ],
      enemy: [{ name: "蜀测试木桩", attack: 1, health: 30, skillEffectIds: [] }],
      lockedBonds: { player: { 蜀: 1 } },
      seed: 73,
      maxExchanges: 0,
    });
    assert(
      shuBattle.presentationTimeline.some(
        (step) =>
          step.kind === "stat" &&
          step.effectId === "bond.shu-upgrade" &&
          getUnit(step, "player", "马云禄")?.level === 2,
      ),
      "战斗内升级后的蜀羁绊属性变化没有展示",
    );

    const wuBattle = simulateBattleTestScenario({
      player: [{ name: "吴测试兵", faction: "吴", health: 20, skillEffectIds: [] }],
      enemy: [
        { name: "吴木桩甲", attack: 1, health: 20, skillEffectIds: [] },
        { name: "吴木桩乙", attack: 1, health: 20, skillEffectIds: [] },
      ],
      lockedBonds: { player: { 吴: 1 } },
      seed: 79,
      maxExchanges: 0,
    });
    assert(
      wuBattle.presentationTimeline.filter(
        (step) => step.kind === "status" && step.effectId === "bond.wu-battle-start",
      ).length === 2,
      "吴羁绊施加的两个灼烧没有逐个展示",
    );

    const groupBattle = simulateBattleTestScenario({
      player: [{ name: "华雄", health: 20 }],
      enemy: [{ name: "群测试木桩", attack: 1, health: 20, skillEffectIds: [] }],
      lockedBonds: { player: { 群: 1 } },
      seed: 83,
      maxExchanges: 0,
    });
    const groupDamage = groupBattle.presentationTimeline.find(
      (step) =>
        step.kind === "damage" && step.effectId === "hero.huaxiong.xiaoyong",
    );
    assert(
      groupDamage?.entries?.[0]?.damage === 3,
      "群羁绊的开场伤害加成没有进入华雄伤害步骤",
    );
    const groupFieldState = getBattleAnimationFieldState(
      groupBattle,
      groupDamage,
      groupDamage.snapshot,
    );
    assert(
      groupFieldState.triggeredBonds.player.includes("群"),
      "群羁绊修改开场伤害时没有标记为触发",
    );
    [weiBattle, shuBattle, wuBattle, groupBattle].forEach(assertContinuous);
  });

  test("赵云无双固定攻击后方1人且显示无双", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "诸葛亮", attack: 10, health: 100 },
        {
          name: "赵云",
          level: 2,
          copies: UNIT_LEVEL_COPY_THRESHOLDS[2],
          bonusExperience: 2,
          health: 100,
        },
      ],
      enemy: [
        { name: "前排木桩", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩甲", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩乙", attack: 1, health: 100, skillEffectIds: [] },
      ],
      seed: 89,
      maxExchanges: 1,
    });
    const cleaveSteps = battle.presentationTimeline.filter(
      (step) => step.kind === "damage" && step.effectId === "status.unparalleled-cleave",
    );
    assert(cleaveSteps.length === 1, `赵云无双应只命中1名后方单位，实际为${cleaveSteps.length}`);
    assert(cleaveSteps[0].effectName === "无双", "赵云无双生效时错误显示为其他状态");
    assert(
      cleaveSteps[0].entries?.[0]?.targetName === "后排木桩甲",
      "赵云无双没有命中目标后方最近的单位",
    );
    assertContinuous(battle);
  });

  test("吕布无双可随技能强化至最多攻击后方3人", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "吕布", level: 3, attack: 12, health: 100 }],
      enemy: [
        { name: "前排木桩", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩甲", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩乙", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩丙", attack: 1, health: 100, skillEffectIds: [] },
      ],
      seed: 97,
      maxExchanges: 1,
    });
    const cleaveSteps = battle.presentationTimeline.filter(
      (step) => step.kind === "damage" && step.effectId === "status.unparalleled-cleave",
    );
    assert(cleaveSteps.length === 3, `3级吕布无双应命中3名后方单位，实际为${cleaveSteps.length}`);
    assert(
      cleaveSteps.every((step) => step.effectName === "无双"),
      "吕布无双生效时错误显示为其他状态",
    );
    assertContinuous(battle);
  });

  test("同名武将的浮字与高亮只匹配唯一单位", () => {
    const first = { id: "same-name-1", name: "骑兵" };
    const second = { id: "same-name-2", name: "骑兵" };
    assert(
      battleAnimationIdentityMatches(first, [{ id: first.id, name: first.name }]),
      "目标单位没有按唯一ID匹配",
    );
    assert(
      !battleAnimationIdentityMatches(second, [{ id: first.id, name: first.name }]),
      "同名但不同ID的单位被错误高亮",
    );
  });

  test("战斗动画倍速只使用1、2、3、5四档", () => {
    assert(
      BATTLE_ANIMATION_SPEEDS.every(
        (speed) => getBattleAnimationSpeed(speed) === speed,
      ),
      "合法倍速档位没有被保留",
    );
    assert(getBattleAnimationSpeed(4) === 1, "非法倍速没有回退到1倍速");
  });

  test("战斗详情固定显示上一条、当前、下一条且当前操作不重复", () => {
    const markup = renderBattleAnimationContextList(
      [
        { kind: "ready", title: "准备战斗" },
        { kind: "opening", phase: "battle:start", title: "东吴业火 LV1触发" },
        { kind: "result", title: "战斗结束" },
      ],
      1,
    );
    assert(
      (markup.match(/battle-animation-context-row/g) ?? []).length === 3,
      "战斗详情没有固定显示三行",
    );
    ["上一条操作", "当前操作", "下一条操作"].forEach((label) => {
      assert(markup.includes(label), `战斗详情缺少“${label}”`);
    });
    assert(
      markup.split("东吴业火 LV1触发").length - 1 === 1,
      "当前操作在战斗详情中被重复显示",
    );
  });

  test("阵容上方只显示已激活羁绊及其当前效果", () => {
    const battle = {
      lockedBonds: {
        player: { 魏: 1, 蜀: 2, 吴: 3, 群: 0 },
        enemy: { 魏: 0, 蜀: 0, 吴: 0, 群: 0 },
      },
    };
    const markup = renderBattleAnimationFieldBonds(
      battle,
      "player",
      { entries: [] },
      { bondCounters: { player: { 魏阵亡: 0 } } },
      { triggeredBonds: { player: [], enemy: [] } },
    );
    assert(
      ["魏武遗风", "蜀汉再兴", "东吴业火"].every((label) =>
        markup.includes(label),
      ),
      "已激活羁绊没有完整显示",
    );
    assert(!markup.includes("群雄并起"), "未激活羁绊被错误显示");
    assert(
      markup.includes(BOND_RULES.魏.effects[1]) &&
        markup.includes(BOND_RULES.蜀.effects[2]) &&
        markup.includes(BOND_RULES.吴.effects[3]),
      "羁绊没有显示当前等级对应效果",
    );
  });

  test("战斗动画不渲染卡牌外的重复名字和属性条", () => {
    const unit = {
      id: "health-display-unit",
      name: "韩当",
      level: 1,
      experience: 0,
      attack: 3,
      health: 2,
      maxHealth: 7,
      statuses: {},
      extraFactions: [],
      tempExtraFactions: [],
    };
    const markup = renderBattleAnimationFieldCard(
      unit,
      "player",
      1,
      {
        sources: [{ id: unit.id, name: unit.name }],
        targets: [],
        deaths: [],
        changedUnitIds: [],
        ally: null,
        foe: null,
        popups: [],
      },
      0,
    );
    assert(markup.includes("hero-nameplate"), "完整卡牌内的名字信息丢失");
    assert(markup.includes("hero-level-text"), "完整卡牌内的等级信息丢失");
    assert(!markup.includes("battle-field-name"), "卡牌外仍显示重复武将名");
    assert(!markup.includes("battle-field-live-state"), "卡牌下方仍显示重复属性条");
  });

  test("全部状态在商店阵容、战斗动画和战报快照共用无文字边框特效", () => {
    const unit = {
      id: "status-visual-unit",
      name: "韩当",
      faction: "吴",
      tier: 1,
      level: 1,
      experience: 0,
      attack: 3,
      health: 7,
      skill: "",
      statuses: {},
      skillDisabled: false,
      directModifiers: { equipment: null },
      extraFactions: [],
      tempExtraFactions: [],
    };
    const expectedStatusIds = [
      "burn",
      "intimidated",
      "counterplot",
      "unparalleled",
      "rest",
      "skill-disabled",
    ];
    const assertStatusEffect = (markup, surfaceName, statusId) => {
      const template = document.createElement("template");
      template.innerHTML = markup.trim();
      const card = template.content.querySelector(".hero-card");
      const effectRoot = card?.querySelector(".hero-card-status-effects");
      assert(Boolean(effectRoot), `${surfaceName}没有状态边框特效容器`);
      assert(
        !card?.querySelector(".hero-card-statuses"),
        `${surfaceName}仍在渲染旧状态标签`,
      );
      assert(
        card?.classList.contains(`has-status-${statusId}`) &&
          Boolean(effectRoot?.querySelector(`.status-effect-${statusId}`)),
        `${surfaceName}缺少${STATUS_LABELS[statusId]}边框特效`,
      );
      assert(
        effectRoot?.textContent.trim() === "",
        `${surfaceName}的状态边框内仍包含可见文字`,
      );
    };

    expectedStatusIds.forEach((statusId) => {
      const statusUnit = {
        ...unit,
        statuses: statusId === "skill-disabled" ? {} : { [statusId]: {} },
        skillDisabled: statusId === "skill-disabled",
      };
      assertStatusEffect(
        createHeroCardMarkup(statusUnit, { lineupIndex: 0 }),
        "商店阵容",
        statusId,
      );
      const battleCardMarkup = renderBattleAnimationFieldCard(
        statusUnit,
        "player",
        1,
        {
          sources: [],
          targets: [],
          deaths: [],
          changedUnitIds: [],
          ally: null,
          foe: null,
          popups: [],
        },
        0,
      );
      assertStatusEffect(battleCardMarkup, "战斗动画", statusId);
      assertStatusEffect(
        createHeroCardMarkup(getBattleSnapshotCardUnit(statusUnit, 1), {
          battleSnapshot: true,
        }),
        "战报快照",
        statusId,
      );
    });
  });

  return {
    passed: tests.every((entry) => entry.passed),
    tests,
  };
}

function mountBattleAnimationRegressionResults() {
  const results = runBattleAnimationRegressionTests();
  const output = document.createElement("pre");
  output.id = "battleAnimationTestResults";
  output.dataset.passed = String(results.passed);
  output.textContent = JSON.stringify(results, null, 2);
  output.style.cssText =
    "position:fixed;inset:12px;z-index:99999;overflow:auto;margin:0;padding:16px;background:#111;color:#eee;font:14px/1.5 monospace;";
  document.body.append(output);
}

function mountBattleAnimationPreview() {
  state.battle = simulateBattleTestScenario({
    player: [
      { name: "马云禄", health: 20 },
      { name: "韩当", attack: 5, health: 20 },
    ],
    enemy: [
      { name: "夏侯渊", attack: 3, health: 4 },
      { name: "华雄", health: 20 },
    ],
    lockedBonds: {
      player: { 蜀: 1, 吴: 1 },
      enemy: { 魏: 1, 群: 1 },
    },
    seed: 20260731,
    maxExchanges: 1,
  });
  state.phase = "battle";
  state.battle.view = "animation";
  state.battle.animationIndex = 0;
  state.battle.animationPlaying = false;
  render();
}

function mountGameResultPreview(outcome) {
  const isVictory = outcome === "victory";
  const heroNames = isVictory
    ? ["刘备", "马云禄", "赵云", "诸葛亮", "孙权"]
    : ["华雄", "袁绍", "张角", "贾诩", "吕布"];
  const previewCopies = [6, 3, 3, 1, 1];
  state.lineup = heroNames.map((name, index) => {
    const base = CARD_POOLS.hero.find((hero) => hero.name === name);
    if (!base) return null;
    const unit = createUnitFromCard(createCardFromBase(base, "hero"));
    const copies = previewCopies[index];
    const progress = getUnitProgress(copies);
    unit.copies = copies;
    unit.level = progress.level;
    unit.experience = progress.experience;
    if (copies > 1) addUnitBodyStats(unit, copies - 1, copies - 1);
    syncUnitStats(unit);
    return unit;
  });
  state.round = isVictory ? 12 : 9;
  state.phase = "battle";
  state.gold = 0;
  state.life = isVictory ? 4 : 0;
  state.flags = isVictory ? FLAG_VICTORY_TARGET : 3;
  state.battleRecord = isVictory
    ? { wins: 10, losses: 2, draws: 0 }
    : { wins: 3, losses: 5, draws: 1 };
  state.battle = null;
  state.gameOutcome = isVictory ? "victory" : "defeat";
  state.gameOver = true;
  render();
}

function mountGameRuleRegressionResults() {
  const testCases = [];
  const test = (name, run) => {
    try {
      run();
      testCases.push({ name, passed: true });
    } catch (error) {
      testCases.push({ name, passed: false, message: error.message });
    }
  };
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  test("新局初始为5生命、0旗帜", () => {
    const initial = createInitialState();
    assert(initial.life === 5, `初始生命应为5，实际为${initial.life}`);
    assert(initial.flags === 0, `初始旗帜应为0，实际为${initial.flags}`);
  });
  test("第3回合恢复1生命且不超过5", () => {
    assert(getLifeAfterRoundStart(3, 3) === 4, "第3回合未正确恢复1生命");
    assert(getLifeAfterRoundStart(5, 3) === 5, "第3回合生命超过5点上限");
    assert(getLifeAfterRoundStart(3, 2) === 3, "非第3回合错误恢复生命");
  });
  test("胜利加1旗帜并在10旗帜时获胜", () => {
    const progress = { life: 2, flags: 9, battleRecord: { wins: 9, losses: 3, draws: 0 } };
    applyBattleResultToGameState(progress, "win");
    assert(progress.flags === 10, `旗帜应为10，实际为${progress.flags}`);
    assert(progress.life === 2, "胜利不应扣除生命");
    assert(progress.battleRecord.wins === 10, "胜场统计未增加");
    assert(getGameOutcome(progress.life, progress.flags) === "victory", "10旗帜未判定胜利");
  });
  test("失败减1生命并在归零时失败", () => {
    const progress = { life: 1, flags: 4, battleRecord: { wins: 4, losses: 4, draws: 0 } };
    applyBattleResultToGameState(progress, "loss");
    assert(progress.life === 0, `生命应为0，实际为${progress.life}`);
    assert(progress.flags === 4, "失败不应减少旗帜");
    assert(progress.battleRecord.losses === 5, "负场统计未增加");
    assert(getGameOutcome(progress.life, progress.flags) === "defeat", "生命归零未判定失败");
  });
  test("平局不改变生命与旗帜", () => {
    const progress = { life: 4, flags: 6, battleRecord: { wins: 6, losses: 1, draws: 0 } };
    applyBattleResultToGameState(progress, "draw");
    assert(progress.life === 4 && progress.flags === 6, "平局改变了生命或旗帜");
    assert(progress.battleRecord.draws === 1, "平局统计未增加");
    assert(getGameOutcome(progress.life, progress.flags) === null, "普通进度被错误判定为终局");
  });

  const results = {
    passed: testCases.every((entry) => entry.passed),
    tests: testCases,
  };
  const output = document.createElement("pre");
  output.id = "gameRuleTestResults";
  output.dataset.passed = String(results.passed);
  output.textContent = JSON.stringify(results, null, 2);
  output.style.cssText =
    "position:fixed;inset:12px;z-index:99999;overflow:auto;margin:0;padding:16px;background:#111;color:#eee;font:14px/1.5 monospace;";
  document.body.append(output);
}

refreshShop({ free: true });

const runtimeSearchParams = new URLSearchParams(window.location.search);
if (runtimeSearchParams.has("battle-animation-test")) {
  mountBattleAnimationRegressionResults();
} else if (runtimeSearchParams.has("game-rules-test")) {
  mountGameRuleRegressionResults();
} else if (runtimeSearchParams.has("battle-animation-preview")) {
  mountBattleAnimationPreview();
} else if (["victory", "defeat"].includes(runtimeSearchParams.get("game-result-preview"))) {
  mountGameResultPreview(runtimeSearchParams.get("game-result-preview"));
}
