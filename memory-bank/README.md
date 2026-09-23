# Memory Bank

跨会话保留上下文的轻量笔记。Claude/AI Agent 在新一轮开始时可先读 `activeContext.md` 和 `tasks.md` 来快速对齐。

## 文件分工

| 文件 | 作用 | 更新时机 |
|---|---|---|
| `tasks.md` | **Pending 任务** + **Done 流水**（最近 20 条） | 每次新增/完成任务 |
| `techContext.md` | 部署拓扑、关键路径、端口、约定 | 部署/架构变更时 |
| `activeContext.md` | 当前焦点、近期决策、上次中断时的"下一步" | 每轮结束前 |

## 使用规则

- Pending 任务只写**用户明确说"考虑/后续"的事项**，不要把临时小修小补也塞进来
- Done 流水按倒序写，最多保留 20 条；旧条目移到 `archive/`
- 文件用中文，技术名词保留英文（nginx / FastAPI / proxy_pass 等）
- 不写可以从代码 / git 历史直接推断的内容