<?php
/**
 * Exam Pattern Analyzer (EPA) - Core Helper Functions
 * Developed by Mehedi364
 */

declare(strict_types=1);

// Bengali to English digit converter
function bnToEnDigits(string $str): string {
    $bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    $en = ['0','1','2','3','4','5','6','7','8','9'];
    return str_replace($bn, $en, $str);
}

// English to Bengali digit converter
function enToBnDigits(string|int|float $str): string {
    $bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    $en = ['0','1','2','3','4','5','6','7','8','9'];
    return str_replace($en, $bn, (string)$str);
}

// Text normalizer for exact duplicate detection
function normalizeText(string $text): string {
    $text = mb_strtolower($text, 'UTF-8');
    // Remove punctuation
    $text = preg_replace('/[।\?\!\.\,\:\;\"\'\(\)\-\—\–\[\]\{\}\/\\`~@#$%^&*+=<>]/u', ' ', $text);
    // Remove invisible characters
    $text = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $text);
    // Collapse whitespace
    $text = preg_replace('/\s+/u', ' ', $text);
    return trim($text);
}

// Calculate token similarity percentage (0-100)
function calculateTokenSimilarity(string $text1, string $text2): int {
    $norm1 = normalizeText($text1);
    $norm2 = normalizeText($text2);

    if (empty($norm1) || empty($norm2)) return 0;
    if ($norm1 === $norm2) return 100;

    $stopWords = ['কি', 'কাকে', 'বলে', 'বলতে', 'কী', 'বোঝ', 'বুঝায়', 'আলোচনা', 'কর', 'করো', 'ব্যাখ্যা', 'বর্ণনা', 'দাও', 'কত', 'কোন', 'কোথায়', 'কে', 'কবে', 'কেন', 'এবং', 'ও', 'বা'];
    
    $tokens1 = array_filter(explode(' ', $norm1), fn($w) => mb_strlen($w, 'UTF-8') > 1 && !in_array($w, $stopWords, true));
    $tokens2 = array_filter(explode(' ', $norm2), fn($w) => mb_strlen($w, 'UTF-8') > 1 && !in_array($w, $stopWords, true));

    if (empty($tokens1) || empty($tokens2)) return 0;

    $set1 = array_unique($tokens1);
    $set2 = array_unique($tokens2);

    $intersection = array_intersect($set1, $set2);
    $intersectionCount = count($intersection);
    $unionCount = count(array_unique(array_merge($set1, $set2)));

    if ($unionCount === 0) return 0;

    $jaccard = $intersectionCount / $unionCount;
    $overlap = $intersectionCount / min(count($set1), count($set2));
    $score = ($jaccard * 0.4 + $overlap * 0.6) * 100;

    return (int)round($score);
}

// Audit logger
function logAudit(PDO $pdo, ?int $userId, string $action, ?string $entityType = null, ?int $entityId = null, ?string $details = null): void {
    try {
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)");
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt->execute([$userId, $action, $entityType, $entityId, $details, $ip]);
    } catch (Exception $e) {
        error_log("Audit log failed: " . $e->getMessage());
    }
}

// JSON Response helper
function sendJsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
