# Agent 文档 Harness

本文件是本仓库所有 Agent 的强制入口。除非用户明确指定其他流程，开始阅读、检索、分析或修改前必须执行以下步骤。

## 强制路由

1. 先完整阅读 `.harness/ROUTER.md`。
2. 再读取 `.harness/routes.json`，根据任务目标选择一个主路由；跨领域任务可以增加辅助路由。
3. 只读取所选路由的 `required` 文档。只有满足 `conditional.when` 时，才读取对应条件文档。
4. 检索必须先限制在路由的 `search_paths` 内；不得在没有路由依据时遍历全部文档、图片或资源目录。
5. 修改前按 `.harness/manifest.json` 确认文档权威范围和依赖关系。

## 强制约束

- 用户在当前任务中的明确要求优先级最高。
- 不得把“当前代码行为”自动解释为“设计规则”；代码只能证明现状。
- 不得把历史或参考文档用于覆盖当前权威规范。
- `游戏数据速查.md` 是武将、装备、计策和羁绊具体数据的唯一权威来源；不得查找、恢复或使用已删除的 `羁绊系统.xlsx` 作为依据。
- `羁绊与卡牌能力.xlsx` 仅是 2026-08-05 新版正式数据的一次性导入输入；导入后续修改必须先维护 `游戏数据速查.md`，代码不得直接读取该 Excel。
- 两个同级权威来源发生冲突时，必须指出冲突并向用户确认，禁止静默选择。
- 新增、删除、重命名、移动文档，或改变文档权威范围时，必须同步更新 `.harness/manifest.json`、`.harness/routes.json` 和 `.harness/CHANGELOG.md`。
- 完成文档体系变更后运行 `.harness/validate.ps1`。

## 快速入口

- 路由规则：`.harness/ROUTER.md`
- 文档目录：`.harness/manifest.json`
- 任务路由：`.harness/routes.json`
- 维护规范：`.harness/README.md`
