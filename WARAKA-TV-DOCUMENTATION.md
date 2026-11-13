# WARAKA TV – Complete Project Documentation
## Build Guide, Deployment Manual & Developer Reference

---

## 📁 PROJECT STRUCTURE

```
waraka-tv/
│
├── index.html                  ← Homepage (Static, then convert to PHP)
├── news.php                    ← News listing page
├── news-detail.php             ← Single article page
├── programs.php                ← TV Programs page
├── live.php                    ← Live TV page
├── videos.php                  ← Video gallery
├── awards.php                  ← Awards & recognitions
├── about.php                   ← About WARAKA TV
├── advertise.php               ← Advertise with us
├── submit-news.php             ← Community news submission
├── contact.php                 ← Contact form
├── sitemap.php                 ← Dynamic XML sitemap
├── robots.txt                  ← Search engine directives
├── .htaccess                   ← Apache URL rewriting & security
│
├── includes/
│   ├── config.php              ← DB credentials, constants, helpers
│   ├── header.php              ← Site-wide header/nav (include)
│   └── footer.php              ← Site-wide footer (include)
│
├── admin/
│   ├── login.php               ← Admin authentication
│   ├── logout.php              ← Session destroy
│   ├── dashboard.php           ← Main admin dashboard
│   ├── news.php                ← News listing & management
│   ├── news-create.php         ← Create / Edit article
│   ├── videos.php              ← Video management
│   ├── programs.php            ← Programs management
│   ├── categories.php          ← Category management
│   ├── reports.php             ← Community report moderation
│   ├── messages.php            ← Contact message inbox
│   ├── newsletter.php          ← Subscriber management
│   ├── advertisements.php      ← Ad management
│   ├── awards.php              ← Awards management
│   ├── users.php               ← User / staff management
│   └── settings.php            ← Site settings
│
├── database/
│   └── waraka_tv.sql           ← Complete MySQL schema
│
├── uploads/                    ← User-uploaded content (writable)
│   ├── news/
│   ├── videos/
│   ├── programs/
│   └── avatars/
│
├── assets/
│   ├── css/
│   │   └── style.css           ← Global stylesheet
│   ├── js/
│   │   └── main.js             ← Global JavaScript
│   └── images/
│       ├── logo.png
│       └── og-image.jpg        ← Social sharing default image
│
└── logs/
    └── error.log               ← PHP error log (chmod 640)
```

---

## 🗄️ DATABASE SCHEMA OVERVIEW

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `users` | Admin & staff accounts | Auth for all admin actions |
| `categories` | News/video categories | Referenced by news, videos |
| `news` | Articles/posts | → users, categories |
| `videos` | Video content | → users, categories |
| `programs` | TV shows | Referenced by schedule |
| `program_schedule` | TV guide/schedule | → programs |
| `awards` | Station awards | Standalone |
| `advertisements` | Ad bookings | Standalone |
| `community_reports` | Citizen submissions | → categories, users (reviewer) |
| `contact_messages` | Enquiries inbox | Standalone |
| `newsletter_subscribers` | Email list | Standalone |
| `site_settings` | Key/value config | Standalone |

---

## 🔒 SECURITY CHECKLIST

### PHP Security
- [x] PDO prepared statements (all queries use `?` placeholders)
- [x] `password_hash()` with COST=12 for bcrypt
- [x] CSRF tokens on every form (generate + verify)
- [x] Honeypot fields on public forms (spam protection)
- [x] `session_regenerate_id(true)` on login
- [x] `htmlspecialchars()` on all output (the `e()` helper)
- [x] File upload validation: MIME type via finfo, extension whitelist, size limit
- [x] Role-based access control (`hasRole()` function)
- [x] `error_reporting(0)` in production (no error leakage)
- [x] IP address logging on contact submissions

### Apache (.htaccess)
```apache
# Block direct access to sensitive directories
Options -Indexes
DirectoryIndex index.php index.html

# URL Rewriting for clean URLs
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# News URLs: /news/article-slug
RewriteRule ^news/([a-z0-9-]+)/?$ news-detail.php?slug=$1 [L,QSA]

# Category URLs: /category/politics
RewriteRule ^category/([a-z0-9-]+)/?$ news.php?cat=$1 [L,QSA]

# Videos: /videos/video-slug
RewriteRule ^videos/([a-z0-9-]+)/?$ video-detail.php?slug=$1 [L,QSA]

# Programs: /programs/program-slug
RewriteRule ^programs/([a-z0-9-]+)/?$ program-detail.php?slug=$1 [L,QSA]

# Security Headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Protect includes directory
<IfModule mod_rewrite.c>
  RewriteRule ^includes/ - [F,L]
  RewriteRule ^admin/includes/ - [F,L]
  RewriteRule ^database/ - [F,L]
  RewriteRule ^logs/ - [F,L]
</IfModule>

# Disable PHP execution in uploads folder
<Directory "uploads">
  php_flag engine off
  Options -ExecCGI
  AddType text/plain .php .php3 .phtml
</Directory>

# Force HTTPS (uncomment in production)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Compress responses
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
```

