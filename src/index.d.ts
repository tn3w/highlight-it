/**
 * HighlightIt - A lightweight syntax highlighting library with themes, line numbers, and copy functionality.
 * Uses highlight.js for code highlighting
 */

/**
 * Configuration options for HighlightIt
 */
interface HighlightItOptions {
	/**
	 * CSS selector for elements to highlight
	 * @default '.highlightit'
	 */
	selector?: string

	/**
	 * Whether to auto-detect language if not specified
	 * @default true
	 */
	autoDetect?: boolean
}

/**
 * HighlightIt class for syntax highlighting
 */
declare class HighlightIt {
	/**
	 * Initialize HighlightIt by finding and highlighting all matching elements
	 * @param options - Configuration options
	 */
	static init(options?: HighlightItOptions): void

	/**
	 * Highlight a single element
	 * @param element - The element to highlight
	 * @param autoDetect - Whether to auto-detect language
	 * @private
	 */
	private static highlightElement(element: HTMLElement, autoDetect: boolean): void

	/**
	 * Get language from filename extension
	 * @param filename - The filename to extract extension from
	 * @returns The language name or null if not determined
	 * @private
	 */
	private static getLanguageFromFilename(filename: string): string | null

	/**
	 * Escape HTML special characters
	 * @param html - The HTML string to escape
	 * @returns The escaped HTML string
	 * @private
	 */
	private static escapeHtml(html: string): string
}

export default HighlightIt

declare global {
	interface Window {
		HighlightIt: typeof HighlightIt
	}
}
