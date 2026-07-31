# 文档 Harness 维护说明

## 系统组成

| 文件 | 职责 |
|---|---|
| `AGENTS.md` | Agent 自动进入仓库时看到的强制入口 |
| `.harness/ROUTER.md` | 阅读、检索、冲突和停止条件 |
| `.harness/manifest.json` | 所有文档的统一清单、状态、权威范围和依赖 |
| `.harness/routes.json` | 按任务类型定义最小阅读集合与检索范围 |
| `.harness/CHANGELOG.md` | 文档体系和规则文档的语义变更记录 |
| `.harness/templates/document.md` | 新建规范文档的模板 |
| `.harness/validate.ps1` | 检查路径、ID、引用和路由覆盖 |

## Agent 如何使用

1. 从 `AGENTS.md` 进入。
2. 按 `routes.json` 选择任务路由。
3. 阅读该路由的必要文档。
4. 在允许范围内检索。
5. 按 `manifest.json` 处理权威和冲突。
6. 有文档治理变更时更新清单、路由和变更记录。

Harness 管理的是“如何找到正确依据”，不替代业务文档本身。

本项目的具体游戏数据只维护在 `游戏数据速查.md`。已删除的 `羁绊系统.xlsx` 不属于 Harness 数据源，不得为修改武将技能、装备、计策或羁绊数据而恢复或读取。

## 新增文档

1. 使用 `.harness/templates/document.md` 创建文档。
2. 为文档分配稳定的 `doc_id`，格式建议为 `<领域>.<主题>`。
3. 在 `manifest.json` 中登记：
   - 路径与格式；
   - 状态；
   - 权威等级；
   - `authoritative_for`；
   - 不负责的范围；
   - 依赖关系。
4. 至少把文档加入一个业务路由。
5. 在 `CHANGELOG.md` 登记。
6. 运行 `validate.ps1`。

不要创建与现有主规范职责重叠的新文档。优先扩展现有权威文档，或明确写出新文档覆盖的范围。

## 修改文档

普通文字修正不必改变权威关系，但规则、数值、范围或依赖变化必须：

- 检查依赖该文档的其他文档和实现；
- 在 `CHANGELOG.md` 记录语义变化；
- 如果职责变化，同步修改 `manifest.json`；
- 如果阅读条件变化，同步修改 `routes.json`。

## 移动、重命名或废弃

移动或重命名必须在同一次变更中更新所有路径引用。废弃文档优先标记：

```json
{
  "status": "deprecated",
  "superseded_by": "新的文档 id"
}
```

不要直接删除仍被其他文档或路由引用的文件。

## 状态定义

| 状态 | 含义 |
|---|---|
| `active` | 当前有效 |
| `needs-review` | 仍可使用，但已知可能滞后，引用时需要核对 |
| `reference` | 仅用于背景和历史，不覆盖当前规范 |
| `deprecated` | 已被替代，等待清理 |
| `excluded` | 明确禁止作为依据 |

## 权威定义

| 权威 | 含义 |
|---|---|
| `primary` | 某个明确领域的最终规则或数据源 |
| `implementation-rule` | 当前实现阶段的专项规则 |
| `operational` | 运行方式和实现范围说明 |
| `reference` | 历史、探索或概念参考 |
| `control` | Harness 自身控制文件 |
| `record` | 变更历史 |
| `none` | 不具备权威性 |

权威始终按 `authoritative_for` 的具体范围判断，不允许脱离范围比较高低。

## 运行校验

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .harness/validate.ps1
```

校验通过只表示路由结构完整，不表示业务规则彼此一致。语义冲突仍需按 `ROUTER.md` 处理。
