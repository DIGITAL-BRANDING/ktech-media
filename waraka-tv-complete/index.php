<?php
require_once __DIR__ . '/includes/config.php';

// Query published news for homepage
try {
    $stmt = $db->prepare("
        SELECT n.*, u.full_name AS author, c.name AS category, c.color AS category_color
        FROM news n
        JOIN users u ON n.author_id = u.id
        JOIN categories c ON n.category_id = c.id
        WHERE n.status = 'published'
        ORDER BY n.published_at DESC
        LIMIT 8
    ");
    $stmt->execute();
    $news = $stmt->fetchAll();

    // Get featured/breaking news for hero
    $featured = $news[0] ?? null;
    $sideNews = array_slice($news, 1, 3);
    $gridNews = array_slice($news, 4, 4);

} catch (Exception $e) {
    $news = [];
    $featured = null;
    $sideNews = [];
    $gridNews = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WARAKA TV – Nigeria's Premier Television & Online Media Platform</title>

  <!-- SEO Meta Tags -->
  <meta name="description" content="WARAKA TV – Watch live TV, breaking news, trending videos, and exclusive programs from Nigeria's most trusted media platform." />
  <meta name="keywords" content="WARAKA TV, Nigerian TV, live streaming, Nigerian news, Nollywood, Africa television" />
  <meta name="author" content="WARAKA TV" />
  <meta name="robots" content="index, follow" />

  <!-- Open Graph / Social Sharing -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://warakatv.ng/" />
  <meta property="og:title" content="WARAKA TV – Nigeria's Premier Television & Online Media" />
  <meta property="og:description" content="Watch live TV, breaking news, trending videos, and exclusive programs." />
  <meta property="og:image" content="assets/images/og-image.jpg" />
  <meta name="twitter:card" content="summary_large_image" />

  <!-- Canonical -->
  <link rel="canonical" href="https://warakatv.ng/" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap" rel="stylesheet" />

  <!-- Bootstrap 5 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />

  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

  <style>
    /* =============================================
       CSS VARIABLES & RESET
    ============================================= */
    :root {
      --red:       #E8001D;
      --red-dark:  #B5001A;
      --gold:      #C9961A;
      --black:     #0A0A0A;
      --dark:      #111111;
      --card-bg:   #181818;
      --border:    #2A2A2A;
      --text:      #E8E8E8;
      --muted:     #888888;
      --white:     #FFFFFF;
      --radius:    6px;
      --transition: 0.3s ease;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--black);
      color: var(--text);
      overflow-x: hidden;
    }

    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; display: block; }

    /* =============================================
       SCROLLBAR
    ============================================= */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--dark); }
    ::-webkit-scrollbar-thumb { background: var(--red); border-radius: 2px; }

    /* =============================================
       TYPOGRAPHY UTILITIES
    ============================================= */
    .font-display { font-family: 'Playfair Display', serif; }
    .font-bebas   { font-family: 'Bebas Neue', cursive; }
    .text-red     { color: var(--red); }
    .text-gold    { color: var(--gold); }
    .text-muted-custom { color: var(--muted); }

    /* =============================================
       TOP BAR
    ============================================= */
    .top-bar {
      background: var(--red);
      padding: 6px 0;
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.05em;
    }

    .ticker-wrapper {
      overflow: hidden;
      white-space: nowrap;
    }

    .ticker-content {
      display: inline-block;
      animation: ticker 40s linear infinite;
    }

    .ticker-content:hover { animation-play-state: paused; }

    @keyframes ticker {
      from { transform: translateX(100%); }
      to   { transform: translateX(-100%); }
    }

    .ticker-item { margin-right: 60px; }
    .ticker-item::before { content: "●"; margin-right: 8px; opacity: 0.7; }

    /* =============================================
       NAVIGATION
    ============================================= */
    .navbar-waraka {
      background: var(--dark);
      border-bottom: 1px solid var(--border);
      padding: 0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 20px rgba(0,0,0,0.5);
    }

    .navbar-brand-custom {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
    }

    .logo-badge {
      background: var(--red);
      color: var(--white);
      font-family: 'Bebas Neue', cursive;
      font-size: 1.6rem;
      padding: 4px 14px;
      letter-spacing: 2px;
      clip-path: polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%);
    }

    .logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 0.7rem;
      color: var(--muted);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .nav-link-custom {
      color: var(--text) !important;
      font-size: 0.82rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 22px 14px !important;
      position: relative;
      transition: color var(--transition);
    }

    .nav-link-custom::after {
      content: '';
      position: absolute;
      bottom: 0; left: 14px; right: 14px;
      height: 2px;
      background: var(--red);
      transform: scaleX(0);
      transition: transform var(--transition);
    }

    .nav-link-custom:hover { color: var(--red) !important; }
    .nav-link-custom:hover::after,
    .nav-link-custom.active::after { transform: scaleX(1); }
    .nav-link-custom.active { color: var(--red) !important; }

    .nav-live-btn {
      background: var(--red);
      color: var(--white) !important;
      padding: 8px 18px !important;
      border-radius: 4px;
      font-weight: 600;
      animation: pulse-red 2s infinite;
      margin: auto 0;
    }

    .nav-live-btn::after { display: none; }

    @keyframes pulse-red {
      0%, 100% { box-shadow: 0 0 0 0 rgba(232,0,29,0.5); }
      50%       { box-shadow: 0 0 0 8px rgba(232,0,29,0); }
    }

    .nav-live-btn .live-dot {
      display: inline-block;
      width: 7px; height: 7px;
      background: #fff;
      border-radius: 50%;
      margin-right: 6px;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.2; }
    }

    /* Dropdown */
    .dropdown-menu-dark-custom {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      min-width: 200px;
      padding: 8px 0;
      margin-top: 0 !important;
    }

    .dropdown-item-custom {
      color: var(--text);
      padding: 8px 18px;
      font-size: 0.82rem;
      transition: background var(--transition), color var(--transition);
    }

    .dropdown-item-custom:hover {
      background: var(--border);
      color: var(--red);
    }

    /* =============================================
       HERO SECTION
    ============================================= */
    .hero {
      position: relative;
      min-height: 85vh;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      background: url('https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=1600&q=80') center/cover no-repeat;
      filter: brightness(0.35);
      transition: transform 8s ease;
    }

    .hero:hover .hero-bg { transform: scale(1.03); }

    .hero-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(0,0,0,0.98) 0%,
        rgba(0,0,0,0.6) 50%,
        rgba(0,0,0,0.1) 100%
      );
    }

    .hero-content { position: relative; z-index: 2; padding: 60px 0; }

    .hero-category {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--red);
      color: var(--white);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 5px 14px;
      margin-bottom: 16px;
    }

    .hero-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 5vw, 3.8rem);
      font-weight: 900;
      line-height: 1.1;
      color: var(--white);
      margin-bottom: 16px;
      max-width: 700px;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 28px;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.6);
    }

    .hero-meta span { display: flex; align-items: center; gap: 5px; }

    .hero-desc {
      color: rgba(255,255,255,0.75);
      max-width: 560px;
      line-height: 1.7;
      margin-bottom: 32px;
      font-size: 0.95rem;
    }

    .btn-waraka-primary {
      background: var(--red);
      color: var(--white);
      border: none;
      padding: 13px 28px;
      font-weight: 600;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-radius: var(--radius);
      transition: background var(--transition), transform var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-waraka-primary:hover {
      background: var(--red-dark);
      color: var(--white);
      transform: translateY(-2px);
    }

    .btn-waraka-outline {
      background: transparent;
      color: var(--white);
      border: 1px solid rgba(255,255,255,0.4);
      padding: 13px 28px;
      font-weight: 600;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-radius: var(--radius);
      transition: all var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-waraka-outline:hover {
      background: rgba(255,255,255,0.1);
      color: var(--white);
      border-color: var(--white);
    }

    /* Hero Side Cards */
    .hero-side {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 40px 0;
    }

    .hero-side-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: var(--radius);
      padding: 14px;
      display: flex;
      gap: 12px;
      align-items: center;
      transition: all var(--transition);
      cursor: pointer;
    }

    .hero-side-card:hover {
      background: rgba(232,0,29,0.15);
      border-color: rgba(232,0,29,0.4);
      transform: translateX(-4px);
    }

    .hero-side-card img {
      width: 80px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .hero-side-card-title {
      font-size: 0.82rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--white);
    }

    .hero-side-card-meta {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.5);
      margin-top: 4px;
    }

    /* =============================================
       SECTION UTILITIES
    ============================================= */
    .section { padding: 70px 0; }
    .section-sm { padding: 40px 0; }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.7rem;
      font-weight: 700;
      color: var(--white);
      position: relative;
      padding-left: 18px;
    }

    .section-title::before {
      content: '';
      position: absolute;
      left: 0; top: 4px; bottom: 4px;
      width: 4px;
      background: var(--red);
      border-radius: 2px;
    }

    .section-link {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--red);
      display: flex;
      align-items: center;
      gap: 4px;
      transition: gap var(--transition);
    }

    .section-link:hover { color: var(--red); gap: 8px; }

    /* =============================================
       CATEGORY PILLS
    ============================================= */
    .category-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }

    .category-pill {
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
      border: 1px solid var(--border);
      color: var(--muted);
      background: transparent;
      transition: all var(--transition);
    }

    .category-pill:hover,
    .category-pill.active {
      background: var(--red);
      border-color: var(--red);
      color: var(--white);
    }

    /* =============================================
       NEWS CARDS
    ============================================= */
    .news-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      transition: transform var(--transition), border-color var(--transition);
      height: 100%;
    }

    .news-card:hover {
      transform: translateY(-5px);
      border-color: var(--red);
    }

    .news-card-img {
      position: relative;
      overflow: hidden;
      aspect-ratio: 16/9;
    }

    .news-card-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .news-card:hover .news-card-img img { transform: scale(1.06); }

    .news-card-badge {
      position: absolute;
      top: 12px; left: 12px;
      background: var(--red);
      color: var(--white);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 2px;
    }

    .news-card-body { padding: 18px; }

    .news-card-title {
      font-family: 'Playfair Display', serif;
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.4;
      color: var(--white);
      margin-bottom: 10px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-card-title:hover { color: var(--red); }

    .news-card-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 0.72rem;
      color: var(--muted);
    }

    .news-card-meta span { display: flex; align-items: center; gap: 4px; }

    /* Featured/Large card */
    .news-card-featured {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      height: 100%;
      min-height: 380px;
      cursor: pointer;
    }

    .news-card-featured img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .news-card-featured:hover img { transform: scale(1.04); }

    .news-card-featured-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 60%, transparent 100%);
    }

    .news-card-featured-body {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 24px;
    }

    /* List news items */
    .news-list-item {
      display: flex;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
      transition: opacity var(--transition);
    }

    .news-list-item:last-child { border-bottom: none; }
    .news-list-item:hover { opacity: 0.8; }

    .news-list-item img {
      width: 80px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .news-list-title {
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.4;
      color: var(--text);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-list-title:hover { color: var(--red); }

    .news-list-meta { font-size: 0.7rem; color: var(--muted); margin-top: 4px; }

    /* =============================================
       VIDEO CARDS
    ============================================= */
    .video-card {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      cursor: pointer;
      background: var(--card-bg);
      border: 1px solid var(--border);
      transition: transform var(--transition), border-color var(--transition);
    }

    .video-card:hover {
      transform: translateY(-4px);
      border-color: var(--gold);
    }

    .video-thumb {
      position: relative;
      aspect-ratio: 16/9;
      overflow: hidden;
    }

    .video-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .video-card:hover .video-thumb img { transform: scale(1.06); }

    .video-play-btn {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.3);
      transition: background var(--transition);
    }

    .video-card:hover .video-play-btn { background: rgba(232,0,29,0.5); }

    .video-play-icon {
      width: 52px; height: 52px;
      background: rgba(232,0,29,0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: white;
      transition: transform var(--transition);
      box-shadow: 0 4px 20px rgba(232,0,29,0.5);
    }

    .video-card:hover .video-play-icon { transform: scale(1.1); }

    .video-duration {
      position: absolute;
      bottom: 8px; right: 8px;
      background: rgba(0,0,0,0.8);
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 7px;
      border-radius: 3px;
    }

    .video-body { padding: 14px; }

    .video-title {
      font-size: 0.88rem;
      font-weight: 600;
      line-height: 1.4;
      color: var(--text);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .video-meta { font-size: 0.72rem; color: var(--muted); display: flex; gap: 10px; }

    /* =============================================
       PROGRAMS / SHOWS SECTION
    ============================================= */
    .program-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      position: relative;
      transition: all var(--transition);
      cursor: pointer;
    }

    .program-card:hover {
      border-color: var(--gold);
      transform: translateY(-4px);
    }

    .program-img {
      aspect-ratio: 3/4;
      position: relative;
      overflow: hidden;
    }

    .program-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .program-card:hover .program-img img { transform: scale(1.06); }

    .program-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 18px;
    }

    .program-time {
      background: var(--gold);
      color: var(--black);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 2px;
      display: inline-block;
      margin-bottom: 8px;
    }

    .program-title {
      font-family: 'Playfair Display', serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--white);
      line-height: 1.3;
    }

    /* =============================================
       LIVE TV SECTION
    ============================================= */
    .live-section {
      background: var(--dark);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .live-player-wrapper {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      border: 2px solid var(--red);
      aspect-ratio: 16/9;
      background: #000;
    }

    .live-player-wrapper iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .live-badge {
      position: absolute;
      top: 14px; left: 14px;
      background: var(--red);
      color: white;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      padding: 5px 12px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      transition: all var(--transition);
      margin-bottom: 8px;
    }

    .schedule-item:hover { border-color: var(--red); background: rgba(232,0,29,0.05); }

    .schedule-item.now-playing { border-color: var(--red); background: rgba(232,0,29,0.1); }

    .schedule-time {
      min-width: 80px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--red);
      font-family: 'Bebas Neue', cursive;
      letter-spacing: 0.05em;
    }

    .schedule-title { font-size: 0.85rem; font-weight: 500; color: var(--text); }
    .schedule-cat { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }

    /* =============================================
       STATS BANNER
    ============================================= */
    .stats-banner {
      background: linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%);
      padding: 50px 0;
    }

    .stat-item { text-align: center; }

    .stat-number {
      font-family: 'Bebas Neue', cursive;
      font-size: 3.5rem;
      color: var(--white);
      letter-spacing: 0.05em;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.75);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* =============================================
       CTA SECTION
    ============================================= */
    .cta-section {
      background: var(--dark);
      border-top: 1px solid var(--border);
    }

    .cta-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px;
      text-align: center;
      transition: all var(--transition);
    }

    .cta-card:hover {
      border-color: var(--red);
      transform: translateY(-4px);
    }

    .cta-icon {
      width: 60px; height: 60px;
      background: rgba(232,0,29,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: var(--red);
      margin: 0 auto 16px;
    }

    .cta-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--white); margin-bottom: 10px; }
    .cta-desc { font-size: 0.85rem; color: var(--muted); margin-bottom: 20px; line-height: 1.6; }

    /* =============================================
       NEWSLETTER
    ============================================= */
    .newsletter-section {
      background: var(--black);
      padding: 60px 0;
      border-top: 1px solid var(--border);
    }

    .newsletter-input-group {
      display: flex;
      max-width: 500px;
      margin: 24px auto 0;
      gap: 0;
    }

    .newsletter-input {
      flex: 1;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-right: none;
      color: var(--text);
      padding: 13px 18px;
      font-size: 0.88rem;
      border-radius: var(--radius) 0 0 var(--radius);
      outline: none;
      transition: border-color var(--transition);
    }

    .newsletter-input:focus { border-color: var(--red); }
    .newsletter-input::placeholder { color: var(--muted); }

    .newsletter-btn {
      background: var(--red);
      color: white;
      border: none;
      padding: 13px 22px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      border-radius: 0 var(--radius) var(--radius) 0;
      transition: background var(--transition);
      white-space: nowrap;
    }

    .newsletter-btn:hover { background: var(--red-dark); }

    /* =============================================
       FOOTER
    ============================================= */
    .footer {
      background: #050505;
      border-top: 1px solid var(--border);
      padding: 60px 0 0;
    }

    .footer-logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--white);
    }

    .footer-desc {
      font-size: 0.85rem;
      color: var(--muted);
      line-height: 1.7;
      margin-top: 12px;
      max-width: 280px;
    }

    .social-links { display: flex; gap: 10px; margin-top: 20px; }

    .social-link {
      width: 36px; height: 36px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 0.9rem;
      transition: all var(--transition);
    }

    .social-link:hover {
      background: var(--red);
      border-color: var(--red);
      color: white;
    }

    .footer-heading {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text);
      margin-bottom: 20px;
      position: relative;
      padding-bottom: 10px;
    }

    .footer-heading::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0;
      width: 30px; height: 2px;
      background: var(--red);
    }

    .footer-links { list-style: none; }

    .footer-links li { margin-bottom: 10px; }

    .footer-links a {
      font-size: 0.83rem;
      color: var(--muted);
      transition: color var(--transition);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer-links a:hover { color: var(--red); }
    .footer-links a::before { content: '›'; color: var(--red); }

    .footer-contact-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 14px;
      font-size: 0.83rem;
      color: var(--muted);
    }

    .footer-contact-item i { color: var(--red); margin-top: 2px; flex-shrink: 0; }

    .footer-bottom {
      border-top: 1px solid var(--border);
      padding: 18px 0;
      margin-top: 50px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 0.78rem;
      color: var(--muted);
    }

    /* =============================================
       VIDEO MODAL
    ============================================= */
    .video-modal .modal-content {
      background: #000;
      border: 1px solid var(--border);
    }

    .video-modal .modal-header {
      border-bottom: 1px solid var(--border);
      padding: 14px 20px;
    }

    .video-modal .modal-body { padding: 0; }
    .video-modal .btn-close { filter: invert(1); }

    .video-modal iframe {
      width: 100%;
      aspect-ratio: 16/9;
      border: none;
    }

    /* =============================================
       SCROLL TO TOP
    ============================================= */
    .scroll-top {
      position: fixed;
      bottom: 24px; right: 24px;
      width: 44px; height: 44px;
      background: var(--red);
      color: white;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition), transform var(--transition);
      z-index: 999;
      box-shadow: 0 4px 16px rgba(232,0,29,0.4);
    }

    .scroll-top.visible { opacity: 1; pointer-events: all; }
    .scroll-top:hover { transform: translateY(-3px); }

    /* =============================================
       RESPONSIVE
    ============================================= */
    @media (max-width: 992px) {
      .hero { min-height: 60vh; }
      .hero-side { display: none; }
    }

    @media (max-width: 768px) {
      .section { padding: 50px 0; }
      .hero { min-height: 50vh; }
      .navbar-waraka .nav-live-btn { margin: 8px 0; }
      .newsletter-input-group { flex-direction: column; }
      .newsletter-input { border-right: 1px solid var(--border); border-radius: var(--radius); }
      .newsletter-btn { border-radius: var(--radius); }
    }

    /* =============================================
       ANIMATIONS
    ============================================= */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .animate-in {
      opacity: 0;
      animation: fadeInUp 0.6s ease forwards;
    }

    .animate-delay-1 { animation-delay: 0.1s; }
    .animate-delay-2 { animation-delay: 0.2s; }
    .animate-delay-3 { animation-delay: 0.3s; }
    .animate-delay-4 { animation-delay: 0.4s; }

    /* Intersection observer fade-in */
    .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>

