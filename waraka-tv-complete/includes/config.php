<?php
/**
 * WARAKA TV – Configuration & Database Connection
 * File: includes/config.php
 * 
 * Copy this file and update the credentials before going live.
 * NEVER commit real credentials to version control.
 */

// ============================================================
// ENVIRONMENT
// ============================================================
define('ENVIRONMENT', 'development'); // Use development locally; switch to 'production' for live

// ============================================================
// SITE SETTINGS
// ============================================================
define('SITE_NAME',    'WARAKA TV');
define('SITE_URL',     'https://warakatv.ng');       // No trailing slash
define('SITE_EMAIL',   'news@warakatv.ng');
define('ADMIN_EMAIL',  'admin@warakatv.ng');
define('UPLOAD_DIR',   __DIR__ . '/../uploads/');    // Absolute path
define('UPLOAD_URL',   SITE_URL . '/uploads/');

// ============================================================
// DATABASE CREDENTIALS
// ============================================================
define('DB_HOST',     'localhost');
define('DB_NAME',     'waraka_tv');
define('DB_USER',     'root');        // Change for production
define('DB_PASS',     '');   // Change this!
define('DB_CHARSET',  'utf8mb4');

// ============================================================
// SECURITY
// ============================================================
define('SECRET_KEY',   'change-this-to-a-long-random-secret-key-64chars');
define('SESSION_NAME', 'waraka_session');
define('BCRYPT_COST',   12);

// ============================================================
// FILE UPLOAD LIMITS
// ============================================================
define('MAX_IMAGE_SIZE', 5 * 1024 * 1024);   // 5 MB
define('MAX_VIDEO_SIZE', 200 * 1024 * 1024); // 200 MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
define('ALLOWED_VIDEO_TYPES', ['video/mp4', 'video/webm', 'video/ogg']);

// ============================================================
// ERROR REPORTING
// ============================================================
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/error.log');
}

// ============================================================
// SESSION CONFIGURATION
// ============================================================
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', (ENVIRONMENT === 'production') ? 1 : 0);
ini_set('session.use_strict_mode', 1);
ini_set('session.gc_maxlifetime', 7200); // 2 hours
session_name(SESSION_NAME);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ============================================================
// DATABASE CONNECTION (PDO Singleton)
// ============================================================
class Database {
    private static ?PDO $instance = null;

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Log error, show friendly message
                error_log('Database connection failed: ' . $e->getMessage());
                die(json_encode(['error' => 'Database unavailable. Please try again later.']));
            }
        }
        return self::$instance;
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Sanitize output for HTML context (prevent XSS)
 */
function e(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Generate URL-friendly slug from a title
 */
function slugify(string $text): string {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/[\s-]+/', '-', $text);
    return trim($text, '-');
}

/**
 * Format date for display
 */
function formatDate(string $datetime, string $format = 'd M Y, h:i A'): string {
    return date($format, strtotime($datetime));
}

/**
 * Calculate time ago (e.g. "2 hours ago")
 */
function timeAgo(string $datetime): string {
    $now  = time();
    $then = strtotime($datetime);
    $diff = $now - $then;

    if ($diff < 60)        return 'just now';
    if ($diff < 3600)      return floor($diff / 60) . ' mins ago';
    if ($diff < 86400)     return floor($diff / 3600) . ' hrs ago';
    if ($diff < 2592000)   return floor($diff / 86400) . ' days ago';
    return date('d M Y', $then);
}

/**
 * Number format shorthand (12400 → 12.4K)
 */
function shortNumber(int $n): string {
    if ($n >= 1000000) return round($n / 1000000, 1) . 'M';
    if ($n >= 1000)    return round($n / 1000, 1) . 'K';
    return (string) $n;
}

/**
 * Redirect and exit
 */
function redirect(string $url): void {
    header('Location: ' . $url);
    exit;
}

/**
 * CSRF token generation & validation
 */
function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrf(string $token): bool {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Require admin login
 */
function requireAdmin(): void {
    if (empty($_SESSION['admin_id'])) {
        redirect(SITE_URL . '/admin/login.php');
    }
}

/**
 * Check admin role
 */
function hasRole(string $role): bool {
    $hierarchy = ['reporter' => 1, 'editor' => 2, 'admin' => 3, 'super_admin' => 4];
    $userRole  = $_SESSION['admin_role'] ?? 'reporter';
    return ($hierarchy[$userRole] ?? 0) >= ($hierarchy[$role] ?? 99);
}

/**
 * Handle file upload securely
 */
function uploadFile(array $file, string $subDir = 'news'): string|false {
    $allowedTypes = ALLOWED_IMAGE_TYPES;
    $maxSize      = MAX_IMAGE_SIZE;

    if ($file['error'] !== UPLOAD_ERR_OK)           return false;
    if ($file['size'] > $maxSize)                    return false;
    if (!in_array($file['type'], $allowedTypes))     return false;

    // Verify with finfo (don't trust $_FILES['type'])
    $finfo    = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowedTypes))         return false;

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = bin2hex(random_bytes(8)) . '.' . strtolower($ext);
    $destDir  = UPLOAD_DIR . $subDir . '/';

    if (!is_dir($destDir)) {
        mkdir($destDir, 0755, true);
    }

    $dest = $destDir . $safeName;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        return 'uploads/' . $subDir . '/' . $safeName;
    }

    return false;
}

/**
 * Increment news/video view counter (once per session)
 */
function recordView(string $type, int $id): void {
    $key = "viewed_{$type}_{$id}";
    if (!isset($_SESSION[$key])) {
        $db  = Database::getInstance();
        $tbl = ($type === 'news') ? 'news' : 'videos';
        $stmt = $db->prepare("UPDATE {$tbl} SET views = views + 1 WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION[$key] = true;
    }
}
