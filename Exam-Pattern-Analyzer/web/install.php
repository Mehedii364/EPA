<?php
/**
 * Exam Pattern Analyzer (EPA) - Web Installer
 * Developed by Mehedi364
 */

declare(strict_types=1);

$lockFile = __DIR__ . '/install.lock';
if (file_exists($lockFile)) {
    die("<h1>Installer Locked</h1><p>Exam Pattern Analyzer is already installed. To re-install, delete <code>install.lock</code>.</p>");
}

$errors = [];
$success = false;

// Step 1: Check PHP Version & Extensions
$phpVersionOk = version_compare(PHP_VERSION, '8.0.0', '>=');
$extensions = [
    'pdo' => extension_loaded('pdo'),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'mbstring' => extension_loaded('mbstring'),
    'json' => extension_loaded('json')
];
$allExtensionsOk = !in_array(false, $extensions, true);

// Handle installation POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $phpVersionOk && $allExtensionsOk) {
    $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
    $dbPort = trim($_POST['db_port'] ?? '3306');
    $dbName = trim($_POST['db_name'] ?? '');
    $dbUser = trim($_POST['db_user'] ?? '');
    $dbPass = $_POST['db_pass'] ?? '';
    $adminEmail = trim($_POST['admin_email'] ?? 'admin@example.com');
    $adminPass = $_POST['admin_pass'] ?? 'admin123';

    if (empty($dbName) || empty($dbUser)) {
        $errors[] = "Database name and username are required.";
    } else {
        try {
            // Test connection
            $dsn = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
            $pdo = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // Create DB if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `{$dbName}`");

            // Execute schema.sql
            $schemaFile = __DIR__ . '/../database/schema.sql';
            if (file_exists($schemaFile)) {
                $schemaSql = file_get_contents($schemaFile);
                $pdo->exec($schemaSql);
            }

            // Execute seed.sql
            $seedFile = __DIR__ . '/../database/seed.sql';
            if (file_exists($seedFile)) {
                $seedSql = file_get_contents($seedFile);
                $pdo->exec($seedSql);
            }

            // Update Admin User
            $adminHash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
            $stmt = $pdo->prepare("UPDATE users SET email = ?, password_hash = ? WHERE id = 1");
            $stmt->execute([$adminEmail, $adminHash]);

            // Save config
            $configContent = "<?php\nreturn " . var_export([
                'db_host' => $dbHost,
                'db_port' => $dbPort,
                'db_name' => $dbName,
                'db_user' => $dbUser,
                'db_pass' => $dbPass,
                'installed_at' => date('Y-m-d H:i:s')
            ], true) . ";\n";
            file_put_contents(__DIR__ . '/config/config.php', $configContent);

            // Lock installer
            file_put_contents($lockFile, "Installed on " . date('Y-m-d H:i:s'));
            $success = true;

        } catch (PDOException $e) {
            $errors[] = "MySQL Connection failed: " . $e->getMessage();
        } catch (Exception $e) {
            $errors[] = "Installation failed: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EPA Installer - Exam Pattern Analyzer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; background: #e8ecf4; color: #1e293b; padding: 24px; margin: 0; }
    .card { max-width: 600px; margin: 30px auto; background: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    h1 { color: #1e3a8a; margin-top: 0; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.85rem; }
    .status-ok { background: #dcfce7; color: #15803d; }
    .status-bad { background: #fee2e2; color: #b91c1c; }
    .input-group { margin-bottom: 14px; }
    label { display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.9rem; }
    input { width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; }
    button { background: #2563eb; color: #fff; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; font-size: 1rem; }
    .alert-error { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 16px; color: #991b1b; }
    .alert-success { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; color: #166534; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Exam Pattern Analyzer (EPA)</h1>
    <p><strong>Brand:</strong> Developed by Mehedi364 | <strong>Tagline:</strong> Analyze. Understand. Practice.</p>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">

    <?php if ($success): ?>
      <div class="alert-success">
        <h3>🎉 Installation Successful!</h3>
        <p>Database tables and seed data created. Installer has been locked.</p>
        <p><a href="index.php" style="color: #15803d; font-weight: bold; text-decoration: underline;">Launch Exam Pattern Analyzer Application &rarr;</a></p>
      </div>
    <?php else: ?>
      <?php if (!empty($errors)): ?>
        <div class="alert-error">
          <?php foreach ($errors as $err): ?>
            <div>&bull; <?= htmlspecialchars($err) ?></div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <h3>1. Server Compatibility Checks</h3>
      <p>PHP Version: <?= PHP_VERSION ?> 
        <span class="status-badge <?= $phpVersionOk ? 'status-ok' : 'status-bad' ?>">
          <?= $phpVersionOk ? '✓ PHP 8+ OK' : '✗ Requires PHP 8.0+' ?>
        </span>
      </p>

      <ul>
        <?php foreach ($extensions as $ext => $loaded): ?>
          <li>
            Extension <code><?= $ext ?></code>: 
            <span class="status-badge <?= $loaded ? 'status-ok' : 'status-bad' ?>">
              <?= $loaded ? '✓ Loaded' : '✗ Missing' ?>
            </span>
          </li>
        <?php endforeach; ?>
      </ul>

      <?php if ($phpVersionOk && $allExtensionsOk): ?>
        <h3>2. MySQL Database Configuration</h3>
        <form method="POST">
          <div class="input-group">
            <label>Database Host</label>
            <input type="text" name="db_host" value="127.0.0.1" required>
          </div>
          <div class="input-group">
            <label>Database Port</label>
            <input type="text" name="db_port" value="3306" required>
          </div>
          <div class="input-group">
            <label>Database Name</label>
            <input type="text" name="db_name" value="exam_pattern_analyzer" required>
          </div>
          <div class="input-group">
            <label>Database Username</label>
            <input type="text" name="db_user" value="root" required>
          </div>
          <div class="input-group">
            <label>Database Password</label>
            <input type="password" name="db_pass" placeholder="Leave empty if none">
          </div>

          <h3>3. Admin Credentials</h3>
          <div class="input-group">
            <label>Admin Email</label>
            <input type="email" name="admin_email" value="admin@epa.wafazone.site" required>
          </div>
          <div class="input-group">
            <label>Admin Password</label>
            <input type="password" name="admin_pass" value="admin123" required>
          </div>

          <button type="submit">Run Complete Installation</button>
        </form>
      <?php else: ?>
        <p style="color: #b91c1c;">Please resolve server requirement errors before installing.</p>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</body>
</html>