<!-- ============================================
     TOP BAR - BREAKING NEWS TICKER
============================================= -->
<div class="top-bar">
  <div class="container-fluid px-3">
    <div class="d-flex align-items-center gap-3">
      <span class="fw-bold text-white text-nowrap" style="font-size:0.7rem;letter-spacing:0.1em;">⚡ BREAKING</span>
      <div class="ticker-wrapper flex-grow-1">
        <div class="ticker-content text-white">
          <span class="ticker-item">Federal Government Announces New Economic Policy for 2025</span>
          <span class="ticker-item">WARAKA TV Wins Best Digital Media Award at the Nigeria Media Awards</span>
          <span class="ticker-item">Oil Prices Rise as OPEC+ Meeting Concludes in Vienna</span>
          <span class="ticker-item">Super Eagles Begin World Cup Qualification Campaign Next Month</span>
          <span class="ticker-item">New Hospitals to be Built Across Six Geo-political Zones, Says Health Minister</span>
          <span class="ticker-item">WARAKA TV Evening News – Watch at 7 PM Tonight</span>
        </div>
      </div>
      <span class="text-white text-nowrap" id="currentTime" style="font-size:0.72rem;font-weight:600;"></span>
    </div>
  </div>
</div>

<!-- ============================================
     NAVIGATION
