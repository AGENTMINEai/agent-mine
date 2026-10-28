# 宣传图生成

用代码排版生成 PNG，不依赖设计软件。改了文案重新跑一条命令即可。

```bash
cd agent-mine/brand
npm install
node make.mjs
```

产物：

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `card-announcement.png` | 1200×675 | 公告卡（X 单图） |
| `card-mechanism.png` | 1200×675 | 机制图：税 → 矿池 → 算力 → 钱包 |
| `card-quote.png` | 1080×1080 | 观点卡（No owner / No pause / No withdraw） |
| `x-banner.png` | 1500×500 | X 主页横幅 |

## 改动点

- 文案：`make.mjs` 里每张卡的字面量，直接改字符串
- 配色：`const C = { ... }`，金色 `C.gold`、蓝色 `C.blue`、背景 `C.bg`
- 尺寸：`render(name, width, height, element)` 的宽高
- 字体：`fonts/space-grotesk-400.woff2`、`space-grotesk-700.woff2`，等宽用 JetBrains Mono

## 两个 satori 的坑

1. **`height` 是内容高度，不含 padding。** 根容器必须写 `boxSizing: "border-box"`，否则底部内容会画到画布外。
2. **Space Grotesk 的括号 `()` 会被渲染成方框。** 需要括号的文字改用 JetBrains Mono（见 quote 卡的 `mine()` 写法），并且跨度拼接时前面用不换行空格 `\u00A0`，普通空格会被吞掉。

## 中文卡

当前只加载了拉丁字体，写中文会变豆腐块。要出中文版本，需要额外加载一个中文子集字体（例如用 Google Fonts 的 `text=` 参数只下载用到的字），再在 `fonts` 数组里注册。
