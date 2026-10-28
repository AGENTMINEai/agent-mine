# 机制与参数

## 1. 一句话

FLAP 代币的交易税（BNB）进入一个**没有管理员、没有提款函数**的矿池合约；只有持有币安 `.ai` Agent ID 的钱包能认领
矿机、质押代币换算出算力，按算力把矿池里的 BNB 挖走。

## 2. 资金流

```
FLAP 买入/卖出税（BNB）
        │  发射时通过 vaultFactory 路由
        ▼
┌──────────────────────────────────────────┐
│ FlapMiningVault                           │
│                                          │
│  reserve（未释放储备）                     │
│     │ 每秒释放 reserve / dripWindow       │
│     ▼                                    │
│  accPerHash（每单位算力累计 BNB）           │
│     │                                    │
│     ▼                                    │
│  pending[rig]  ──mine()──►  钱包          │
└──────────────────────────────────────────┘

质押代币 ──stake()──► 合约托管，算力 = 质押量
                     └─unstake() 取回，低于 minStake 算力归零
```

- 税收只进不出：合约里唯一让 BNB 离开的路径是 `mine()`。
- 没有 `owner`、没有 `pause`、没有 `withdrawAll`。部署后任何人都改不了参数。
- 合约不可升级。参数错了只能换一个新代币重新发射。

## 3. 算力与释放

| 量 | 公式 |
| --- | --- |
| 单台矿机算力 | `hash = staked >= minStake ? staked : 0` |
| 全网算力 | `totalHash = Σ hash` |
| 每秒释放 | `reserve × dt / dripWindow`（`dt` 为距上次结算的秒数，最多一次放完） |
| 你的待挖 | `pending[rig] + (accPerHash − hashDebt[rig]) × hash / 1e18` |
| 日收益率（粗略） | `releasePerDay × 你的算力 / 全网算力 / 你的质押价值` |

特性：

- **无人挖时不释放。** `totalHash == 0` 时矿池原样保留，避免「空池期」被后来者一次性吃掉。
- **不会被抢跑。** 每次质押/取回都会先把已过去的释放记进 `pending`，再改算力，所以新质押拿不到历史释放。
- **储备会可见地变少。** `dripWindow = 86400` 表示当前储备一天放完；新税持续补充，长期稳定在「日税 × 1 天」附近。

## 4. 门禁

- 注册表：`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`（BSC 56，SPACE ID Agent ID，符号 `AI`）。
- 判定：`balanceOf(wallet) > 0`。注册表不是标准 ERC-721（没有 `supportsInterface` / Enumerable），所以不绑定具体 tokenId。
- `claimRig()` 与 `mine()` 都检查。卖掉 `.ai` 后停止收益，但已累计的不会消失。
- 灵魂绑定：矿机 NFT 不可转让。每个钱包最多 1 台。
- 已知取舍：`.ai` 可转让，A 认领后把 `.ai` 转给 B，B 也能认领。但每台矿机都要自己质押，不能白嫖。

## 5. 推荐参数（首发）

| 参数 | 值 | 说明 |
| --- | --- | --- |
| `maxRigs` | 260 | 矿机上限，决定早期稀缺度 |
| `minStake` | 100,000 代币（`1e5 × 1e18`） | 260 台满载 = 2600 万 = 总供应 10 亿的 2.6% |
| `dripWindow` | 86400 秒 | 当前储备一天放完 |
| 买卖税 | 5% / 5% | FLAP 发射参数 `buyTaxRate` / `sellTaxRate` = 500 / 500 |
| 税收分配 | `dividendBps` 7000 / `lpBps` 1000 / `deflationBps` 1000 / `mktBps` 1000 | 70% 进矿池；团队收入走 mktBps，不碰矿池 |
| `taxDuration` | 3153600000（100 年） | FLAP 默认，等同永久 |

发射时 `vaultData = abi.encode(uint256 maxRigs, uint256 minStake, uint256 dripWindow)`。

## 6. 安全属性

| 攻击 | 结果 |
| --- | --- |
| 团队 rug | 没有提款函数，团队也拿不走 |
| 抢跑大额税收 | 结算顺序保证新质押不继承历史释放 |
| 女巫多开 | 每个钱包 1 台且需质押，成本随质押线性上升 |
| 闪电贷刷算力 | 同一区块内 `stake` 后立即 `unstake`，`dt = 0`，没有可拿的释放 |
| 重入 | `mine` / `stake` / `unstake` 全部 `nonReentrant`，先改状态后转账 |
| 储备超发 | 释放上限为 `reserve` 本身，测试覆盖「远超窗口后余额归零」 |

未覆盖：

- 合约未审计。
- FLAP 代币在毕业前可能不可转账，导致 `stake` 在这个阶段回滚 —— 挖矿从可转账时开始。
- 交易量枯竭时收益趋近于 0，这是机制本身，不是故障。
- 新部署且未在 BscScan 验证的合约可能被币安风控标记为高风险，命中时每笔都要手机确认。

## 7. 代理侧

`aimine` 是矿工客户端：

- 读链：直连 BSC RPC（不走代理）。
- 签名：`baw contract-call preview/execute`（需要 `NODE_USE_ENV_PROXY=1` 和代理）。
- 实测：外部合约调用 `requireConfirmation: false`，可无人值守广播。
- `aimine watch` 输出 NDJSON，代理逐行读取并汇报。
