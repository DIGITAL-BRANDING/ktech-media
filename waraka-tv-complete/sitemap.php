<?php
/**
 * WARAKA TV – Dynamic XML Sitemap
 * File: sitemap.php
 * 
 * Access at: https://warakatv.ng/sitemap.php
 * Submit to Google Search Console and Bing Webmaster Tools.
 */
require_once 'includes/config.php';
header('Content-Type: application/xml; charset=UTF-8');

$db = Database::getInstance();

// Fetch published news
$news   = $db->query("SELECT slug, updated_at FROM news WHERE status='published' ORDER BY updated_at DESC LIMIT 5000")->fetchAll();
$videos = $db->query("SELECT slug, updated_at FROM videos WHERE status='published' ORDER BY updated_at DESC LIMIT 1000")->fetchAll();

echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Pages -->
  <?php
  $staticPages = [
    ['url' => '/',             'priority' => '1.0', 'freq' => 'daily'],
    ['url' => '/news',         'priority' => '0.9', 'freq' => 'hourly'],
    ['url' => '/live',         'priority' => '0.9', 'freq' => 'daily'],
    ['url' => '/programs',     'priority' => '0.8', 'freq' => 'weekly'],
    ['url' => '/videos',       'priority' => '0.8', 'freq' => 'daily'],
    ['url' => '/awards',       'priority' => '0.6', 'freq' => 'monthly'],
    ['url' => '/about',        'priority' => '0.6', 'freq' => 'monthly'],
    ['url' => '/advertise',    'priority' => '0.6', 'freq' => 'monthly'],
    ['url' => '/submit-news',  'priority' => '0.5', 'freq' => 'monthly'],
    ['url' => '/contact',      'priority' => '0.5', 'freq' => 'monthly'],
  ];
  foreach ($staticPages as $page):
  ?>
  <url>
    <loc><?= SITE_URL . $page['url'] ?></loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq><?= $page['freq'] ?></changefreq>
    <priority><?= $page['priority'] ?></priority>
  </url>
  <?php endforeach; ?>

  <!-- News Articles -->
  <?php foreach ($news as $article): ?>
  <url>
    <loc><?= SITE_URL ?>/news/<?= htmlspecialchars($article['slug']) ?></loc>
    <lastmod><?= date('Y-m-d', strtotime($article['updated_at'])) ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <?php endforeach; ?>

  <!-- Videos -->
  <?php foreach ($videos as $video): ?>
  <url>
    <loc><?= SITE_URL ?>/videos/<?= htmlspecialchars($video['slug']) ?></loc>
    <lastmod><?= date('Y-m-d', strtotime($video['updated_at'])) ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <?php endforeach; ?>

</urlset>
