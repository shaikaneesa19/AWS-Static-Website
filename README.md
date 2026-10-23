# ☁ Full-Stack AWS Cloud Website

A professional, fully responsive full-stack cloud computing project with **Frontend** and **Backend**, designed for deployment on **Amazon Web Services (AWS)** using **Amazon S3**, **AWS CloudFront** with **Origin Access Control (OAC)**, and **Node.js / Express**.

---

## 🏗 Full-Stack Architecture

| Tier | Technologies | Responsibilities |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Responsive UI, cloud computing guides, interactive S3/CloudFront visuals, real-time analytics display, contact form submission |
| **Backend** | Node.js, Express.js, REST API | Visitor telemetry (`/api/visit`), live analytics (`/api/stats`), contact inquiries handler (`/api/contact`), message management API |
| **Admin Dashboard** | HTML5, CSS3, JavaScript | Real-time traffic metrics, 7-day visitor trend visualizer, message management (star, mark read, delete) |
| **Cloud Hosting** | Amazon S3 + AWS CloudFront (OAC) | Secure, private origin static asset storage and worldwide high-speed CDN delivery over HTTPS |

---

## 📁 Project Structure

```
AWS-Static-Website/
├── public/                 # Static assets served by backend or deployed to S3
│   ├── index.html          # Main website with S3 & CloudFront showcase
│   ├── style.css           # Glassmorphism dark cloud theme & animations
│   ├── script.js           # Client-side logic & API integration
│   └── admin.html          # Admin dashboard for traffic & inquiries
├── data/                   # Persistent JSON storage for backend (zero DB setup)
│   ├── messages.json       # Contact inquiries
│   └── stats.json          # Daily & unique visitor telemetry
├── server.js               # Node.js + Express backend REST API server
├── package.json            # Node.js dependencies and start scripts
├── index.html              # Root copy (for direct standalone/S3 sync)
├── style.css               # Root stylesheet copy
├── script.js               # Root script copy
└── README.md               # Full-stack documentation & AWS deployment guide
```

---

## ✨ Features

### 🌐 Frontend Features
1. **Professional Navigation Bar**: Sticky, responsive navbar with smooth scrolling links and mobile drawer.
2. **Hero Section**: Animated title *"Welcome to My AWS Cloud Website"*, canvas particle background, and real-time live visitor counters.
3. **Introduction to Cloud Computing**: 6 glassmorphism cards breaking down on-demand resources, scalability, and cost optimization.
4. **Amazon S3 Section**: Detailed feature breakdown with an interactive mock bucket file explorer.
5. **AWS CloudFront Section**: CDN explanation with an animated rotating globe and worldwide edge nodes.
6. **Architecture Flow Diagram**: Visual flow of `Visitor` → `CloudFront (HTTPS)` → `Amazon S3 (OAC Private)`.
7. **Contact Form**: Connected directly to the Express backend API with instant feedback and form validation.
8. **Admin Panel Link**: Direct access from nav and hero to the admin control panel.

### ⚙️ Backend Features (`server.js`)
- `POST /api/visit`: Tracks page views, unique visitor IPs, and 7-day daily traffic patterns.
- `GET /api/stats`: Serves live aggregated telemetry to the frontend hero badge.
- `POST /api/contact`: Validates input and persists messages into `data/messages.json`.
- `GET /api/admin/dashboard`: Provides complete analytics overview for the admin panel.
- `GET /api/admin/messages`: Fetches all inquiries with unread/starred filtering.
- `PATCH /api/admin/messages/:id/read`: Marks a message as read.
- `PATCH /api/admin/messages/:id/star`: Stars/unstars an inquiry.
- `DELETE /api/admin/messages/:id`: Permanently deletes an inquiry.

---

## 🖥 How to Run & Test Locally

### 1. Run with Full Backend & Frontend (Recommended)