============================================= -->
<nav class="navbar-waraka" aria-label="Main Navigation">
  <div class="container">
    <div class="d-flex align-items-center justify-content-between w-100">

      <!-- Logo -->
      <a href="index.php" class="navbar-brand-custom" aria-label="WARAKA TV Home">
        <div class="logo-badge">WARAKA<span style="color:rgba(255,255,255,0.6)">TV</span></div>
        <div class="logo-text">
          Nigeria's Premier<br>Television & Media
        </div>
      </a>

      <!-- Desktop Nav -->
      <div class="d-none d-lg-flex align-items-center gap-1" id="desktopNav">
        <a href="index.php" class="nav-link-custom active">Home</a>

        <!-- News Dropdown -->
        <div class="position-relative" id="newsDropdown">
          <a href="news.php" class="nav-link-custom d-flex align-items-center gap-1">
            News <i class="bi bi-chevron-down" style="font-size:0.65rem;"></i>
          </a>
          <div class="dropdown-menu-dark-custom position-absolute start-0" id="newsMenu" style="display:none;top:100%;">
            <a href="news.php?cat=politics" class="dropdown-item-custom d-block">Politics</a>
            <a href="news.php?cat=business" class="dropdown-item-custom d-block">Business</a>
            <a href="news.php?cat=entertainment" class="dropdown-item-custom d-block">Entertainment</a>
            <a href="news.php?cat=sports" class="dropdown-item-custom d-block">Sports</a>
            <a href="news.php?cat=health" class="dropdown-item-custom d-block">Health</a>
            <a href="news.php?cat=technology" class="dropdown-item-custom d-block">Technology</a>
            <a href="news.php?cat=international" class="dropdown-item-custom d-block">International</a>
          </div>
        </div>

        <a href="programs.php" class="nav-link-custom">Programs</a>
        <a href="videos.php" class="nav-link-custom">Videos</a>
        <a href="awards.php" class="nav-link-custom">Awards</a>
        <a href="about.php" class="nav-link-custom">About</a>
        <a href="advertise.php" class="nav-link-custom">Advertise</a>
        <a href="contact.php" class="nav-link-custom">Contact</a>
        <a href="live.php" class="nav-link-custom nav-live-btn">
          <span class="live-dot"></span> Watch Live
        </a>
      </div>

      <!-- Mobile Menu Button -->
      <button class="d-lg-none btn btn-link text-white p-0" type="button" data-bs-toggle="collapse" data-bs-target="#mobileNav" aria-expanded="false">
        <i class="bi bi-list" style="font-size:1.5rem;"></i>
      </button>
    </div>

    <!-- Mobile Nav -->
    <div class="collapse d-lg-none mt-3" id="mobileNav">
      <div class="d-flex flex-column gap-2 pb-3">
        <a href="index.php" class="nav-link-custom active">Home</a>
        <a href="news.php" class="nav-link-custom">News</a>
        <a href="programs.php" class="nav-link-custom">Programs</a>
        <a href="videos.php" class="nav-link-custom">Videos</a>
        <a href="awards.php" class="nav-link-custom">Awards</a>
        <a href="about.php" class="nav-link-custom">About</a>
        <a href="advertise.php" class="nav-link-custom">Advertise</a>
        <a href="contact.php" class="nav-link-custom">Contact</a>
        <a href="live.php" class="nav-link-custom nav-live-btn">
          <span class="live-dot"></span> Watch Live
        </a>
      </div>
    </div>
  </div>
