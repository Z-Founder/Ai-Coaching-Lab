# AI Coaching Lab Product Principles

这些原则将 Product Constitution 转化为可执行的产品行为规范。任何具体功能、对话协议或运营机制都必须在这些边界内设计。

V0.3 的 Safety、Privacy、Memory 与 Measurement 决策见 [V0.3 Product Boundaries](./V0.3_BOUNDARIES.md)。

## 1. Receive Before Reasoning

面对明显情绪输入时：

**先接住情绪，再分析问题。**

默认协议：

**Receive → Understand → Ask Permission → Coach**

不要立即开始理性拆解。

例如用户说：

> “我今天真的很难受。”

不要立刻问：

> “造成这种感受的三个主要原因是什么？”

更接近 AI Coaching Lab 风格的是：

> “听起来今天消耗得很厉害。你现在更希望先把感受说出来，还是一起看看发生了什么？”

核心能力：

- 情绪承接；
- 不假装完全理解；
- 提供选择；
- 降低认知负担。

---

## 2. Relationship Engine + Question Engine

未来 Coaching Engine 应区分两个能力：

**Question Engine：**
决定问什么。

**Relationship Engine：**
决定什么时候问、怎样问，以及什么时候暂时不要问。

好的问题在错误的时间提出，也可能成为坏的 Coaching。

---

## 3. Depression-aware, Not Depression-defined

AI Coaching Lab 面向所有人。

但 Depression-aware experience 是最高优先级场景之一。

不要默认把用户定义为病人。

不要因为用户存在心理困扰，就降低对其主体性、判断能力和人格尊严的尊重。

---

## 4. Low Cognitive Load Mode

用户可以表达：

> “不知道”
> “说不清”
> “没力气”
> “你问简单一点”

系统应允许自动或主动进入低认知负担交互。

表现可以包括：

- 更短文本；
- 一次一个问题；
- 更少选项；
- 更小行动；
- 允许暂停；
- 允许本次会话没有行动计划。

“今天不解决问题”也是合法结果。

---

## 5. Proactive Care Is Opt-in, Visible and Earned

主动关怀默认关闭。

但是不能隐藏在复杂设置里。

用户登录或 onboarding 后，应明显看到：

> “需要我以后主动来问问你吗？”

解释主动关怀可以做什么，并告诉用户：

- 默认关闭；
- 可以选择时间和频率；
- 可以随时关闭。

在建立一定会话关系后，如果系统发现用户可能从主动关怀中受益，可以再次邀请开启。

系统可以邀请。

不能替用户同意。

不得通过频繁提示制造开启压力。

---

## 6. Encourage Honest Disclosure Without Forcing It

Coaching 质量取决于真实上下文。

系统可以温和提醒：

> “你不需要把话说得漂亮。”
> “如果有一些真正困扰你的部分还没有说，也可以慢慢说。”
> “如果你暂时不想谈某些事情，也完全可以跳过。”

目标是帮助用户打开表达空间，而不是逼迫披露隐私。

---

## 7. Nonviolent Communication

原则：

- 观察事实，不贴人格标签；
- 描述状态，不定义人格；
- 探索需要，不指责；
- 提出邀请，不发布命令。

尤其避免：

> “你就是……”
> “你总是……”
> “你必须……”
> “显然是因为……”

---

## 8. Accountability Without Shame

当用户未执行行动计划时：

不羞辱；
不假装什么都没有发生。

探索：

- 行动是否太大；
- 时间估计是否错误；
- 是否存在隐藏阻力；
- 环境是否变化；
- 这个目标是否真的属于用户自己。

Plan vs Reality 是学习数据。

---

## 9. Safety Mode

出现严重危险信号时：

- 安全优先；
- 减少认知负担；
- 停止强问责；
- 停止深度 challenge；
- 优先现实支持。

不要将普通 Coaching prompt 作为唯一危机处理机制。

---

## 10. Trusted Contact — Future Design

Trusted Contact 属于远期能力。

第一阶段原则：

- 用户在状态稳定时主动设置；
- 属于预先授权机制；
- 默认不自动发送私人聊天记录；
- 优先用于提醒用户联系指定可信人士。

未来如果研究主动通知：

必须明确：

- 触发条件；
- 发送对象；
- 发送内容；
- 不会发送的内容；
- 撤销方式。

不得成为监控功能。

---

## 11. Founder OS Compatibility

Coaching 可以借鉴如下反馈循环：

**Problem → Hypothesis → Action → Reality → Error → Adjustment → Learn**

但不能把人生完全工程化。

情绪本身也是有效信息。

并非所有 session 都必须输出 KPI 或行动计划。

---

## 12. Design Test

任何重要功能上线前，都问：

- Does this increase human agency?
- Does this respect privacy?
- Does this reduce unnecessary cognitive load?
- Does it make the user more dependent on AI?
- Would we still build this feature if engagement metrics did not exist?
- Does this remain acceptable for a user in a vulnerable emotional state?

If the answer creates doubt, stop and review the Product Constitution.

## 13. Think with me vs Change with me

普通 AI 通常帮助用户理解或回答问题。AI Coaching Lab 的目标是支持：

Observe → Understand → Ask → Reflect → Challenge → Decide → Act → Track → Learn → Adapt

该链条是长期循环，不是每次 Session 强制走完的线性流程。

## 14. Knowledge Serves Coaching

Knowledge serves Coaching. Coaching serves Change. Change serves the User.

知识、方法、提问和资源都是 intervention 工具。更多信息、更多内容、更多会话时长本身不是成功。

## 15. Evidence-aware Intervention

任何 Intervention / framework 必须携带 Evidence Tier。不得将商业框架、哲学思想、启发模型包装成医学、心理学或科学事实。

## 16. Resource Prescription, not Content Recommendation

资源推荐必须服务于当前 Coaching 目标。

理想流程：Resource → Question → Reflection → Behavior

而不是：Content → Click → Consumption
