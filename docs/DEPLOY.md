# 部署到服务器

线上地址：**https://agentmine.online**（`www` 同样可用，HTTP 301 跳 HTTPS）

- 服务器：`165.154.235.102`（Ubuntu，用户 `ubuntu`）
- 站点目录：`/var/www/agentmine`
- vhost：`/etc/nginx/sites-available/agentmine` → `sites-enabled/agentmine`
- 证书：Let's Encrypt，覆盖 `agentmine.online` 与 `www.agentmine.online`，自动续期
- 与 `aflap.fun` / `vortexflap.fun` / `autoneco.fun` 完全独立，互不影响

## 一键更新（Windows Git Bash）

```bash
# 1. 静态导出
cd /d/币安AGENT/agent-mine/web
EXPORT=1 npm run build

# 2. 打包到 ASCII 路径（避免中文路径）
tar czf "C:/Users/Admin/.zcode/workspace/default/ssh-deploy/agentmine-site.tar.gz" -C out .

# 3. 上传（MSYS_NO_PATHCONV=1 必须带）
cd "C:/Users/Admin/.zcode/workspace/default/ssh-deploy"
MSYS_NO_PATHCONV=1 node run.mjs --upload \
  "C:/Users/Admin/.zcode/workspace/default/ssh-deploy/agentmine-site.tar.gz" \
  "/home/ubuntu/agentmine-site.tar.gz"

# 4. 解包 + reload
MSYS_NO_PATHCONV=1 node run.mjs --sudo /home/ubuntu/deploy-agentmine.sh
```

`deploy-agentmine.sh` 只在 vhost **不存在时**才写配置——因为 certbot 已经把 443 配置写进
`/etc/nginx/sites-available/agentmine`，每次覆盖会把 HTTPS 冲掉。

## 检查

```bash
curl -s --noproxy "*" -o /dev/null -w "%{http_code}\n" https://agentmine.online/
curl -s --noproxy "*" -o /dev/null -w "%{http_code}\n" https://agentmine.online/docs/
curl -s --noproxy "*" -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://agentmine.online/
```

## 证书

已签发，无需再操作。需要手动续期或重建时：

```bash
MSYS_NO_PATHCONV=1 node run.mjs --sudo /home/ubuntu/issue-cert.sh
```

`issue-cert.sh` 使用 `certbot --nginx --redirect`，签发后自动写入 vhost 并加 80→443 跳转。