</nav>

<!-- ============================================
     HERO SECTION - DYNAMIC NEWS
============================================= -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-gradient"></div>

  <div class="container">
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="hero-content">
          <?php if ($featured): ?>
            <div class="hero-category" style="background: <?= e($featured['category_color']) ?>">
              <i class="bi bi-tag"></i> <?= e($featured['category']) ?>
            </div>
            <h1 class="hero-title animate-in">
              <?= e($featured['title']) ?>
            </h1>
            <div class="hero-meta animate-in animate-delay-1">
              <span><i class="bi bi-person"></i> <?= e($featured['author']) ?></span>
              <span><i class="bi bi-calendar"></i> <?= formatDate($featured['published_at']) ?></span>
              <span><i class="bi bi-eye"></i> <?= shortNumber($featured['views']) ?> views</span>
            </div>
            <p class="hero-desc animate-in animate-delay-2">
              <?= e($featured['excerpt'] ?: substr(strip_tags($featured['body']), 0, 200) . '...') ?>
            </p>
            <div class="animate-in animate-delay-3">
              <a href="news-detail.php?id=<?= $featured['id'] ?>&slug=<?= urlencode($featured['slug']) ?>" class="btn-waraka-primary me-3">
                <i class="bi bi-play-circle"></i> Read Full Story
              </a>
              <a href="news.php" class="btn-waraka-outline">
                <i class="bi bi-grid"></i> View All News
              </a>
            </div>
          <?php else: ?>
            <div class="hero-category">
              <i class="bi bi-star"></i> FEATURED
            </div>
            <h1 class="hero-title animate-in">
              Welcome to WARAKA TV
            </h1>
            <p class="hero-desc animate-in animate-delay-1">
              Nigeria's premier television and online media platform. Stay informed with breaking news, exclusive programs, and trending videos from across Nigeria and beyond.
            </p>
            <div class="animate-in animate-delay-2">
              <a href="news.php" class="btn-waraka-primary me-3">
                <i class="bi bi-newspaper"></i> Latest News
              </a>
              <a href="live.php" class="btn-waraka-outline">
                <i class="bi bi-play-circle"></i> Watch Live
              </a>
            </div>
          <?php endif; ?>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="hero-side">
          <?php foreach ($sideNews as $index => $item): ?>
            <a href="news-detail.php?id=<?= $item['id'] ?>&slug=<?= urlencode($item['slug']) ?>" class="hero-side-card animate-in animate-delay-<?= $index + 1 ?>">
              <img src="<?= $item['featured_image'] ? SITE_URL . '/' . e($item['featured_image']) : 'https://via.placeholder.com/80x60?text=No+Image' ?>" alt="<?= e($item['title']) ?>">
              <div>
                <div class="hero-side-card-title"><?= e($item['title']) ?></div>
                <div class="hero-side-card-meta">
                  <span><i class="bi bi-calendar"></i> <?= timeAgo($item['published_at']) ?></span>
                </div>
              </div>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============================================
     LATEST NEWS SECTION
