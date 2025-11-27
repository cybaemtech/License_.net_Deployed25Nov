<?php
// Test the actual API response like the browser would see it
$_SERVER['REQUEST_METHOD'] = 'GET';

// Capture the output
ob_start();
include __DIR__ . '/currencies.php';
$output = ob_get_clean();

echo "=== RAW API RESPONSE ===\n";
echo $output . "\n";
echo "\n=== PARSING JSON ===\n";

$data = json_decode($output, true);
if ($data) {
    echo "✅ Valid JSON\n";
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    echo "Total Count: " . ($data['total_count'] ?? 'N/A') . "\n";
    echo "Data Count: " . (isset($data['data']) ? count($data['data']) : 0) . "\n";
    
    if (isset($data['data']) && count($data['data']) > 0) {
        echo "\n=== FIRST 3 CURRENCIES ===\n";
        for ($i = 0; $i < min(3, count($data['data'])); $i++) {
            $curr = $data['data'][$i];
            echo "\nCurrency " . ($i + 1) . ":\n";
            echo "  ID: " . ($curr['id'] ?? 'N/A') . "\n";
            echo "  Code: " . ($curr['code'] ?? 'N/A') . "\n";
            echo "  Name: " . ($curr['name'] ?? 'N/A') . "\n";
            echo "  Symbol: " . ($curr['symbol'] ?? 'N/A') . "\n";
            echo "  Rate: " . ($curr['exchange_rate_to_inr'] ?? 'N/A') . "\n";
            echo "  Default: " . (isset($curr['is_default']) && $curr['is_default'] ? 'YES' : 'NO') . "\n";
        }
    }
} else {
    echo "❌ Invalid JSON\n";
    echo "Error: " . json_last_error_msg() . "\n";
}
?>
