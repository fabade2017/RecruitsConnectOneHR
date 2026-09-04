# OneHR — AWS Hosting Guide

You asked for AWS. Two supported paths; **Option A** is cheapest (single EC2), **Option B** is production (ECS + RDS).

## Stack today (local)
- `apps/web` Next.js 14.2.5 `:3000` + `AvaWidget` `Chioma` → `http://localhost:8003`
- `apps/api` NestJS `:3001` `prisma sqlserver` `onehr_v2` `SA SQLserver@ta2` `trustServerCertificate=true`
- `chatbot` Python FastAPI `uvicorn :8003` (`/api/user/chat`, `/api/user/transcribe`, `voice_audio`)
- MSSQL `mcr.microsoft.com/mssql/server:2022-latest` `accountingappdb:1433`

---

## Option A — Single EC2 + Docker Compose (recommended to start, ~$18/mo t3.small)

1. **EC2**: Ubuntu 22.04 `t3.small` (2 vCPU, 2GB), SG open `22, 80, 443, 3000, 3001, 8003` (then close 3000/3001/8003 behind Caddy).
   ```bash
   aws ec2 run-instances --image-id ami-0a7d80731ae1b2435 --instance-type t3.small --key-name onehr --security-group-ids sg-xxx --subnet-id subnet-xxx
   ```
2. **DNS**: Route53 `A` `onehr.yourdomain.com` → EC2 Elastic IP, `api.yourdomain.com`, `chatbot.yourdomain.com` same IP.
3. **On EC2**:
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose-plugin git -y
   git clone https://github.com/your/onehr.git && cd onehr
   cp .env.example .env   # fill:
   # DATABASE_URL="sqlserver://mssql:1433;database=onehr_v2;user=sa;password=STRONG_NEW_PASS;encrypt=true;trustServerCertificate=true"
   # SA_PASSWORD=STRONG_NEW_PASS  JWT_SECRET=64-char  JWT_REFRESH_SECRET=64-char  CORS_ORIGIN=https://onehr.yourdomain.com
   # NEXT_PUBLIC_API_URL=https://api.yourdomain.com/v1  NEXT_PUBLIC_CHATBOT_API=https://chatbot.yourdomain.com
   docker compose -f docker-compose.aws.yml up -d --build
   docker compose -f docker-compose.aws.yml exec api npx prisma migrate deploy --schema=./prisma/schema.prisma
   docker compose -f docker-compose.aws.yml exec api node apps/api/dist/prisma/seed.js  # or tsx seed
   curl http://localhost:3001/v1/health  # {"db":"up"}
   curl http://localhost:3000/ && curl http://localhost:8003/api/health
   ```
4. **TLS**: Uncomment `caddy` in `docker-compose.aws.yml`, add `Caddyfile`:
   ```
   onehr.yourdomain.com { reverse_proxy web:3000 }
   api.yourdomain.com { reverse_proxy api:3001 }
   chatbot.yourdomain.com { reverse_proxy chatbot:8003 }
   ```
   Then `docker compose -f docker-compose.aws.yml up -d caddy` — Caddy auto Let's Encrypt.

**Cost**: EC2 t3.small $15 + EIP $3 + storage $2.

---

## Option B — ECS Fargate + RDS SQL Server + ALB + Amplify (production, ~$75/mo)

1. **RDS SQL Server**: `aws rds create-db-instance --engine sqlserver-se --db-instance-class db.t3.small --allocated-storage 20 --master-username sa --master-user-password STRONG_PASS --db-name onehr_v2 --vpc-security-group-ids sg-xxx`
   - DATABASE_URL = `sqlserver://RDS_ENDPOINT:1433;database=onehr_v2;user=sa;password=STRONG_PASS;encrypt=true;trustServerCertificate=true` store in Secrets Manager `onehr/DATABASE_URL`.

2. **ECR**: `aws/push-ecr.sh` (see `aws/push-ecr.sh`):
   ```bash
   export AWS_PROFILE=onehr REGION=eu-west-1 ACCOUNT_ID=123456789012
   ./aws/push-ecr.sh
   # builds apps/api/Dockerfile + apps/web/Dockerfile + chatbot/Dockerfile → ECR
   ```

3. **ECS**: Register tasks `aws/ecs-task-api.json` + `aws/ecs-task-web.json` (replace `ACCOUNT_ID`/`REGION`):
   ```bash
   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-api.json
   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-web.json
   aws ecs create-cluster --cluster-name onehr
   aws ecs create-service --cluster onehr --service-name api --task-definition onehr-api --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=api,containerPort=3001"
   # similar for web:3000 and chatbot:8003
   ```

4. **ALB**: One ALB with 3 target groups + listeners:
   - `api.yourdomain.com` → TG `onehr-api:3001` health `/v1/health`
   - `onehr.yourdomain.com` → TG `onehr-web:3000` health `/`
   - `chatbot.yourdomain.com` → TG `onehr-chatbot:8003` health `/api/health`
   - ACM cert `*.yourdomain.com` + Route53 alias.

5. **Web alternative — Amplify**: Instead of ECS for web, `amplify` can host `apps/web` directly (cheaper, auto CI):
   - Connect GitHub repo, build `npm run build --workspace=apps/web`, env `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CHATBOT_API`.

6. **Secrets**: `aws secretsmanager create-secret --name onehr/DATABASE_URL --secret-string "sqlserver://..."`
   - Also `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `GROQ_API_KEY` etc. Referenced in `ecs-task-api.json` `secrets.valueFrom`.

**Cost**: RDS db.t3.small $60 + Fargate 0.5 vCPU $15 + ALB $16 + Amplify $5.

---

## Checklist (both options)
- [ ] Replace `SA_PASSWORD SQLserver@ta2` and `JWT_SECRET change-me` in `.env` / Secrets Manager.
- [ ] `prisma migrate deploy` against RDS/MSSQL (not `migrate dev`).
- [ ] Set `CORS_ORIGIN` to your web domain, `NEXT_PUBLIC_CHATBOT_API` to chatbot domain (AvaWidget uses `window.NEXT_PUBLIC_CHATBOT_API || http://localhost:8003`).
- [ ] Open SG only for `80/443` via ALB/Caddy; keep `1433` private (VPC only).
- [ ] Seed `admin@recruitconnect.ng/Admin@123` via `npx prisma db seed`.

Tell me your `REGION` (e.g., `eu-west-1`), `domain`, and `ACCOUNT_ID` and I will fill `aws/ecs-task-*.json` and `Caddyfile` for you and run `push-ecr.sh` once you provide `aws configure` creds.
