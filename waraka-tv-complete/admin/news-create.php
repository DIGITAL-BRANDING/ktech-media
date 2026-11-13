<?php
/**
 * WARAKA TV – Create / Edit News Article
 * File: admin/news-create.php
 * 
 * Handles both POST (save) and GET (show form)
 */
require_once '../includes/config.php';
requireAdmin();

$db     = Database::getInstance();
$editId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$isEdit = $editId > 0;
$article = [];
$errors  = [];
$success = '';

// Load existing article for edit
if ($isEdit) {
    $stmt = $db->prepare("SELECT * FROM news WHERE id = ?");
    $stmt->execute([$editId]);
    $article = $stmt->fetch();
    if (!$article) {
        redirect(SITE_URL . '/admin/news.php');
    }
}

// Fetch categories for dropdown
$categories = $db->query("SELECT id, name FROM categories WHERE is_active=1 ORDER BY name")->fetchAll();

// Handle form submit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid CSRF token.';
    } else {
        // Validate inputs
        $title      = trim($_POST['title']      ?? '');
        $excerpt    = trim($_POST['excerpt']    ?? '');
        $body       = trim($_POST['body']       ?? '');
        $catId      = (int)($_POST['category_id'] ?? 0);
        $tags       = trim($_POST['tags']       ?? '');
        $status     = in_array($_POST['status'] ?? '', ['draft','published','archived']) ? $_POST['status'] : 'draft';
        $isFeatured = isset($_POST['is_featured']) ? 1 : 0;
        $isBreaking = isset($_POST['is_breaking']) ? 1 : 0;
        $metaTitle  = trim($_POST['meta_title'] ?? '');
        $metaDesc   = trim($_POST['meta_desc']  ?? '');

        if (empty($title))  $errors[] = 'Article title is required.';
        if (empty($body))   $errors[] = 'Article body is required.';
        if ($catId === 0)   $errors[] = 'Please select a category.';

        // Generate slug
        $slug = slugify($title);
        // Check uniqueness (exclude self on edit)
        $slugCheck = $db->prepare("SELECT id FROM news WHERE slug = ? AND id != ?");
        $slugCheck->execute([$slug, $editId ?: 0]);
        if ($slugCheck->fetch()) {
            $slug .= '-' . time();
        }

        // Handle image upload
        $imagePath = $article['featured_image'] ?? null;
        if (!empty($_FILES['featured_image']['name'])) {
            $uploaded = uploadFile($_FILES['featured_image'], 'news');
            if ($uploaded === false) {
                $errors[] = 'Image upload failed. Check file type (JPEG/PNG/WebP) and size (max 5MB).';
            } else {
                $imagePath = $uploaded;
            }
        }

        if (empty($errors)) {
            $publishedAt = ($status === 'published' && !$isEdit) ? date('Y-m-d H:i:s') : ($article['published_at'] ?? null);

            if ($isEdit) {
                $stmt = $db->prepare("UPDATE news SET
                    title=?, slug=?, excerpt=?, body=?, category_id=?, featured_image=?,
                    tags=?, is_featured=?, is_breaking=?, status=?, meta_title=?, meta_desc=?,
                    published_at=?, updated_at=NOW()
                    WHERE id=?");
                $stmt->execute([
                    $title, $slug, $excerpt, $body, $catId, $imagePath,
                    $tags, $isFeatured, $isBreaking, $status, $metaTitle, $metaDesc,
                    $publishedAt, $editId
                ]);
                $success = 'Article updated successfully.';
                $article = array_merge($article, compact('title','slug','excerpt','body','catId','tags','status','isFeatured','isBreaking','metaTitle','metaDesc','imagePath'));
            } else {
                $stmt = $db->prepare("INSERT INTO news
                    (author_id, category_id, title, slug, excerpt, body, featured_image,
                     tags, is_featured, is_breaking, status, meta_title, meta_desc, published_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
                $stmt->execute([
                    $_SESSION['admin_id'], $catId, $title, $slug, $excerpt, $body, $imagePath,
                    $tags, $isFeatured, $isBreaking, $status, $metaTitle, $metaDesc, $publishedAt
                ]);
                $newId = $db->lastInsertId();
                redirect(SITE_URL . '/admin/news-create.php?id=' . $newId . '&saved=1');
            }
        }
    }
}

if (isset($_GET['saved'])) $success = 'Article saved successfully!';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title><?= $isEdit ? 'Edit Article' : 'New Article' ?> – WARAKA TV Admin</title>
  <meta name="robots" content="noindex, nofollow"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
  <!-- TinyMCE CDN (or replace with your preferred editor) -->
  <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/7/tinymce.min.js" referrerpolicy="origin"></script>
  <style>
    :root { --red:#E8001D; --dark:#111; --card:#181818; --border:#2A2A2A; --text:#E8E8E8; --muted:#888; }
    body { background:#0A0A0A; color:var(--text); font-family:'Segoe UI',sans-serif; }
    .form-label { color:#888; font-size:0.82rem; margin-bottom:5px; }
    .form-control-dark, .form-select-dark { background:#111; border:1px solid #2A2A2A; color:#E8E8E8; border-radius:6px; padding:10px 14px; width:100%; }
    .form-control-dark:focus, .form-select-dark:focus { background:#111; border-color:#E8001D; color:#E8E8E8; box-shadow:none; outline:none; }
    .form-select-dark option { background:#111; }
    .form-control-dark::placeholder { color:#555; }
    .card-admin { background:#181818; border:1px solid #2A2A2A; border-radius:8px; padding:22px; margin-bottom:20px; }
    .btn-red { background:#E8001D; color:#fff; border:none; padding:10px 22px; border-radius:6px; font-weight:600; cursor:pointer; font-size:0.85rem; transition:background 0.2s; }
    .btn-red:hover { background:#B5001A; }
    .btn-outline { background:transparent; border:1px solid #2A2A2A; color:#888; padding:10px 18px; border-radius:6px; font-size:0.85rem; cursor:pointer; transition:all 0.2s; text-decoration:none; }
    .btn-outline:hover { border-color:#E8001D; color:#E8001D; }
    .topbar { background:#111; border-bottom:1px solid #2A2A2A; padding:14px 28px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
    .alert-success { background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); color:#22C55E; border-radius:6px; padding:12px 16px; margin-bottom:16px; }
    .alert-error { background:rgba(232,0,29,0.1); border:1px solid rgba(232,0,29,0.3); color:#ff6b6b; border-radius:6px; padding:12px 16px; margin-bottom:16px; }
    .form-check-dark .form-check-input { background:#111; border-color:#2A2A2A; }
    .form-check-dark .form-check-input:checked { background:#E8001D; border-color:#E8001D; }
    .char-count { font-size:0.7rem; color:#555; text-align:right; margin-top:3px; }
  </style>
</head>
<body>

<div class="topbar">
  <div class="d-flex align-items-center gap-3">
    <a href="dashboard.php" style="color:#888;font-size:1rem;"><i class="bi bi-arrow-left"></i></a>
    <span style="font-size:1rem;font-weight:600;"><?= $isEdit ? 'Edit Article' : 'New Article' ?></span>
  </div>
  <div class="d-flex gap-2">
    <a href="news.php" class="btn-outline">Cancel</a>
    <button type="submit" form="articleForm" name="status" value="draft" class="btn-outline">Save Draft</button>
    <button type="submit" form="articleForm" name="status" value="published" class="btn-red">
      <i class="bi bi-cloud-upload me-1"></i> Publish
    </button>
  </div>
</div>

<div class="container-fluid p-4" style="max-width:1100px;margin:0 auto;">

  <?php if ($success): ?>
    <div class="alert-success"><i class="bi bi-check-circle me-2"></i><?= e($success) ?></div>
  <?php endif; ?>
  <?php if ($errors): ?>
    <div class="alert-error">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <?php foreach ($errors as $err): ?><?= e($err) ?><br><?php endforeach; ?>
    </div>
  <?php endif; ?>

  <form id="articleForm" method="POST" enctype="multipart/form-data" novalidate>
    <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>" />

    <div class="row g-4">

      <!-- LEFT: Main Content -->
      <div class="col-lg-8">
        <div class="card-admin">
          <div class="mb-4">
            <label class="form-label">Article Title *</label>
            <input type="text" name="title" class="form-control-dark" placeholder="Enter a compelling headline..."
                   value="<?= e($article['title'] ?? '') ?>" maxlength="255" id="titleInput" required />
          </div>
          <div class="mb-4">
            <label class="form-label">Excerpt / Summary</label>
            <textarea name="excerpt" class="form-control-dark" rows="3"
                      placeholder="Short summary shown in news cards and search results..."
                      maxlength="400" id="excerptInput"><?= e($article['excerpt'] ?? '') ?></textarea>
            <div class="char-count"><span id="excerptCount">0</span>/400 characters</div>
          </div>
          <div>
            <label class="form-label">Article Body *</label>
            <textarea name="body" id="bodyEditor"><?= htmlspecialchars($article['body'] ?? '', ENT_QUOTES) ?></textarea>
          </div>
        </div>

        <!-- SEO Card -->
        <div class="card-admin">
          <h6 style="color:#888;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px;">SEO Settings</h6>
          <div class="mb-3">
            <label class="form-label">Meta Title (leave blank to use article title)</label>
            <input type="text" name="meta_title" class="form-control-dark"
                   placeholder="SEO-optimised title (max 60 chars)..."
                   value="<?= e($article['meta_title'] ?? '') ?>" maxlength="255" />
          </div>
          <div>
            <label class="form-label">Meta Description</label>
            <textarea name="meta_desc" class="form-control-dark" rows="2"
                      placeholder="Brief description for search engines (max 160 chars)..."
                      maxlength="320" id="metaDescInput"><?= e($article['meta_desc'] ?? '') ?></textarea>
            <div class="char-count"><span id="metaDescCount">0</span>/160 characters</div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Settings -->
      <div class="col-lg-4">
        <!-- Publish Settings -->
        <div class="card-admin">
          <h6 style="color:#888;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px;">Publish Settings</h6>
          <div class="mb-3">
            <label class="form-label">Status</label>
            <select name="status" class="form-select-dark">
              <option value="draft"     <?= (($article['status'] ?? 'draft') === 'draft')     ? 'selected' : '' ?>>Draft</option>
              <option value="published" <?= (($article['status'] ?? '') === 'published') ? 'selected' : '' ?>>Published</option>
              <option value="archived"  <?= (($article['status'] ?? '') === 'archived')  ? 'selected' : '' ?>>Archived</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Category *</label>
            <select name="category_id" class="form-select-dark" required>
              <option value="">Select Category...</option>
              <?php foreach ($categories as $cat): ?>
              <option value="<?= $cat['id'] ?>" <?= (($article['category_id'] ?? 0) == $cat['id']) ? 'selected' : '' ?>>
                <?= e($cat['name']) ?>
              </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Tags (comma separated)</label>
            <input type="text" name="tags" class="form-control-dark" placeholder="politics, abuja, elections..."
                   value="<?= e($article['tags'] ?? '') ?>" />
          </div>
          <div class="mb-2 form-check form-check-dark">
            <input class="form-check-input" type="checkbox" name="is_featured" id="isFeatured" value="1"
                   <?= !empty($article['is_featured']) ? 'checked' : '' ?>>
            <label class="form-check-label" for="isFeatured" style="color:#ccc;font-size:0.85rem;">
              Feature on Homepage
            </label>
          </div>
          <div class="form-check form-check-dark">
            <input class="form-check-input" type="checkbox" name="is_breaking" id="isBreaking" value="1"
                   <?= !empty($article['is_breaking']) ? 'checked' : '' ?>>
            <label class="form-check-label" for="isBreaking" style="color:#ccc;font-size:0.85rem;">
              Breaking News Ticker
            </label>
          </div>
        </div>

        <!-- Featured Image -->
        <div class="card-admin">
          <h6 style="color:#888;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px;">Featured Image</h6>
          <?php if (!empty($article['featured_image'])): ?>
            <img src="<?= SITE_URL . '/' . e($article['featured_image']) ?>"
                 alt="Current image" style="width:100%;border-radius:6px;margin-bottom:12px;" />
          <?php endif; ?>
          <input type="file" name="featured_image" id="imageInput" accept="image/jpeg,image/png,image/webp"
                 style="display:none;" onchange="previewImage(this)" />
          <div id="imagePreview" style="display:none;margin-bottom:12px;">
            <img id="previewImg" style="width:100%;border-radius:6px;" alt="Preview" />
          </div>
          <button type="button" onclick="document.getElementById('imageInput').click()"
                  class="btn-outline w-100">
            <i class="bi bi-image me-2"></i>
            <?= !empty($article['featured_image']) ? 'Change Image' : 'Upload Image' ?>
          </button>
          <p style="font-size:0.7rem;color:#555;margin-top:8px;">JPEG, PNG or WebP. Max 5MB. Recommended: 1200×630px</p>
        </div>

      </div><!-- /col -->
    </div><!-- /row -->

  </form>
</div>

<script>
// TinyMCE init
tinymce.init({
  selector: '#bodyEditor',
  skin: 'oxide-dark',
  content_css: 'dark',
  menubar: false,
  plugins: 'link image lists media table code wordcount',
  toolbar: 'undo redo | formatselect | bold italic underline | bullist numlist | link image media | table | code | wordcount',
  height: 450,
  content_style: 'body { background: #111; color: #E8E8E8; font-family: Georgia, serif; font-size: 16px; line-height: 1.7; padding: 16px; }'
});

// Character counters
function charCount(inputId, countId, max) {
  const input = document.getElementById(inputId);
  const count = document.getElementById(countId);
  if (!input || !count) return;
  function update() {
    const len = input.value.length;
    count.textContent = len;
    count.style.color = len > max * 0.9 ? '#E8001D' : '#555';
  }
  input.addEventListener('input', update);
  update();
}
charCount('excerptInput', 'excerptCount', 400);
charCount('metaDescInput', 'metaDescCount', 160);

// Image preview
function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}
</script>
</body>
</html>
