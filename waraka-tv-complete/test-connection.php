<?php
/**
 * Database Connection Test
 * Delete this file after testing
 */

require_once __DIR__ . '/includes/config.php';

try {
    $db = Database::getInstance();
    
    // Test 1: Connection
    echo "✓ Database connected successfully!\n\n";
    
    // Test 2: Check tables
    $stmt = $db->query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?");
    $stmt->execute([DB_NAME]);
    $result = $stmt->fetch();
    echo "✓ Found " . e($result['table_count']) . " tables in database\n\n";
    
    // Test 3: Check users table
    $stmt = $db->query("SELECT COUNT(*) as user_count FROM users");
    $result = $stmt->fetch();
    echo "✓ Users table has " . e($result['user_count']) . " records\n\n";
    
    // Test 4: Check categories
    $stmt = $db->query("SELECT COUNT(*) as cat_count FROM categories");
    $result = $stmt->fetch();
    echo "✓ Categories table has " . e($result['cat_count']) . " records\n";
    
    echo "\n✅ All tests passed! Database connection is working.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . e($e->getMessage());
}
?>
