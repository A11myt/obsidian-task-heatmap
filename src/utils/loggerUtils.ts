/**
 * Logging utilities for debugging and monitoring
 */

export interface Logger {
	info: (message: string, ...args: any[]) => void;
	success: (message: string, ...args: any[]) => void;
	warning: (message: string, ...args: any[]) => void;
	error: (message: string, ...args: any[]) => void;
	debug: (message: string, data?: any) => void;
}

/**
 * Create a logger with a specific prefix
 */
export function createLogger(prefix: string): Logger {
	return {
		info: (message: string, ...args: any[]) => {
			console.log(`ℹ️ [${prefix}] ${message}`, ...args);
		},
		
		success: (message: string, ...args: any[]) => {
			console.log(`✅ [${prefix}] ${message}`, ...args);
		},
		
		warning: (message: string, ...args: any[]) => {
			console.warn(`⚠️ [${prefix}] ${message}`, ...args);
		},
		
		error: (message: string, ...args: any[]) => {
			console.error(`❌ [${prefix}] ${message}`, ...args);
		},
		
		debug: (message: string, data?: any) => {
			if (data !== undefined) {
				console.log(`🔍 [${prefix}] ${message}`, data);
			} else {
				console.log(`🔍 [${prefix}] ${message}`);
			}
		}
	};
}