---

## 🚀 DEPLOYMENT GUIDE (Shared Hosting / cPanel)

### Step 1: Prepare Your Files
1. Ensure all local development is complete and tested
2. Update `includes/config.php` with production database credentials
3. Set `ENVIRONMENT` to `'production'` in config.php
4. Uncomment the HTTPS redirect in `.htaccess`

### Step 2: Create Database in cPanel
1. Log in to cPanel → **MySQL Databases**
2. Create a new database: `waraka_tv`
3. Create a new MySQL user with a strong password
4. Add the user to the database with **ALL PRIVILEGES**
5. Note the database host (usually `localhost`)

### Step 3: Import Database Schema
1. Go to cPanel → **phpMyAdmin**
2. Select your `waraka_tv` database
3. Click **Import** → Upload `database/waraka_tv.sql`
4. Click **Go** — all tables will be created with seed data

### Step 4: Upload Files via cPanel File Manager
1. cPanel → **File Manager** → Navigate to `public_html/`
2. Upload your project ZIP using **Upload** button
3. Select the ZIP → click **Extract** to the same location
4. Or use **FTP client** (FileZilla recommended):
   - Host: your domain or IP
   - Username/Password: FTP credentials from cPanel
   - Remote path: `/public_html/`

### Step 5: Set File Permissions
In File Manager or via SSH:
```bash
# Directories should be 755
find /home/username/public_html -type d -exec chmod 755 {} \;

# Files should be 644
find /home/username/public_html -type f -exec chmod 644 {} \;

# uploads/ directory must be writable
chmod 755 /home/username/public_html/uploads/
chmod 755 /home/username/public_html/logs/
```

### Step 6: Configure Domain & SSL
1. cPanel → **Domains** → Point your domain to `public_html/`
2. cPanel → **SSL/TLS** → Use **Let's Encrypt** (free) or upload your certificate
3. Enable **Force HTTPS** from cPanel SSL section
4. Test with: https://www.ssllabs.com/ssltest/

### Step 7: Update config.php on Server
Edit the file directly in File Manager:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_cpanel_username_waraka_tv');  // cPanel prefixes DB names
define('DB_USER', 'your_cpanel_username_waraka');
define('DB_PASS', 'your_strong_password_here');
define('SITE_URL', 'https://warakatv.ng');
define('ENVIRONMENT', 'production');
```

### Step 8: First Login & Setup
1. Visit `https://warakatv.ng/admin/login.php`
2. Login with:
   - Username: `superadmin`
   - Password: `Admin@123`
3. **IMMEDIATELY** go to Users → Edit your account and change the password
4. Configure site settings in Admin → Settings
5. Add your live stream URL (YouTube/Facebook)

### Step 9: Submit to Search Engines
1. Create Google Search Console account
2. Verify ownership (HTML file method)
3. Submit sitemap: `https://warakatv.ng/sitemap.php`
4. Do same for Bing Webmaster Tools

---

## 📺 LIVE TV STREAMING SETUP

### Option 1: YouTube Live (Recommended)
1. Go to YouTube Studio → **Go Live**
2. Set up your stream key in OBS or any encoder
3. Copy your YouTube Channel ID
4. Update in Admin → Settings → `live_stream_url`:
   ```
   https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID
   ```
5. For a specific live video: `https://www.youtube.com/embed/VIDEO_ID?autoplay=1`

### Option 2: Facebook Live
```html
<!-- Get embed code from Facebook → Share → Embed -->
<iframe src="https://www.facebook.com/plugins/video.php?href=YOUR_FB_LIVE_URL"
        width="100%" height="100%" scrolling="no" frameborder="0" allowfullscreen></iframe>
```

