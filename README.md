# quantumshiftplanner
# Planday Clone - Final Stack: Clerk + Maileroo + Open Source

## ✅ Finale Entscheidung

Nach Evaluierung haben wir uns für eine **optimale Balance** entschieden:

### SaaS-Tools (für schnelle Entwicklung):
- 🔐 **Clerk** - Auth + Payment
- 📧 **Maileroo** - Email Delivery
- 🚂 **Railway** - Hosting

### Open Source (für Kosteneffizienz):
- 🗄️ **PostgreSQL 17** - Database
- ⚡ **Redis 7.4** - Cache & Jobs
- 📊 **Grafana + Prometheus** - Monitoring
- 📈 **Umami** - Analytics
- 🔍 **Meilisearch** - Search
- 💾 **Cloudflare R2** - File Storage
- 📱 **Firebase FCM** - Push Notifications (kostenlos!)

---

## 💰 Kosten

### 1.000 User: ~€100/Monat
```
Clerk:            $45/Monat
Maileroo:         $9/Monat
Railway:          $50/Monat
Cloudflare R2:    $1/Monat
Monitoring (OSS): $5/Monat
───────────────────────────
TOTAL:            $110/Monat
```

### vs. Full-SaaS: ~€1.200/Monat
**Ersparnis: €13.200/Jahr! 💰**

---

## 📚 Dokumente

### 1. [Planday Clone - Open Source Konzept](./planday-clone-open-source.md) ⭐
**HAUPT-DOKUMENT - Start hier!**
- Komplett mit Clerk + Maileroo
- Vollständiges Tech Stack
- Datenbank-Schema mit Clerk Integration
- Maileroo Email Service Setup
- Clerk Webhooks für User Sync
- Railway Deployment
- Kosten-Kalkulation

### 2. [Tech Stack Vergleich](./tech-stack-vergleich.md)
- Clerk vs. Auth.js
- Maileroo vs. SendGrid vs. Postal
- Warum hybride Lösung optimal ist
- ROI-Berechnung
- Entscheidungsmatrix

### 3. [Railway Deployment Guide](./railway-deployment-guide.md)
- Multi-Dockerfile Setup
- Environment Variables
- Service Configuration
- Deployment Checkliste

### 4. [Railway Quick Setup](./RAILWAY-SETUP.md)
- 15 Minuten Setup
- Copy & Paste Commands
- Troubleshooting

---

## 🎯 Warum Clerk?

✅ Schnellere Time-to-Market (2-3 Wochen gespart)
✅ Pre-built UI Components
✅ Payment integriert (Stripe managed)
✅ Multi-Tenancy built-in
✅ SSO/SAML Enterprise-ready
✅ User Management Dashboard
✅ Webhooks für Integration
✅ MFA/2FA included

**Setup: 30 Minuten statt 3 Tage**

---

## 📧 Warum Maileroo?

✅ Günstig ($9/Monat für 10k Emails)
✅ Hervorragende Deliverability
✅ EU-Server (GDPR-compliant)
✅ API + SMTP
✅ Webhooks (Bounce, Click tracking)
✅ Templates Support
✅ Schnelles Setup (30 Min)

**Alternative**: Amazon SES ($1 per 10k Emails)

---

## 🚀 Quick Start

### 1. Accounts erstellen
```bash
# Clerk
https://clerk.com → Sign Up

# Maileroo
https://maileroo.com → Sign Up

# Railway
https://railway.app → Sign Up (GitHub)

# Cloudflare R2
https://cloudflare.com → R2 aktivieren
```

### 2. Projekt Setup
```bash
# Clone Template
git clone <your-repo>
cd planday-clone

# Install Dependencies
npm install

# Setup Environment
cp .env.example .env.local
```

### 3. Clerk Setup
```bash
# In Clerk Dashboard:
1. Create Application
2. Enable Organizations
3. Configure Webhooks → /api/webhooks/clerk
4. Copy API Keys
```

### 4. Maileroo Setup
```bash
# In Maileroo Dashboard:
1. Verify Domain (DNS)
2. Create API Key
3. Test Email Send
```

### 5. Railway Deploy
```bash
# Via CLI
railway login
railway init

# Add Services
railway add --plugin postgresql
railway add --plugin redis

# Deploy
git push origin main
```

**Fertig! App läuft auf Railway 🎉**

---

## 📖 Vollständige Dokumentation

### Hauptdokument:
📄 [**Planday Clone - Open Source Konzept**](./planday-clone-open-source.md)
- Alles was du brauchst!
- Clerk Integration
- Maileroo Setup
- Datenbank-Schema
- API-Struktur
- Railway Deployment

### Support-Dokumente:
1. [Tech Stack Vergleich](./tech-stack-vergleich.md) - Warum diese Wahl?
2. [Railway Deployment Guide](./railway-deployment-guide.md) - Detailliertes Deployment
3. [Railway Quick Setup](./RAILWAY-SETUP.md) - 15 Min Setup
4. [Quick Start Guide](./quick-start-guide.md) - Lokale Entwicklung

---

## 🎯 Features - Komplett

### ✅ Alle Planday Features:
- Schichtplanung (Drag & Drop, Templates)
- Shift Swapping, Handover & Selling
- Zeiterfassung (GPS, Fotos)
- Mitarbeiterverwaltung
- Availability Management
- Urlaubs-/Krankheitsverwaltung
- In-App Messaging
- Email Notifications (Maileroo)
- Push Notifications (FCM)
- Reporting & Analytics
- Payroll Export
- Multi-Tenancy (Clerk Organizations)
- Subscription Billing (Clerk Payments)
- Mobile Apps (iOS & Android)

---

## 🏗️ Architektur

```
┌────────────────────────────────────────┐
│         Clerk (Auth + Payment)          │
│  - User Management                      │
│  - Organizations (Multi-Tenancy)        │
│  - Subscription Billing                 │
└───────────────┬────────────────────────┘
                │
┌───────────────▼────────────────────────┐
│         Railway.app Project             │
├────────────────────────────────────────┤
│                                         │
│  ┌────────┐  ┌────────┐  ┌──────────┐ │
│  │  Web   │  │  API   │  │  Worker  │ │
│  │Next.js │  │NestJS  │  │  BullMQ  │ │
│  └───┬────┘  └───┬────┘  └────┬─────┘ │
│      │           │             │       │
│      └───────────┴─────────────┘       │
│                  │                     │
│      ┌───────────┴──────────┐          │
│      │                      │          │
│  ┌───▼────┐          ┌─────▼─────┐    │
│  │Postgres│          │   Redis   │    │
│  │  17    │          │   7.4     │    │
│  └────────┘          └───────────┘    │
│                                         │
└─────────────────────────────────────────┘
         │                    │
┌────────▼────────┐  ┌────────▼─────────┐
│   Maileroo      │  │ Cloudflare R2    │
│   (Emails)      │  │ (File Storage)   │
└─────────────────┘  └──────────────────┘
```

---

## ✅ Next Steps

1. 📖 **[Lies das Hauptdokument](./planday-clone-open-source.md)**
2. 🔐 **Erstelle Clerk Account**
3. 📧 **Erstelle Maileroo Account**
4. 🚂 **Erstelle Railway Account**
5. 💻 **Start Development!**

---

**Let's build this! 🚀**

Stand: November 2025
Tech Stack: Next.js 15, React 19, NestJS 10, PostgreSQL 17
