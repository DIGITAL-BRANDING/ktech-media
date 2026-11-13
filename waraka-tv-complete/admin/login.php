<?php
/**
 * WARAKA TV – Admin Login
 * File: admin/login.php
 */
require_once '../includes/config.php';

// Already logged in → redirect to dashboard
if (!empty($_SESSION['admin_id'])) {
    redirect(SITE_URL . '/admin/dashboard.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF check
    if (!verifyCsrf($_POST['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($username) || empty($password)) {
            $error = 'Username and password are required.';
        } else {
            $db   = Database::getInstance();
            $stmt = $db->prepare("SELECT id, full_name, username, email, password, role 
                                  FROM users WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                // Regenerate session ID to prevent fixation
                session_regenerate_id(true);

                $_SESSION['admin_id']       = $user['id'];
                $_SESSION['admin_name']     = $user['full_name'];
                $_SESSION['admin_username'] = $user['username'];
                $_SESSION['admin_role']     = $user['role'];

                // Update last login
                $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

                redirect(SITE_URL . '/admin/dashboard.php');
            } else {
                $error = 'Invalid credentials. Please try again.';
                // Rate-limit could be added here (e.g. track failed attempts)
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Login – WARAKA TV</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  <style>
    body { background:#0A0A0A; font-family:'Segoe UI',sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .login-card { background:#181818; border:1px solid #2A2A2A; border-radius:10px; padding:40px; width:100%; max-width:400px; }
    .logo-badge { background:#E8001D; color:#fff; font-weight:900; font-size:1.5rem; padding:5px 16px; letter-spacing:2px; border-radius:4px; display:inline-block; margin-bottom:6px; }
    .form-control-dark { background:#111; border:1px solid #2A2A2A; color:#E8E8E8; border-radius:6px; padding:11px 14px; }
    .form-control-dark:focus { background:#111; border-color:#E8001D; color:#E8E8E8; box-shadow:0 0 0 3px rgba(232,0,29,0.15); }
    .form-control-dark::placeholder { color:#555; }
    .btn-login { background:#E8001D; color:#fff; border:none; padding:12px; font-weight:600; border-radius:6px; width:100%; transition:background 0.2s; }
    .btn-login:hover { background:#B5001A; color:#fff; }
    .form-label { color:#888; font-size:0.82rem; margin-bottom:5px; }
    .back-link { color:#555; font-size:0.78rem; text-decoration:none; } .back-link:hover { color:#E8001D; }
  </style>
</head>
<body>
<div class="login-card text-center">
  <div class="logo-badge">WARAKA<span style="color:rgba(255,255,255,0.5)">TV</span></div>
  <p class="text-secondary mb-4" style="font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;">Content Management System</p>

  <?php if ($error): ?>
    <div class="alert" style="background:rgba(232,0,29,0.1);border:1px solid rgba(232,0,29,0.3);color:#ff6b6b;border-radius:6px;padding:10px;font-size:0.85rem;margin-bottom:16px;">
      <i class="bi bi-exclamation-triangle-fill me-2"></i><?= e($error) ?>
    </div>
  <?php endif; ?>

  <form method="POST" action="" novalidate>
    <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>" />

    <div class="mb-3 text-start">
      <label class="form-label">Username or Email</label>
      <input type="text" name="username" class="form-control form-control-dark"
             placeholder="Enter username or email"
             value="<?= e($_POST['username'] ?? '') ?>"
             autocomplete="username" required />
    </div>

    <div class="mb-4 text-start">
      <label class="form-label">Password</label>
      <div class="position-relative">
        <input type="password" name="password" id="pwdInput" class="form-control form-control-dark"
               placeholder="Enter password" autocomplete="current-password" required />
        <button type="button" onclick="togglePwd()" class="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-2"
                style="background:transparent;border:none;color:#555;font-size:0.9rem;">
          <i class="bi bi-eye" id="pwdToggleIcon"></i>
        </button>
      </div>
    </div>

    <button type="submit" class="btn-login">
      <i class="bi bi-box-arrow-in-right me-2"></i>Sign In to Dashboard
    </button>
  </form>

  <div class="mt-4">
    <a href="<?= SITE_URL ?>" class="back-link"><i class="bi bi-arrow-left me-1"></i>Back to Website</a>
  </div>
</div>

<script>
function togglePwd() {
  const input = document.getElementById('pwdInput');
  const icon  = document.getElementById('pwdToggleIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
}
</script>
</body>
</html>
