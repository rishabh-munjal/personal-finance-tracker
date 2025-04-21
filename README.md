# 🚀 From Localhost to Live: How I Deployed  MERN App on AWS with HTTPS and a Custom Domain

## 👋 Introduction

Hey there! I'm excited to walk you through how I took my full-stack personal finance tracker, **Spendsmart**, from a local development environment to a fully deployed, secure application running on an AWS EC2 instance. The best part? I did it **without spending a dime** on domains or SSL certificates, thanks to tools like **DuckDNS** and **Let's Encrypt**.

If you're building a MERN stack application and want to deploy it on AWS, this guide is for you. I faced real-world deployment issues and learned a ton. Let's dive in!

---

## 🧱 Project Stack

- **Frontend**: React
- **Backend**: Node.js + Express
- **Database**: MongoDB (local, but will be moving to AWS soon)
- **Hosting**: AWS EC2 (Ubuntu 20.04)
- **Web Server**: Nginx
- **Domain**: DuckDNS (free)
- **HTTPS**: Let's Encrypt via Certbot

---

## 📦 Step 1: Prepare Your Backend

1. Created an Express server to serve API requests.
2. Ensured that the server runs on port `5000`.
3. Added all required `.env` variables and set up CORS.
4. Confirmed local functionality with Postman.

Command to start the backend:

```bash
node index.js
# or
npm start
```

---

## 🖥️ Step 2: Launch AWS EC2 Instance

1. Selected Ubuntu 20.04 for my EC2 instance.
2. Configured Security Groups:
   - Port `22` for SSH
   - Port `80` for HTTP
   - Port `443` for HTTPS
   - Port `5000` for backend (optional, use Nginx proxy)
3. SSH'd into the instance:

```bash
ssh -i <your-key.pem> ubuntu@<your-ec2-public-ip>
```

---

## 🌐 Step 3: Setup NGINX as a Reverse Proxy

1. Installed NGINX:

```bash
sudo apt update
sudo apt install nginx
```

2. Created a config file for my app:

```bash
sudo nano /etc/nginx/sites-available/default
```

3. Configured NGINX to serve the React build and proxy `/api/` to backend:

```nginx
server {
    listen 80;
    server_name spendsmart.duckdns.org;

    root /home/ubuntu/personal-finance-tracker/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Restarted NGINX:

```bash
sudo systemctl restart nginx
```

---

## 🌍 Step 4: Free Custom Domain with DuckDNS

1. Registered at [DuckDNS](https://www.duckdns.org/).
2. Created a subdomain (e.g., `spendsmart.duckdns.org`).
3. Added my EC2 public IP to the domain.
4. Set up a cron job to auto-update IP:

```bash
crontab -e
```

```cron
*/5 * * * * curl "https://www.duckdns.org/update?domains=spendsmart&token=<your-token>&ip="
```

---

## 🔐 Step 5: HTTPS with Certbot and Let's Encrypt

1. Installed Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

2. Ran Certbot to generate SSL:

```bash
sudo certbot --nginx -d spendsmart.duckdns.org
```

3. Auto-renewal check:

```bash
sudo certbot renew --dry-run
```

Now my app supports HTTPS!

---

## 🧪 Step 6: Debugging Errors

- ❌ NGINX not starting: Used `sudo nginx -t` to validate config.
- ❌ Backend not reachable: Checked with `lsof -i -P -n | grep LISTEN`.
- ❌ 401 Unauthorized: Double-checked backend auth logic and tokens.
- ❌ HTTPS not working: Checked firewall rules, opened port 443.

These real-time issues helped me learn a lot about DevOps and server debugging!

---

## ✅ Final Result

You can now access my live application at:
👉 [https://spendsmart.duckdns.org](https://spendsmart.duckdns.org)

It’s hosted on AWS EC2, secured with HTTPS, and ready to serve users.

---

## 💡 What I Learned

- Basics of cloud hosting with AWS EC2
- NGINX reverse proxying and SSL setup
- Free domain setup with DuckDNS
- Production-grade app deployment
- Real-world debugging and server configuration

---

## 🛣️ What’s Next?

- Migrate MongoDB to a managed cloud solution (possibly DynamoDB or MongoDB Atlas)
- Add a CI/CD pipeline with GitHub Actions
- Set up monitoring with UptimeRobot or Prometheus + Grafana

---

## 🙌 Final Words

This journey from local development to a live, secure deployment on AWS was both challenging and rewarding. I now understand the backbone of hosting real-world apps and handling deployment pipelines.


Thanks for reading 😊

