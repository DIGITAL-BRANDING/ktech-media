<?php
/**
 * WARAKA TV – Admin Dashboard
 * File: admin/dashboard.php
 */
require_once '../includes/config.php';
requireAdmin();

$db = Database::getInstance();

// Fetch stats
$stats = [];
foreach (['news' => 'status="published"', 'videos' => 'status="published"', 'community_reports' => 'status="pending"', 'contact_messages' => 'is_read=0'] as $table => $cond) {
    $stats[$table] = $db->query("SELECT COUNT(*) FROM {$table} WHERE {$cond}")->fetchColumn();
}

$totalNews      = $db->query("SELECT COUNT(*) FROM news")->fetchColumn();
$totalVideos    = $db->query("SELECT COUNT(*) FROM videos")->fetchColumn();
$totalViews     = $db->query("SELECT COALESCE(SUM(views),0) FROM news")->fetchColumn();
$subscribers    = $db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE is_confirmed=1")->fetchColumn();

// Recent news
$recentNews = $db->query("SELECT n.id, n.title, n.status, n.views, n.created_at, u.full_name as author, c.name as category
    FROM news n JOIN users u ON n.author_id=u.id JOIN categories c ON n.category_id=c.id
    ORDER BY n.created_at DESC LIMIT 8")->fetchAll();

// Pending reports
$pendingReports = $db->query("SELECT id, full_name, title, created_at FROM community_reports WHERE status='pending' ORDER BY created_at DESC LIMIT 5")->fetchAll();

// Unread messages
$unreadMessages = $db->query("SELECT id, full_name, subject, created_at FROM contact_messages WHERE is_read=0 ORDER BY created_at DESC LIMIT 5")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dashboard – WARAKA TV Admin</title>
  <meta name="robots" content="noindex, nofollow"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
  <style>
    :root { --red:#E8001D; --dark:#111; --card:#181818; --border:#2A2A2A; --text:#E8E8E8; --muted:#888; }
    * { box-sizing:border-box; }
    body { background:#0A0A0A; color:var(--text); font-family:'Segoe UI',sans-serif; margin:0; display:flex; min-height:100vh; }

    /* Sidebar */
    .sidebar { width:240px; background:var(--dark); border-right:1px solid var(--border); display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; z-index:100; overflow-y:auto; flex-shrink:0; }
    .sidebar-brand { padding:20px 20px 16px; border-bottom:1px solid var(--border); }
    .logo-badge { background:var(--red); color:#fff; font-weight:900; font-size:1.1rem; padding:4px 12px; letter-spacing:2px; border-radius:3px; display:inline-block; }
    .sidebar-section { padding:10px 0; border-bottom:1px solid var(--border); }
    .sidebar-label { font-size:0.65rem; color:var(--muted); letter-spacing:0.12em; text-transform:uppercase; padding:6px 20px; }
    .nav-item-admin { display:flex; align-items:center; gap:10px; padding:10px 20px; color:var(--muted); font-size:0.85rem; text-decoration:none; transition:all 0.2s; border-left:3px solid transparent; }
    .nav-item-admin:hover, .nav-item-admin.active { color:var(--text); background:rgba(255,255,255,0.04); border-left-color:var(--red); }
    .nav-item-admin i { width:18px; text-align:center; font-size:1rem; }
    .badge-count { background:var(--red); color:#fff; font-size:0.65rem; padding:2px 7px; border-radius:999px; margin-left:auto; }
    .sidebar-user { padding:16px 20px; margin-top:auto; border-top:1px solid var(--border); display:flex; align-items:center; gap:10px; }
    .user-avatar { width:34px; height:34px; background:var(--red); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; color:#fff; flex-shrink:0; }
    .user-name { font-size:0.82rem; color:var(--text); font-weight:500; }
    .user-role { font-size:0.7rem; color:var(--muted); text-transform:capitalize; }

    /* Main content */
    .main-content { margin-left:240px; flex:1; display:flex; flex-direction:column; min-height:100vh; }
    .topbar { background:var(--dark); border-bottom:1px solid var(--border); padding:14px 28px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
    .topbar-title { font-size:1.1rem; font-weight:600; color:var(--text); }
    .content-area { padding:28px; flex:1; }

    /* Cards */
    .stat-card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:22px; display:flex; align-items:center; gap:16px; transition:border-color 0.2s; }
    .stat-card:hover { border-color:var(--red); }
    .stat-icon { width:50px; height:50px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
    .stat-number { font-size:1.8rem; font-weight:700; color:var(--text); line-height:1; }
    .stat-label { font-size:0.75rem; color:var(--muted); margin-top:4px; text-transform:uppercase; letter-spacing:0.06em; }
    .stat-change { font-size:0.72rem; color:#22C55E; margin-top:3px; }

    /* Table */
    .table-admin { width:100%; border-collapse:collapse; }
    .table-admin th { font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); padding:10px 14px; border-bottom:1px solid var(--border); text-align:left; }
    .table-admin td { padding:12px 14px; border-bottom:1px solid var(--border); font-size:0.85rem; vertical-align:middle; }
    .table-admin tr:hover td { background:rgba(255,255,255,0.02); }
    .table-admin tr:last-child td { border-bottom:none; }

    /* Status badges */
    .status-badge { font-size:0.68rem; font-weight:600; padding:3px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:0.05em; }
    .status-published { background:rgba(34,197,94,0.15); color:#22C55E; }
    .status-draft { background:rgba(251,191,36,0.15); color:#FBBf24; }
    .status-pending { background:rgba(232,0,29,0.15); color:#E8001D; }
    .status-archived { background:rgba(136,136,136,0.15); color:#888; }

    .section-card { background:var(--card); border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-bottom:24px; }
    .section-card-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
    .section-card-title { font-size:0.9rem; font-weight:600; }

    .btn-sm-admin { font-size:0.75rem; padding:5px 12px; border-radius:5px; border:1px solid var(--border); background:transparent; color:var(--muted); cursor:pointer; text-decoration:none; transition:all 0.2s; }
    .btn-sm-admin:hover { border-color:var(--red); color:var(--red); }

    .btn-red { background:var(--red); color:#fff; border:none; padding:8px 18px; border-radius:6px; font-size:0.82rem; font-weight:600; cursor:pointer; text-decoration:none; transition:background 0.2s; }
    .btn-red:hover { background:#B5001A; color:#fff; }

    @media (max-width:768px) {
      .sidebar { width:0; overflow:hidden; }
      .main-content { margin-left:0; }
    }
  </style>
</head>
<body>

<!-- ============ SIDEBAR ============ -->
<aside class="sidebar" aria-label="Admin Navigation">
  <div class="sidebar-brand">
    <div class="logo-badge">WARAKA<span style="color:rgba(255,255,255,0.5)">TV</span></div>
    <div style="font-size:0.65rem;color:var(--muted);margin-top:4px;letter-spacing:0.1em;text-transform:uppercase;">Admin Panel</div>
  </div>

  <nav>
    <div class="sidebar-section">
      <div class="sidebar-label">Main</div>
      <a href="dashboard.php" class="nav-item-admin active"><i class="bi bi-speedometer2"></i> Dashboard</a>
      <a href="news.php" class="nav-item-admin"><i class="bi bi-newspaper"></i> News</a>
      <a href="videos.php" class="nav-item-admin"><i class="bi bi-camera-video"></i> Videos</a>
      <a href="programs.php" class="nav-item-admin"><i class="bi bi-collection-play"></i> Programs</a>
      <a href="categories.php" class="nav-item-admin"><i class="bi bi-tags"></i> Categories</a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Community</div>
      <a href="reports.php" class="nav-item-admin">
        <i class="bi bi-flag"></i> Community Reports
        <?php if ($stats['community_reports'] > 0): ?>
          <span class="badge-count"><?= $stats['community_reports'] ?></span>
        <?php endif; ?>
      </a>
      <a href="messages.php" class="nav-item-admin">
        <i class="bi bi-envelope"></i> Messages
        <?php if ($stats['contact_messages'] > 0): ?>
          <span class="badge-count"><?= $stats['contact_messages'] ?></span>
        <?php endif; ?>
      </a>
      <a href="newsletter.php" class="nav-item-admin"><i class="bi bi-send"></i> Newsletter</a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Monetization</div>
      <a href="advertisements.php" class="nav-item-admin"><i class="bi bi-megaphone"></i> Advertisements</a>
      <a href="awards.php" class="nav-item-admin"><i class="bi bi-trophy"></i> Awards</a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">System</div>
      <a href="users.php" class="nav-item-admin"><i class="bi bi-people"></i> Users</a>
      <a href="settings.php" class="nav-item-admin"><i class="bi bi-gear"></i> Settings</a>
      <a href="<?= SITE_URL ?>" target="_blank" class="nav-item-admin"><i class="bi bi-box-arrow-up-right"></i> View Website</a>
    </div>
  </nav>

  <div class="sidebar-user">
    <div class="user-avatar"><i class="bi bi-person-fill"></i></div>
    <div>
      <div class="user-name"><?= e($_SESSION['admin_name']) ?></div>
      <div class="user-role"><?= e(str_replace('_', ' ', $_SESSION['admin_role'])) ?></div>
    </div>
    <a href="logout.php" class="ms-auto" title="Logout" style="color:var(--muted);font-size:1rem;"><i class="bi bi-box-arrow-right"></i></a>
  </div>
</aside>

<!-- ============ MAIN ============ -->
<main class="main-content">
  <div class="topbar">
    <span class="topbar-title">Dashboard Overview</span>
    <div class="d-flex align-items-center gap-3">
      <span style="font-size:0.78rem;color:var(--muted);" id="dashTime"></span>
      <a href="news-create.php" class="btn-red"><i class="bi bi-plus-lg me-1"></i> New Article</a>
    </div>
  </div>

  <div class="content-area">

    <!-- STAT CARDS -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(232,0,29,0.1);color:#E8001D;"><i class="bi bi-newspaper"></i></div>
          <div>
            <div class="stat-number"><?= number_format($totalNews) ?></div>
            <div class="stat-label">Total Articles</div>
            <div class="stat-change"><?= $stats['news'] ?> published</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.1);color:#3B82F6;"><i class="bi bi-camera-video"></i></div>
          <div>
            <div class="stat-number"><?= number_format($totalVideos) ?></div>
            <div class="stat-label">Total Videos</div>
            <div class="stat-change"><?= $stats['videos'] ?> live</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.1);color:#22C55E;"><i class="bi bi-eye"></i></div>
          <div>
            <div class="stat-number"><?= shortNumber((int)$totalViews) ?></div>
            <div class="stat-label">Total Views</div>
            <div class="stat-change">All time</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(201,150,26,0.1);color:#C9961A;"><i class="bi bi-envelope-heart"></i></div>
          <div>
            <div class="stat-number"><?= number_format($subscribers) ?></div>
            <div class="stat-label">Subscribers</div>
            <div class="stat-change">Confirmed</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">

      <!-- Recent News -->
      <div class="col-lg-8">
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">Recent Articles</span>
            <a href="news.php" class="btn-sm-admin">View All</a>
          </div>
          <div style="overflow-x:auto;">
            <table class="table-admin">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($recentNews as $article): ?>
                <tr>
                  <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    <?= e($article['title']) ?>
                  </td>
                  <td style="color:var(--muted);white-space:nowrap;"><?= e($article['author']) ?></td>
                  <td style="color:var(--muted);"><?= e($article['category']) ?></td>
                  <td>
                    <span class="status-badge status-<?= $article['status'] ?>">
                      <?= $article['status'] ?>
                    </span>
                  </td>
                  <td style="color:var(--muted);"><?= shortNumber((int)$article['views']) ?></td>
                  <td style="color:var(--muted);white-space:nowrap;font-size:0.75rem;"><?= timeAgo($article['created_at']) ?></td>
                  <td>
                    <a href="news-edit.php?id=<?= $article['id'] ?>" class="btn-sm-admin">Edit</a>
                  </td>
                </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div class="col-lg-4">

        <!-- Pending Reports -->
        <div class="section-card mb-4">
          <div class="section-card-header">
            <span class="section-card-title">Pending Reports
              <?php if ($stats['community_reports']): ?>
                <span class="badge-count ms-2"><?= $stats['community_reports'] ?></span>
              <?php endif; ?>
            </span>
            <a href="reports.php" class="btn-sm-admin">View All</a>
          </div>
          <?php if ($pendingReports): ?>
            <?php foreach ($pendingReports as $report): ?>
            <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
              <div style="font-size:0.83rem;color:var(--text);margin-bottom:2px;"><?= e($report['title']) ?></div>
              <div style="font-size:0.72rem;color:var(--muted);">
                By <?= e($report['full_name']) ?> &bull; <?= timeAgo($report['created_at']) ?>
              </div>
            </div>
            <?php endforeach; ?>
          <?php else: ?>
            <div style="padding:20px;text-align:center;color:var(--muted);font-size:0.83rem;">No pending reports</div>
          <?php endif; ?>
        </div>

        <!-- Unread Messages -->
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">Unread Messages
              <?php if ($stats['contact_messages']): ?>
                <span class="badge-count ms-2"><?= $stats['contact_messages'] ?></span>
              <?php endif; ?>
            </span>
            <a href="messages.php" class="btn-sm-admin">View All</a>
          </div>
          <?php if ($unreadMessages): ?>
            <?php foreach ($unreadMessages as $msg): ?>
            <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
              <div style="font-size:0.83rem;color:var(--text);margin-bottom:2px;"><?= e($msg['subject']) ?></div>
              <div style="font-size:0.72rem;color:var(--muted);">
                From <?= e($msg['full_name']) ?> &bull; <?= timeAgo($msg['created_at']) ?>
              </div>
            </div>
            <?php endforeach; ?>
          <?php else: ?>
            <div style="padding:20px;text-align:center;color:var(--muted);font-size:0.83rem;">No unread messages</div>
          <?php endif; ?>
        </div>

      </div>
    </div>

  </div><!-- /content-area -->
</main>

<script>
function updateTime() {
  const el = document.getElementById('dashTime');
  if (el) el.textContent = new Date().toLocaleString('en-NG', { dateStyle:'medium', timeStyle:'short' });
}
updateTime();
setInterval(updateTime, 60000);
</script>
</body>
</html>