============================================= -->
<section class="section">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">Latest News</h2>
      <a href="news.php" class="section-link">
        View All <i class="bi bi-arrow-right"></i>
      </a>
    </div>

    <div class="row g-4">
      <?php foreach ($gridNews as $item): ?>
        <div class="col-lg-4 col-md-6">
          <a href="news-detail.php?id=<?= $item['id'] ?>&slug=<?= urlencode($item['slug']) ?>" class="news-card">
            <div class="news-card-img">
              <img src="<?= $item['featured_image'] ? SITE_URL . '/' . e($item['featured_image']) : 'https://via.placeholder.com/400x225?text=No+Image' ?>" alt="<?= e($item['title']) ?>">
              <div class="news-card-badge" style="background: <?= e($item['category_color']) ?>">
                <?= e($item['category']) ?>
              </div>
            </div>
            <div class="news-card-body">
              <h3 class="news-card-title"><?= e($item['title']) ?></h3>
              <div class="news-card-meta">
                <span><i class="bi bi-person"></i> <?= e($item['author']) ?></span>
                <span><i class="bi bi-calendar"></i> <?= timeAgo($item['published_at']) ?></span>
              </div>
            </div>
          </a>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- ============================================
     STATS BANNER
============================================= -->
<section class="stats-banner">
  <div class="container">
    <div class="row g-4">
      <div class="col-md-3 col-6">
        <div class="stat-item">
          <div class="stat-number">24/7</div>
          <div class="stat-label">Live Coverage</div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="stat-item">
          <div class="stat-number">50+</div>
          <div class="stat-label">Programs</div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="stat-item">
          <div class="stat-number">1M+</div>
          <div class="stat-label">Viewers</div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="stat-item">
          <div class="stat-number">15+</div>
          <div class="stat-label">Awards Won</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============================================
     NEWSLETTER
