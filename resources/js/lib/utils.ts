import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number | string): string {
    if (bytes == null) return '0 B';
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(numBytes)) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = numBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

/**
 * Fuzzy search function that matches partial strings and handles typos
 * @param searchTerm The search term entered by user
 * @param targetString The string to search in
 * @param threshold Minimum score threshold (0-1, higher = more strict)
 * @returns Score between 0-1, where 1 is perfect match
 */
export function fuzzySearch(searchTerm: string, targetString: string, threshold: number = 0.3): number {
    if (!searchTerm || !targetString) return 0;
    
    const search = searchTerm.toLowerCase().trim();
    const target = targetString.toLowerCase().trim();
    
    // Exact match gets highest score
    if (target === search) return 1;
    
    // Contains match gets high score
    if (target.includes(search)) {
        return 0.8 - (Math.abs(target.length - search.length) / target.length) * 0.3;
    }
    
    // Fuzzy matching using Levenshtein-like algorithm
    const searchLen = search.length;
    const targetLen = target.length;
    
    if (searchLen === 0) return targetLen === 0 ? 1 : 0;
    if (targetLen === 0) return 0;
    
    // Create matrix
    const matrix: number[][] = [];
    for (let i = 0; i <= targetLen; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= searchLen; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= targetLen; i++) {
        for (let j = 1; j <= searchLen; j++) {
            if (target[i - 1] === search[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + 1  // substitution
                );
            }
        }
    }
    
    // Calculate similarity score
    const distance = matrix[targetLen][searchLen];
    const maxLen = Math.max(searchLen, targetLen);
    const similarity = 1 - (distance / maxLen);
    
    return similarity >= threshold ? similarity : 0;
}

/**
 * Filter and sort items using fuzzy search
 * @param items Array of items to search
 * @param searchTerm Search term
 * @param getSearchableText Function to extract searchable text from item
 * @param threshold Minimum similarity threshold
 * @returns Filtered and sorted items
 */
export function fuzzyFilter<T>(
    items: T[],
    searchTerm: string,
    getSearchableText: (item: T) => string,
    threshold: number = 0.3
): T[] {
    if (!searchTerm.trim()) return items;
    
    const results = items
        .map(item => ({
            item,
            score: fuzzySearch(searchTerm, getSearchableText(item), threshold)
        }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(result => result.item);
    
    return results;
}
