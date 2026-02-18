# founderOS Deployment Guide

## Railway Deployment (Recommended)

Railway natively supports monorepos with Docker and provides persistent volumes for SQLite.

### Prerequisites

1. Push your code to GitHub
2. Create a [Railway account](https://railway.app)
3. Have your OpenAI API key ready

### Step-by-Step

#### 1. Create Railway Project

```bash
# Install Railway CLI (optional, can also use web UI)
npm i -g @railway/cli
railway login
```

#### 2. Deploy Backend

1. In Railway dashboard, click **New Project** → **Deploy from GitHub repo**
2. Select your repository
3. Click **Add Service** → **GitHub Repo**
4. Set **Root Directory**: `backend`
5. Railway auto-detects the Dockerfile

**Environment Variables:**
```env
OPENAI_API_KEY=sk-proj-...
SECRET_KEY=<generate-random-string>
DATABASE_URL=sqlite+aiosqlite:///./data/founderos.db
FRONTEND_URL=https://your-frontend.up.railway.app
DEBUG=false
```

**Volume:**
- Click **Volumes** → **New Volume**
- Mount path: `/app/data`
- This persists your SQLite database

#### 3. Deploy Frontend

1. Click **Add Service** → **GitHub Repo** (same repo)
2. Set **Root Directory**: `frontend`
3. Railway auto-detects the Dockerfile

**Environment Variables:**
```env
SITE_PASSWORD=<your-secure-password>
```

**Build Arguments** (set in service settings → Variables):
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1
```

**Important:** Railway injects this at build time via Dockerfile ARG.

#### 4. Configure Custom Domains (Optional)

Railway provides `*.up.railway.app` domains by default. To use custom domains:

1. Go to each service → **Settings** → **Networking**
2. Add your domain (e.g., `api.yourdomain.com`, `app.yourdomain.com`)
3. Update DNS with provided CNAME records
4. Update `FRONTEND_URL` in backend and `NEXT_PUBLIC_API_URL` build arg in frontend

#### 5. Enable Auto-Deploy

Railway automatically redeploys on every push to your main branch.

### Cost Estimate

- **Hobby Plan**: $5/month + usage
  - 500 hours execution time
  - 100 GB outbound bandwidth
  - Suitable for small teams (1-10 users)

- **Pro Plan**: $20/month + usage
  - Unlimited execution time
  - 100 GB included bandwidth
  - Priority builds

---

## VPS Deployment (Cheapest)

### Prerequisites

- VPS with 1GB RAM (Hetzner CX11 $4/mo, DigitalOcean $6/mo)
- Docker + Docker Compose installed
- Domain name (optional, for HTTPS)

### Step-by-Step

#### 1. Prepare VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Clone repository
git clone https://github.com/yourusername/founderos.git
cd founderos
```

#### 2. Configure Environment

```bash
# Create .env file
cat > .env <<EOF
# Backend
OPENAI_API_KEY=sk-proj-...
SECRET_KEY=$(openssl rand -hex 32)
DATABASE_URL=sqlite+aiosqlite:///./data/founderos.db
FRONTEND_URL=http://your-domain.com
DEBUG=false

# Frontend
SITE_PASSWORD=your-secure-password
EOF
```

#### 3. Update docker-compose.yml

Edit `docker-compose.yml` to use your domain:

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - backend-data:/app/data
    env_file: .env

  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: http://your-domain.com:8000/api/v1
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - backend

volumes:
  backend-data:
```

#### 4. Deploy

```bash
# Build and start services
docker compose up -d --build

# Check logs
docker compose logs -f

# Stop services
docker compose down

# Update deployment
git pull
docker compose up -d --build
```

#### 5. Setup HTTPS with Caddy (Optional)

Create `Caddyfile`:

```
your-domain.com {
    reverse_proxy frontend:3000
}

api.your-domain.com {
    reverse_proxy backend:8000
}
```

Update `docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - frontend
      - backend

  # ... rest of services, remove port mappings for frontend/backend

volumes:
  backend-data:
  caddy-data:
  caddy-config:
```

Restart: `docker compose up -d --build`

Caddy automatically obtains and renews Let's Encrypt certificates.

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for intelligence pipelines |
| `SECRET_KEY` | No | Auto-generated | Encryption key for stored API keys |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./founderos.db` | SQLAlchemy database URL |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for CORS |
| `DEBUG` | No | `false` | Enable debug logging |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes (build arg) | - | Backend API URL (baked at build time) |
| `SITE_PASSWORD` | Yes | - | Shared password for app access |

---

## Security Notes

1. **SITE_PASSWORD**: Use a strong, random password. This protects your entire app.
2. **SECRET_KEY**: Auto-generated if not provided. Set explicitly in production for consistency across restarts.
3. **HTTPS**: Always use HTTPS in production (Railway provides it automatically, VPS needs Caddy/nginx).
4. **Database Backups**: On Railway, download volume snapshots regularly. On VPS, backup `/app/data/founderos.db`.
5. **API Keys**: Never commit `.env` files to git. Use Railway secrets or VPS env files.

---

## Updating After Deployment

### Railway
Push to GitHub → Railway auto-deploys

### VPS
```bash
cd founderos
git pull
docker compose up -d --build
```

---

## Troubleshooting

### Frontend can't reach backend

- Check `NEXT_PUBLIC_API_URL` build arg is correct
- Verify backend is accessible at that URL
- Check CORS settings in backend (`FRONTEND_URL` env var)

### Authentication loop (keeps redirecting to login)

- Verify `SITE_PASSWORD` is set in frontend environment
- Check browser cookies aren't blocked
- Try incognito/private mode

### Database errors

- Ensure volume is mounted at `/app/data` (Railway) or persists via Docker volume (VPS)
- Check `DATABASE_URL` uses correct path: `sqlite+aiosqlite:///./data/founderos.db`

### OpenAI API errors

- Verify `OPENAI_API_KEY` is correct
- Check your OpenAI account has credits
- Ensure model access (GPT-4o)

---

## Cost Breakdown

### Railway (Recommended)
- **Hobby**: $5/mo base + ~$5-10 usage = **~$10-15/mo**
- **Pro**: $20/mo base + usage = **~$25-35/mo**

### VPS + Docker Compose (Cheapest)
- **Hetzner CX22**: $4.90/mo (2 vCPU, 4GB RAM, 40GB SSD)
- **DigitalOcean**: $6/mo (1 vCPU, 1GB RAM, 25GB SSD)
- **Total**: **$5-6/mo**

Both exclude OpenAI API costs (varies by usage, typically $10-50/mo for moderate use).
