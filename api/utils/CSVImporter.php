<?php
/**
 * CSV Importer Helper
 * Handles CSV file parsing and validation for bulk imports
 */

class CSVImporter {
    private $errors = [];
    private $warnings = [];
    
    /**
     * Parse CSV file and return rows as associative arrays
     * @param string $filePath Path to CSV file
     * @param array $expectedColumns List of expected column names (optional for flexible imports)
     * @param bool $strictMode If true, reject rows with missing expected columns
     * @return array|false Array of rows or false on error
     */
    public function parseCSV($filePath, $expectedColumns = [], $strictMode = false) {
        if (!file_exists($filePath)) {
            $this->errors[] = "CSV file not found";
            return false;
        }
        
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->errors[] = "Unable to open CSV file";
            return false;
        }
        
        // Read header row
        $headers = fgetcsv($handle);
        if (!$headers) {
            $this->errors[] = "CSV file is empty or has no header row";
            fclose($handle);
            return false;
        }
        
        // Clean headers (trim whitespace, convert to lowercase for comparison)
        $headers = array_map(function($h) {
            return trim($h);
        }, $headers);
        
        // Check for expected columns if provided
        if (!empty($expectedColumns) && $strictMode) {
            $missingColumns = array_diff($expectedColumns, $headers);
            if (!empty($missingColumns)) {
                $this->errors[] = "Missing required columns: " . implode(', ', $missingColumns);
                fclose($handle);
                return false;
            }
        }
        
        $rows = [];
        $lineNumber = 1; // Start from 1 (header is line 1)
        
        while (($data = fgetcsv($handle)) !== false) {
            $lineNumber++;
            
            // Skip empty rows
            if (empty(array_filter($data))) {
                $this->warnings[] = "Line $lineNumber: Empty row, skipped";
                continue;
            }
            
            // Create associative array from headers and data
            $row = [];
            foreach ($headers as $index => $header) {
                $row[$header] = isset($data[$index]) ? trim($data[$index]) : null;
            }
            
            // Add line number for error reporting
            $row['_line_number'] = $lineNumber;
            $rows[] = $row;
        }
        
        fclose($handle);
        return $rows;
    }
    
    /**
     * Validate and normalize row data
     * @param array $row Row data
     * @param array $requiredFields Required field names
     * @param array $optionalFields Optional field names (will be set to null if missing)
     * @return array|false Normalized row or false if validation fails
     */
    public function validateRow($row, $requiredFields, $optionalFields = []) {
        $lineNumber = $row['_line_number'] ?? 'unknown';
        $validatedRow = [];
        
        // Check required fields
        foreach ($requiredFields as $field) {
            if (!isset($row[$field]) || trim($row[$field]) === '') {
                $this->errors[] = "Line $lineNumber: Missing required field '$field'";
                return false;
            }
            $validatedRow[$field] = trim($row[$field]);
        }
        
        // Add optional fields
        foreach ($optionalFields as $field) {
            $validatedRow[$field] = isset($row[$field]) && trim($row[$field]) !== '' 
                ? trim($row[$field]) 
                : null;
        }
        
        return $validatedRow;
    }
    
    /**
     * Convert date string to MySQL date format (YYYY-MM-DD)
     * Supports common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
     * @param string $dateString Date string to convert
     * @return string|null MySQL formatted date or null if invalid
     */
    public function parseDate($dateString) {
        if (empty($dateString)) {
            return null;
        }
        
        $dateString = trim($dateString);
        
        // Try common formats
        $formats = [
            'd/m/Y',    // 25/12/2024
            'm/d/Y',    // 12/25/2024
            'Y-m-d',    // 2024-12-25
            'd-m-Y',    // 25-12-2024
            'Y/m/d',    // 2024/12/25
            'd.m.Y',    // 25.12.2024
        ];
        
        foreach ($formats as $format) {
            $date = DateTime::createFromFormat($format, $dateString);
            if ($date && $date->format($format) === $dateString) {
                return $date->format('Y-m-d');
            }
        }
        
        // Try strtotime as fallback
        $timestamp = strtotime($dateString);
        if ($timestamp !== false) {
            return date('Y-m-d', $timestamp);
        }
        
        return null;
    }
    
    /**
     * Parse numeric value (handles different decimal separators)
     * @param string $value Numeric string
     * @return float|null Parsed number or null
     */
    public function parseNumber($value) {
        if (empty($value) || trim($value) === '') {
            return null;
        }
        
        // Remove currency symbols and spaces
        $value = preg_replace('/[^\d.,\-]/', '', $value);
        
        // Handle comma as decimal separator (European format)
        if (strpos($value, ',') !== false && strpos($value, '.') === false) {
            $value = str_replace(',', '.', $value);
        } else {
            // Remove thousands separators (commas in US format)
            $value = str_replace(',', '', $value);
        }
        
        return is_numeric($value) ? (float)$value : null;
    }
    
    /**
     * Get all errors
     * @return array
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * Get all warnings
     * @return array
     */
    public function getWarnings() {
        return $this->warnings;
    }
    
    /**
     * Check if there are any errors
     * @return bool
     */
    public function hasErrors() {
        return !empty($this->errors);
    }
    
    /**
     * Add custom error message
     * @param string $message
     */
    public function addError($message) {
        $this->errors[] = $message;
    }
    
    /**
     * Add custom warning message
     * @param string $message
     */
    public function addWarning($message) {
        $this->warnings[] = $message;
    }
    
    /**
     * Clear all errors and warnings
     */
    public function clearMessages() {
        $this->errors = [];
        $this->warnings = [];
    }
    
    /**
     * Generate CSV template file
     * @param array $columns Column names
     * @param string $filename Output filename
     * @return string CSV content
     */
    public static function generateTemplate($columns, $filename = 'template.csv') {
        $output = fopen('php://temp', 'r+');
        fputcsv($output, $columns);
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);
        
        return $csvContent;
    }
}
