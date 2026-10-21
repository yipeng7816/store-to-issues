# Resend 自定义发信域名（ypmyjob.fun）

目标：用 `StoreToIssues <noreply@ypmyjob.fun>`（或 `mail.ypmyjob.fun`）给任意用户发验证/重置邮件。  
现在生产可用 `onboarding@resend.dev`，但只能发给 Resend 已验证的收件人。

## 步骤

1. 打开 [Resend Domains](https://resend.com/domains) → Add Domain → 填 `ypmyjob.fun`（或子域 `mail.ypmyjob.fun`）。  
2. 把 Resend 给出的 **DNS 记录**加到阿里云解析（通常含 SPF / DKIM / 可选 DMARC）。  
3. 在 Resend 点 Verify，等到 Status = Verified。  
4. Vercel 环境变量：

```text
EMAIL_FROM=StoreToIssues <noreply@ypmyjob.fun>
```

（地址必须用已验证域名下的邮箱。）

5. Redeploy：`bash scripts/ship.sh` 或 Vercel Redeploy。  
6. 用「忘记密码」给一个未在 Resend 白名单的邮箱测一封。

## 注意

- 不要把 `RESEND_API_KEY` 写进 Git。  
- 支持邮箱仍是 `SUPPORT_EMAIL=ymyjobp@163.com`（收件），与发件域可以不同。  
