# Agent Mine

只有持有币安 `.ai` Agent ID 的钱包才能挖的矿场。代币在 FLAP 发射，交易税以 BNB 进入矿池，
矿工认领矿机、质押项目代币换算力，把矿池挖走。合约里没有 owner、没有 pause、没有提款函数。

## 目录

| 目录 | 内容 |
| --- | --- |
| `contracts/` | `FlapMiningVault`（矿池）+ `FlapMiningVaultFactory`（FLAP 金库工厂）+ 15 项测试 |
| `cli/` | `aimine` 零依赖命令行：读链 + 通过 `baw` 签名 |
| `skill/` | 可安装的 agent-mine 技能（`SKILL.md` + 机制参考） |
| `web/` | Next.js 站点（矿场控制台 + 实时数据可视化 + 线条光点动画 + 技能安装引导 + 机制文档） |
| `docs/LAUNCH.md` | FLAP 发射参数与验证清单 |

## 快速开始

```bash
# 合约
cd contracts && npm install && npx hardhat test        # 15 passing

# 本地站点（生产模式，推荐）
cd ../web && npm install && npm run build
start.bat                                              # http://127.0.0.1:3100

# 开发模式
cd ../web && npm run dev                               # http://localhost:3000

# 技能
node ../cli/install.mjs
```

## 链上事实（已验证）

- Agent ID 注册表：`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`（SPACE ID Agent ID / `AI`），`balanceOf > 0` 即持证。
- FLAP VaultPortal：`0x90497450f2a706f1951b5bdda52B4E5d16f34C06`（BSC 56，有代码）。
- `baw contract-call` 的外部合约调用实测 `requireConfirmation: false` —— 代理可无人值守广播。
- FLAP 代币总量 10 亿；首发 260 台 × 最低质押 10 万 = 2.6% 供应。

## 机制一句话

```
税收 BNB → reserve → 每秒释放 1/86400 → 按算力占比 → pending[rig] → mine() → 钱包
```

算力就是质押量。没有隐藏倍率，也没有加速道具。

## 上线前必须做的两件事

1. **BscScan 验证工厂与金库源码。** 未验证的新合约会被币安风控判为高风险，代理的每笔交易都要手机确认。
2. **验证税收真的进了金库。** 发一笔小额买卖，看金库的 `TaxReceived` 事件。这是整套方案唯一的硬依赖。

完整步骤见 [docs/LAUNCH.md](docs/LAUNCH.md)。

## 已知限制

- 合约未审计。
- 收益来自真实交易税，不是固定 APY。
- FLAP 代币毕业前若不可转账，`stake` 要等可转账后开始。
- 金库不可升级，参数必须一次定对。
