---
doc_id: domain.topic
title: 文档标题
status: draft
authority: reference
authoritative_for:
  - 明确列出本文档最终负责的事项
not_authoritative_for:
  - 明确列出容易被误用但不由本文档负责的事项
depends_on: []
last_reviewed: YYYY-MM-DD
---

# 文档标题

## 1. 目的

说明本文档解决什么问题，以及读者在什么任务下应该阅读。

## 2. 适用范围

明确包含和不包含的系统、版本或实现范围。

## 3. 术语

只记录本文件需要且容易产生歧义的术语。

## 4. 规则或内容

写入正文。规则必须可验证，避免同时维护多个含义相同但数值不同的表。

## 5. 依赖与影响

- 上游依据：
- 下游文档：
- 相关实现：
- 相关数据：

## 6. 未决事项

记录尚未确认、不能由 Agent 自行决定的问题。

## 7. 变更记录

语义性变更统一登记到 `.harness/CHANGELOG.md`，此处只在确有必要时保留文档内部历史。
