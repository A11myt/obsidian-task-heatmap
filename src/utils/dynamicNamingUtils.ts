/**
 * Dynamic naming and templating utilities for daily notes
 * Supports Templater-like syntax for flexible note organization
 */

export interface DateFormatTokens {
	YYYY: string;  // Full year (2025)
	YY: string;    // Short year (25)
	MM: string;    // Month with leading zero (01-12)
	M: string;     // Month without leading zero (1-12)
	DD: string;    // Day with leading zero (01-31)
	D: string;     // Day without leading zero (1-31)
	dddd: string;  // Full weekday name (Monday)
	ddd: string;   // Short weekday name (Mon)
	dd: string;    // Very short weekday (Mo)
	MMMM: string;  // Full month name (January)
	MMM: string;   // Short month name (Jan)
}

/**
 * Get localized weekday names
 */
function getLocalizedWeekdays(locale: string): { full: string[], short: string[], veryShort: string[] } {
	const testDate = new Date(2023, 0, 2); // Monday
	const weekdays: { full: string[], short: string[], veryShort: string[] } = { 
		full: [], 
		short: [], 
		veryShort: [] 
	};
	
	for (let i = 0; i < 7; i++) {
		const currentDate = new Date(testDate);
		currentDate.setDate(testDate.getDate() + i);
		
		weekdays.full.push(currentDate.toLocaleDateString(locale, { weekday: 'long' }));
		weekdays.short.push(currentDate.toLocaleDateString(locale, { weekday: 'short' }));
		
		// For very short, use first 2 characters or predefined mapping
		const shortName = currentDate.toLocaleDateString(locale, { weekday: 'short' });
		weekdays.veryShort.push(shortName.substring(0, 2));
	}
	
	return weekdays;
}

/**
 * Get localized month names
 */
function getLocalizedMonths(locale: string): { full: string[], short: string[] } {
	const testDate = new Date(2023, 0, 1); // January
	const months: { full: string[], short: string[] } = { full: [], short: [] };
	
	for (let i = 0; i < 12; i++) {
		const currentDate = new Date(testDate);
		currentDate.setMonth(i);
		
		months.full.push(currentDate.toLocaleDateString(locale, { month: 'long' }));
		months.short.push(currentDate.toLocaleDateString(locale, { month: 'short' }));
	}
	
	return months;
}

/**
 * Generate all date tokens for a given date with locale support
 */
export function generateDateTokens(date: Date, locale: string = 'de-DE'): DateFormatTokens {
	const year = date.getFullYear();
	const month = date.getMonth(); // 0-based
	const day = date.getDate();
	const weekday = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

	// Get localized names based on the provided locale
	const localizedWeekdays = getLocalizedWeekdays(locale);
	const localizedMonths = getLocalizedMonths(locale);

	return {
		YYYY: year.toString(),
		YY: year.toString().slice(-2),
		MM: (month + 1).toString().padStart(2, '0'),
		M: (month + 1).toString(),
		DD: day.toString().padStart(2, '0'),
		D: day.toString(),
		dddd: localizedWeekdays.full[weekday],
		ddd: localizedWeekdays.short[weekday],
		dd: localizedWeekdays.veryShort[weekday],
		MMMM: localizedMonths.full[month],
		MMM: localizedMonths.short[month]
	};
}

/**
 * Format a date string using dynamic tokens with locale support
 * Supports patterns like: Notes/YYYY/MM/YYYY-MM-DD-dddd
 */
export function formatDynamicPath(pattern: string, date: Date, locale: string = 'de-DE'): string {
	const tokens = generateDateTokens(date, locale);

	// Replace all tokens in a single pass using alternation to avoid
	// already-replaced values being processed again (this caused e.g.
	// the single-letter tokens D/M to replace letters inside month names
	// like "Dec" -> "2ec").
	const tokenKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
	const tokenRegex = new RegExp(`(${tokenKeys.join('|')})`, 'g');

	const result = pattern.replace(tokenRegex, (match) => {
		return tokens[match as keyof DateFormatTokens] ?? match;
	});

	return result;
}

/**
 * Process template content with variables and locale support
 */
export function processTemplate(templateContent: string, date: Date, locale: string = 'de-DE'): string {
	const tokens = generateDateTokens(date, locale);
	
	// Format full date for specified locale
	const fullDate = date.toLocaleDateString(locale, {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
	
	// Format current time
	const currentTime = new Date().toLocaleTimeString(locale, {
		hour: '2-digit',
		minute: '2-digit'
	});
	
	let result = templateContent;
	
	// Replace template variables
	result = result.replace(/\{\{date\}\}/g, fullDate);
	result = result.replace(/\{\{title\}\}/g, fullDate); // Compatibility
	result = result.replace(/\{\{time\}\}/g, currentTime);
	
	// Replace date tokens in template
	const tokenOrder = ['YYYY', 'MMMM', 'MMM', 'dddd', 'ddd', 'MM', 'DD', 'YY', 'dd', 'M', 'D'];
	for (const token of tokenOrder) {
		const regex = new RegExp(`\\{\\{${token}\\}\\}`, 'g');
		result = result.replace(regex, tokens[token as keyof DateFormatTokens]);
	}
	
	return result;
}

/**
 * Get default template content if no template file is specified
 */
export function getDefaultTemplate(): string {
	return `# {{date}}

## Tasks

- [ ] 

## Notes

`;
}

/**
 * Validate if a dynamic path pattern is valid
 */
export function validatePathPattern(pattern: string): boolean {
	// Check for invalid characters in file paths
	const invalidChars = /[<>:"|?*]/;
	if (invalidChars.test(pattern)) {
		return false;
	}
	
	// Must end with .md extension (add if missing)
	if (!pattern.endsWith('.md')) {
		return false;
	}
	
	return true;
}

/**
 * Sanitize path pattern by adding .md extension if missing
 */
export function sanitizePathPattern(pattern: string): string {
	let sanitized = pattern.trim();
	
	// Add .md extension if missing
	if (!sanitized.endsWith('.md')) {
		sanitized += '.md';
	}
	
	return sanitized;
}

/**
 * Create directory path from full file path
 */
export function getDirectoryPath(fullPath: string): string {
	const lastSlash = Math.max(fullPath.lastIndexOf('/'), fullPath.lastIndexOf('\\'));
	return lastSlash > -1 ? fullPath.substring(0, lastSlash) : '';
}

/**
 * Preview example of how a pattern would be formatted
 */
export function previewPattern(pattern: string, date?: Date, locale: string = 'de-DE'): string {
	const testDate = date || new Date();
	return formatDynamicPath(sanitizePathPattern(pattern), testDate, locale);
}