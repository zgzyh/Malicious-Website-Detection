# Malicious-Website-Detection

恶意仿冒网址浏览器识别插件 —— 静态数据仓。存放品牌域名正牌库、高风险 TLD 规则、钓鱼域名黑名单。

## 数据文件

| 文件 | 内容 | 维护方式 |
|---|---|---|
| `data/version.json` | 清单：版本号 + 各文件 SHA-256 + 字节数 | 脚本自动生成 |
| `data/brands.json` | 正牌品牌域名库 | **人工 PR / 手动维护** |
| `data/tlds.json` | 高风险 TLD 后缀 & 规则配置 | 手动按需更新 |
| `data/blocklist.json` | 钓鱼域名黑名单（自动去重合并） | 脚本定时抓取 |

## 更新机制

- `.github/workflows/update.yml` 每 4 小时自动运行
- `scripts/fetch.mjs` 抓取 OpenPhish + URLhaus 社区免费源，合并去重写 `blocklist.json`
- `scripts/gen-version.mjs` 扫描所有数据文件算 SHA-256，写 `version.json`
- 任何变化自动 commit 并 push

## 扩展端拉取方式

扩展只先拉 `version.json`（~300 bytes），比对本地缓存的 `sha256`，仅 hash 变化的文件才下载。

jsDelivr CDN（免费用）:
```
https://cdn.jsdelivr.net/gh/zgzyh/Malicious-Website-Detection@latest/data/version.json
https://cdn.jsdelivr.net/gh/zgzyh/Malicious-Website-Detection@latest/data/blocklist.json
https://cdn.jsdelivr.net/gh/zgzyh/Malicious-Website-Detection@latest/data/brands.json
https://cdn.jsdelivr.net/gh/zgzyh/Malicious-Website-Detection@latest/data/tlds.json
```

## 数据源

- [OpenPhish Community Feed](https://openphish.com/feed.txt) — 免费，免注册
- [URLhaus](https://urlhaus.abuse.ch/downloads/text/) — abuse.ch，免费

## 本地运行

```bash
node scripts/fetch.mjs        # 抓取并合并黑名单
node scripts/gen-version.mjs  # 重建 version.json
```
