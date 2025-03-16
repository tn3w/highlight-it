/**
 * HighlightIt - A lightweight syntax highlighting library with themes, line numbers, and copy functionality.
 * Uses highlight.js for code highlighting
 */

/**
 * Configuration options for HighlightIt
 */
export interface HighlightItOptions {
	/**
	 * CSS selector for elements to highlight
	 * @default '.highlight-it'
	 */
	selector?: string

	/**
	 * Whether to auto-detect language if not specified
	 * @default true
	 */
	autoDetect?: boolean

	/**
	 * Whether to add a copy button to code blocks
	 * @default true
	 */
	addCopyButton?: boolean

	/**
	 * Whether to show the language label
	 * @default true
	 */
	showLanguage?: boolean

	/**
	 * Theme to use ('light', 'dark', or 'auto')
	 * @default 'auto'
	 */
	theme?: 'light' | 'dark' | 'auto'

	/**
	 * Debounce time in ms for live updates (lower values = more responsive)
	 * @default 50
	 */
	debounceTime?: number
}

/**
 * Options for highlighting a single element
 */
export interface HighlightElementOptions {
	/**
	 * Whether to auto-detect language if not specified
	 * @default true
	 */
	autoDetect?: boolean

	/**
	 * Whether to add a copy button to code blocks
	 * @default true
	 */
	addCopyButton?: boolean

	/**
	 * Whether to show the language label
	 * @default true
	 */
	showLanguage?: boolean

	/**
	 * Whether to add line numbers
	 * @default false
	 */
	withLines?: boolean

	/**
	 * Whether to enable live updates
	 * @default false
	 */
	withReload?: boolean

	/**
	 * Whether to hide the header
	 * @default false
	 */
	noHeader?: boolean

	/**
	 * The language to use for syntax highlighting
	 */
	language?: string

	/**
	 * Theme override for this element ('light', 'dark', or 'auto')
	 */
	theme?: 'light' | 'dark' | 'auto'
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
	 * Highlight a new element that wasn't present when the library was initialized
	 * @param element - The element to highlight
	 * @param options - Configuration options
	 * @returns The highlighted element container
	 */
	static highlight(element: HTMLElement, options?: HighlightElementOptions): HTMLElement

	/**
	 * Apply global theme to the document root
	 * @param theme - Theme to apply ('light', 'dark', or 'auto')
	 * @private
	 */
	private static applyGlobalTheme(theme: string): void

	/**
	 * Process an element for highlighting
	 * @param element - The element to process
	 * @param autoDetect - Whether to auto-detect language
	 * @param addCopyButton - Whether to add a copy button
	 * @param showLanguage - Whether to show the language label
	 * @private
	 */
	private static processElement(
		element: HTMLElement,
		autoDetect: boolean,
		addCopyButton: boolean,
		showLanguage: boolean
	): void

	/**
	 * Highlight a single element
	 * @param element - The element to highlight
	 * @param autoDetect - Whether to auto-detect language
	 * @param addCopyButton - Whether to add a copy button
	 * @param showLanguage - Whether to show the language label
	 * @private
	 */
	private static highlightElement(
		element: HTMLElement,
		autoDetect: boolean,
		addCopyButton: boolean,
		showLanguage: boolean
	): void

	/**
	 * Set up a mutation observer to watch for changes to the code element
	 * @param element - The code element to watch
	 * @param container - The container element
	 * @param autoDetect - Whether to auto-detect language
	 * @param addCopyButton - Whether to add a copy button
	 * @param showLanguage - Whether to show the language label
	 * @private
	 */
	private static setupMutationObserver(
		element: HTMLElement,
		container: HTMLElement,
		autoDetect: boolean,
		addCopyButton: boolean,
		showLanguage: boolean
	): void

	/**
	 * Get language from filename extension
	 * @param filename - The filename to extract extension from
	 * @returns The language name or null if not determined
	 * @private
	 */
	private static getLanguageFromFilename(filename: string): string | null

	/**
	 * Auto-detect language with priority given to popular languages
	 * @param code - The code to detect the language of
	 * @returns The highlight.js result object
	 * @private
	 */
	private static autoDetectLanguage(code: string): { language: string; value: string }

	/**
	 * Escape HTML special characters
	 * @param html - The HTML string to escape
	 * @returns The escaped HTML string
	 * @private
	 */
	private static escapeHtml(html: string): string

	/**
	 * Add line numbers to a code element
	 * @param element - The code element to add line numbers to
	 * @param code - The original code content
	 * @private
	 */
	private static addLineNumbers(element: HTMLElement, code: string): void

	/**
	 * Re-highlight an element with updated content
	 * @param element - The element to re-highlight
	 * @param container - The container element
	 * @param languageOrFilename - The language or filename
	 * @param code - The code content
	 * @param showLanguage - Whether to show the language label
	 * @private
	 */
	private static rehighlightElement(
		element: HTMLElement,
		container: HTMLElement,
		languageOrFilename: string,
		code: string,
		showLanguage: boolean
	): void
}

export default HighlightIt

declare global {
	interface Window {
		HighlightIt: typeof HighlightIt
	}
}