### Option 3: Self-hosted HLS Stream (Advanced)
```html
<!-- Use HLS.js for browser compatibility -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<video id="liveVideo" controls style="width:100%;"></video>
<script>
  const video = document.getElementById('liveVideo');
  const streamUrl = 'https://stream.warakatv.ng/live/stream.m3u8';
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = streamUrl; // Native HLS on Safari/iOS
  }
</script>
```

---

## 🔍 SEO BEST PRACTICES

### robots.txt
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /includes/
Disallow: /uploads/

Sitemap: https://warakatv.ng/sitemap.php
```

### Meta Tags Template (news-detail.php)
```php
<!-- Paste in <head> of every public page -->
<meta name="description" content="<?= e($article['meta_desc'] ?: $article['excerpt']) ?>" />
<meta property="og:title"       content="<?= e($article['meta_title'] ?: $article['title']) ?>" />
<meta property="og:description" content="<?= e($article['excerpt']) ?>" />
<meta property="og:image"       content="<?= SITE_URL . '/' . e($article['featured_image']) ?>" />
<meta property="og:url"         content="<?= SITE_URL ?>/news/<?= e($article['slug']) ?>" />
<meta property="og:type"        content="article" />
<meta name="twitter:card"       content="summary_large_image" />
<link rel="canonical"           href="<?= SITE_URL ?>/news/<?= e($article['slug']) ?>" />
```

### Image Optimisation Tips
- **Format**: Use WebP where possible (30-40% smaller than JPEG)
- **Resize**: Max 1200px wide for featured images
- **Compress**: Use tinypng.com or install `cwebp` on server
- **Alt text**: Always add descriptive alt text for accessibility + SEO
- **Lazy loading**: Add `loading="lazy"` to all below-fold images

---

## 💰 MONETISATION OPTIONS

### 1. Google AdSense
- Apply at https://adsense.google.com
- Place ad units in: above content, sidebar, between articles, footer
- Use Auto Ads for optimal placement

### 2. Direct Advertising
- Use your `advertisements` table to manage direct clients
- Charge per: CPM (per 1000 views), CPC (per click), flat monthly rate
- Positions: Homepage hero, sidebar, in-article, video pre-roll

### 3. Sponsored Content
- Create a "Sponsored" label badge in news cards
- Charge per article, per week, or per month

### 4. Newsletter Sponsorships
- Sell ad slots in your email newsletter
- ₦50,000–₦200,000 per edition depending on list size

### 5. Premium Subscriptions
- Gate exclusive content / documentaries behind a paywall
- Integrate Paystack (Nigeria): https://paystack.com/docs/api

---

## 📊 ANALYTICS INTEGRATION

### Google Analytics 4
Paste just before `</head>` on every page:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX'); // Replace with your Measurement ID
</script>
```

---

## 🔔 PUSH NOTIFICATIONS (Firebase)

1. Create Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Add Firebase SDK to your site
4. Request notification permission on first visit:
```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = { /* your config */ };
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' }).then(token => {
      // Send token to your server to save in DB
      fetch('/api/save-token.php', { method:'POST', body: JSON.stringify({token}) });
    });
  }
});
```

---

## ✅ OPTIONAL ADVANCED FEATURES

| Feature | Implementation |
|---------|---------------|
| **AMP pages** | Add AMP versions of news articles for faster mobile loading |
| **PWA** | Add service worker + manifest.json to make site installable |
| **Comment system** | Integrate Disqus or build custom with moderation |
| **Search** | Add full-text search with MySQL MATCH...AGAINST or Algolia |
| **Dark/Light mode** | CSS variables make this straightforward to add |
| **WhatsApp sharing** | Add `https://wa.me/?text=` share buttons on articles |
| **Video transcripts** | Add transcripts for accessibility & SEO |
| **Paywall** | Integrate Paystack for premium content gating |
| **Author profiles** | Create public profile pages for journalists |
| **RSS Feed** | Generate RSS XML for news aggregators |

---

## 🔧 MAINTENANCE TIPS

1. **Daily**: Check admin dashboard for pending reports & messages
2. **Weekly**: Review site performance in Google Analytics
3. **Monthly**: 
   - Update PHP dependencies
   - Check SSL certificate expiry
   - Review and clean up old draft articles
   - Backup database: `mysqldump -u user -p waraka_tv > backup_$(date +%Y%m%d).sql`
4. **Immediately when needed**: 
   - Rotate admin passwords every 90 days
   - Apply security patches to PHP version

---

*WARAKA TV CMS – Built with PHP 8+ / MySQL / Bootstrap 5*
*Documentation version 1.0 | © 2025 WARAKA TV*