============================================= -->
<section class="newsletter-section">
  <div class="container text-center">
    <h2 class="font-display fw-bold text-white mb-3" style="font-size:2rem;">Stay Updated</h2>
    <p class="text-muted mb-4" style="font-size:1.1rem;max-width:600px;margin:0 auto;">
      Get the latest news and exclusive content delivered straight to your inbox.
    </p>

    <form class="newsletter-input-group">
      <input type="email" class="newsletter-input" placeholder="Enter your email address" required>
      <button type="submit" class="newsletter-btn">Subscribe</button>
    </form>
  </div>
</section>

<!-- ============================================
     FOOTER
============================================= -->
<footer class="footer">
  <div class="container">
    <div class="row g-4">
      <div class="col-lg-4">
        <div class="footer-logo-text">WARAKA TV</div>
        <p class="footer-desc">
          Nigeria's premier television and online media platform, delivering breaking news, exclusive programs, and trending videos from across Nigeria and beyond.
        </p>
        <div class="social-links">
          <a href="#" class="social-link"><i class="bi bi-facebook"></i></a>
          <a href="#" class="social-link"><i class="bi bi-twitter"></i></a>
          <a href="#" class="social-link"><i class="bi bi-instagram"></i></a>
          <a href="#" class="social-link"><i class="bi bi-youtube"></i></a>
        </div>
      </div>

      <div class="col-lg-2 col-md-3 col-6">
        <h4 class="footer-heading">Quick Links</h4>
        <ul class="footer-links">
          <li><a href="index.php">Home</a></li>
          <li><a href="news.php">News</a></li>
          <li><a href="programs.php">Programs</a></li>
          <li><a href="videos.php">Videos</a></li>
          <li><a href="live.php">Live TV</a></li>
        </ul>
      </div>

      <div class="col-lg-2 col-md-3 col-6">
        <h4 class="footer-heading">Company</h4>
        <ul class="footer-links">
          <li><a href="about.php">About Us</a></li>
          <li><a href="awards.php">Awards</a></li>
          <li><a href="advertise.php">Advertise</a></li>
          <li><a href="contact.php">Contact</a></li>
        </ul>
      </div>

      <div class="col-lg-4">
        <h4 class="footer-heading">Contact Info</h4>
        <div class="footer-contact-item">
          <i class="bi bi-geo-alt"></i>
          <div>
            <strong>Address:</strong><br>
            Kano State, Nigeria
          </div>
        </div>
        <div class="footer-contact-item">
          <i class="bi bi-envelope"></i>
          <div>
            <strong>Email:</strong><br>
            warakatv1122@gmail.com
          </div>
        </div>
        <div class="footer-contact-item">
          <i class="bi bi-telephone"></i>
          <div>
            <strong>Phone:</strong><br>
            +234 913 310 6798
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div>&copy; 2025 WARAKA TV. All rights reserved.</div>
      <div>
        <a href="#" class="text-muted">Privacy Policy</a> |
        <a href="#" class="text-muted">Terms of Service</a>
      </div>
    </div>
  </div>
</footer>

<!-- ============================================
     SCRIPTS
============================================= -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
  // Current time display
  function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    document.getElementById('currentTime').textContent = timeString;
  }
  updateTime();
  setInterval(updateTime, 1000);

  // Dropdown toggle
  document.getElementById('newsDropdown').addEventListener('mouseenter', function() {
    document.getElementById('newsMenu').style.display = 'block';
  });
  document.getElementById('newsDropdown').addEventListener('mouseleave', function() {
    document.getElementById('newsMenu').style.display = 'none';
  });

  // Scroll to top
  const scrollTopBtn = document.querySelector('.scroll-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Intersection observer for animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
</script>

</body>
</html>