Make sure you have [Node.js](https://nodejs.org/) installed:

```bash
# Navigate to project folder
cd AWS-Static-Website

# Install dependencies (Express, CORS, UUID)
npm install

# Start the full-stack server
npm start
```

Now open your browser:
- **Main Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **API Status**: [http://localhost:3000/api/stats](http://localhost:3000/api/stats)

> Every time you visit or refresh `http://localhost:3000`, the visitor counter increments in real-time, and submitting the contact form sends messages straight to your Admin Dashboard!

---

### 2. Standalone Frontend Mode (No Server Needed)

You can also run the frontend independently:
- Simply double-click `index.html` (or `public/index.html`) in File Explorer.
- The site works completely offline in preview mode with fallback animations and local feedback.

---

## 🚀 AWS Deployment Guide

You can deploy this full-stack application on AWS using modern cloud architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD                                 │
│                                                                        │
│   [Visitor] ──► [AWS CloudFront] (Global CDN + SSL)                   │
│                        │                                               │
│                        ├───► [Amazon S3] (Private Origin via OAC)      │
│                        │     (Serves HTML, CSS, JS, Images)            │
│                        │                                               │
│                        └───► [/api/* Routing] ──► [AWS Backend]        │
│                                                   (App Runner / EC2 /  │
│                                                    Lambda + API GW)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Part A: Deploy Frontend to Amazon S3 + CloudFront (with OAC)

#### Step 1: Create a Private S3 Bucket
```bash
aws s3 mb s3://YOUR-BUCKET-NAME --region ap-south-1
```

#### Step 2: Block All Public Access (Keep S3 Private)
```bash
aws s3api put-public-access-block \
  --bucket YOUR-BUCKET-NAME \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

#### Step 3: Upload Frontend Files
```bash
# Upload contents of public folder to S3
aws s3 sync ./public s3://YOUR-BUCKET-NAME/
```

#### Step 4: Create CloudFront Origin Access Control (OAC)
```bash
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    Name=MyWebsiteOAC,\
    Description="OAC for private S3 website bucket",\
    SigningProtocol=sigv4,\
    SigningBehavior=always,\
    OriginAccessControlOriginType=s3
```
*Note the returned `Id`.*

#### Step 5: Create CloudFront Distribution
Configure your CloudFront distribution to point to `YOUR-BUCKET-NAME.s3.ap-south-1.amazonaws.com` using the `OriginAccessControlId`. Set default root object to `index.html`.

#### Step 6: Attach S3 Bucket Policy for CloudFront
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

Apply the policy:
```bash
aws s3api put-bucket-policy --bucket YOUR-BUCKET-NAME --policy file://bucket-policy.json
```

---

### Part B: Deploy the Node.js Backend on AWS

Choose any of these popular AWS backend hosting options:

1. **AWS App Runner** (Easiest Containerized / Git PaaS):
   - Push this repo to GitHub.
   - Connect repository in AWS App Runner console.
   - Runtime: `Node.js 18+`, Build: `npm install`, Start: `node server.js`.
   - App Runner gives you an automatic HTTPS URL for your API.

2. **Amazon EC2 / AWS Lightsail** (Virtual Server):
   - Launch an Ubuntu instance.
   - Install Node.js: `sudo apt update && sudo apt install nodejs npm -y`.
   - Clone your project and install PM2: `npm install -g pm2 && pm2 start server.js`.

3. **CloudFront Multi-Origin Routing**:
   - In CloudFront, add your backend as a second Origin.
   - Add a behavior for path pattern `/api/*` pointing to your Backend Origin.
   - Now both frontend (`/`) and backend (`/api/*`) are served under a single domain without CORS!

---

## 🛠 Tech Stack Summary

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism, CSS Grid, Flexbox), Vanilla JavaScript (ES6+, Fetch API, Canvas)
- **Backend**: Node.js, Express.js (v5), CORS, UUID
- **Database/Storage**: File-based JSON persistence (`data/messages.json`, `data/stats.json`)
- **Cloud Infrastructure**: Amazon S3 (Object Storage), AWS CloudFront (CDN), AWS Origin Access Control (OAC)

---

## 📄 Licence

MIT License &bull; Free for educational and project presentation purposes.
