# 发射手册

## 独立矿池（已部署，BSC 主网）

| 项 | 值 |
| --- | --- |
| 矿池合约 | `0x7336a6a0E4C2161A740C024ff267667311278Fa3` |
| 部署交易 | `0x6ee2d9f95f881fc96ccc18012e5102c59faafd79472c21ad968673407cbf3655` |
| creator（唯一可绑定者） | `0x653D6bD3f4e3AAFB5643407A9B0A1DEB24e0F6b7` |
| 代币 | 未绑定（`taxToken = 0x0`） |
| maxRigs / minStake / dripWindow | 260 / 100,000e18 / 86,400s |
| 源码验证 | ✅ 已开源（solidity 0.8.24, optimizer 200, paris） |

绑定规则（链上强制）：

- 只有 creator 能调用 `setTaxToken(address)`
- 只能调用一次
- **不可解绑、不可改绑**（连设回 0x0 也会 revert）
- 绑定前可以正常收 BNB 税，但没人能质押（`Vault__TokenNotSet`）

绑定命令（creator 钱包签名，Agentic Wallet 即可，不需要私钥）：

```bash
baw contract-call preview --binanceChainId 56 --from 0x653D6bD3f4e3AAFB5643407A9B0A1DEB24e0F6b7 
  --to 0x7336a6a0E4C2161A740C024ff267667311278Fa3 --value 0 
  --inputData 0x487d1ce5<代币地址去0x补满64位> --json
# 确认后 execute --requestId <id>
```


## 已部署（BSC 主网 56）

| 项 | 值 |
| --- | --- |
| 工厂合约 | `0x4A4B3466CC995e3c2353e96a67D7b1aa43aDb854` |
| 部署交易 | 由 `0x06133dBCc1518D097dD5cE97da1a6b07beEf7f0d` 广播，nonce 0 |
| vaultPortal | `0x90497450f2a706f1951b5bdda52B4E5d16f34C06` |
| Agent ID 注册表 | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` |
| 源码验证 | 未验证（需要 BscScan API key 或手动上传） |

发射时填：
```
maxRigs            = 260
minStake           = 100000 * 10^18
dripWindowSeconds  = 86400
vaultFactory       = 0x4A4B3466CC995e3c2353e96a67D7b1aa43aDb854
vaultData          = 0x000000000000000000000000000000000000000000000000000000000000010400000000000000000000000000000000000000000000152d02c7e14af68000000000000000000000000000000000000000000000000000000000000000015180
```


目标：在 FLAP 发一个带税代币，税收自动进入 `FlapMiningVault`，只有 `.ai` 钱包能挖。

## 0. 先确认三件事

| 项 | 值 | 怎么确认 |
| --- | --- | --- |
| VaultPortal | `0x90497450f2a706f1951b5bdda52B4E5d16f34C06` | `eth_getCode` 非空（2882 bytes） |
| Agent ID 注册表 | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` | `name()` = `SPACE ID Agent ID`，符号 `AI` |
| FLAP 代币总量 | 1,000,000,000 | 最低质押按 10 万/台，260 台 = 2.6% 供应 |

## 1. 部署工厂

```bash
cd agent-mine/contracts
cp .env.example .env        # PRIVATE_KEY + BSC_RPC_URL
npx hardhat run scripts/deploy-factory.js --network bsc
```

输出里的 `Factory 0x…` 就是发射时要填的地址。

**部署后立刻在 BscScan 验证源码。** 新合约未验证会被币安风控判为高风险，代理的每笔挖矿都要手机确认，无人值守就断了。

```bash
npx hardhat verify --network bsc <factory> <vaultPortal> <agentIdRegistry>
```

## 2. FLAP 发射参数

| 参数 | 值 | 说明 |
| --- | --- | --- |
| `buyTaxRate` | `500` | 5% |
| `sellTaxRate` | `500` | 5% |
| `taxDuration` | `3153600000` | 100 年，等同永久 |
| `antiFarmerDuration` | `0` | 矿池自己管资格，不要让代币层再拦一道 |
| `dividendBps` | `7000` | 70% 税收 → 矿池 |
| `lpBps` | `1000` | 10% → 流动性 |
| `deflationBps` | `1000` | 10% → 销毁 |
| `mktBps` | `1000` | 10% → 你的钱包（团队收入） |
| `minimumShareBalance` | `0` | 由金库的 `minStake` 决定 |
| `dividendToken` | `address(0)` | 原生 BNB |
| `vaultFactory` | 第 1 步的工厂 | |
| `vaultData` | 见下 | |

`vaultData = abi.encode(uint256 maxRigs, uint256 minStake, uint256 dripWindow)`

首发推荐值：

```
maxRigs     = 260
minStake    = 100000 * 10^18
dripWindow  = 86400
```

用脚本生成，不要手抄：

```bash
node -e "const {AbiCoder}=require('ethers');console.log(AbiCoder.defaultAbiCoder().encode(['uint256','uint256','uint256'],[260,100000n*10n**18n,86400]))"
```

## 3. 如果 FLAP 页面不接受自定义工厂

FLAP 的发射页只列官方金库工厂时，直接调 `VaultPortal.newTokenV6WithVault(params)`。
参数结构以 `.tmp/flapjs` 里提取的 `NewTokenParams` 为准（27 个字段，见
`agent-mine/contracts/contracts/FlapMiningVaultFactory.sol` 的 `NewTokenParams`）。

上线前必须先在测试网或小额主网走一遍。

## 4. 发射后验证（缺一不可）

1. 买一笔小额 → 看金库地址的 `TaxReceived` 事件。
2. `aimine pool`：`累计税收` 应该增加。
3. `aimine doctor`：全绿。
4. `aimine rig` → `aimine stake 100000` → 等一轮 → `aimine mine`，确认 BNB 真的到钱包。
5. `aimine watch --interval 300` 跑 30 分钟，确认没有 `PENDING_CONFIRMATION`。

第 1 步是整套方案唯一的硬依赖：**FLAP 必须把 BNB 税打到金库的 `receive()`**。如果税收以 ERC-20
或其它形式结算，金库收不到，必须改适配器，不能靠前端补。

## 5. 上线顺序

```
部署工厂 → BscScan 验证 → 测试网/小额发射验证税收 → 正式发射
        → 前端指向正式金库 → 发布技能安装引导 → 开放矿机
```

不要在税收路由验证通过前做任何推广。
