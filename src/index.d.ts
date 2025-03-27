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
	 * Whether to add header section
	 * @default true
	 */
	addHeader?: boolean

	/**
	 * Whether to add line numbers
	 * @default false
	 */
	addLines?: boolean

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
	 * Whether to add header section
	 * @default true
	 */
	addHeader?: boolean

	/**
	 * Whether to add line numbers
	 * @default false
	 */
	addLines?: boolean

	/**
	 * Whether to enable live updates
	 * @default false
	 */
	withReload?: boolean

	/**
	 * The language to use for syntax highlighting
	 */
	language?: string

	/**
	 * Theme override for this element ('light', 'dark', or 'auto')
	 */
	theme?: 'light' | 'dark' | 'auto'

	/**
	 * Starting line number for line numbering
	 * @default 1
	 */
	lineStart?: number
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
	 * @param addHeader - Whether to add header section
	 * @param addLines - Whether to add line numbers
	 * @private
	 */
	private static processElement(
		element: HTMLElement,
		autoDetect: boolean,
		addCopyButton: boolean,
		showLanguage: boolean,
		addHeader: boolean,
		addLines: boolean
	): void

	/**
	 * Highlight a single element
	 * @param element - The element to highlight
	 * @param autoDetect - Whether to auto-detect language
	 * @param addCopyButton - Whether to add a copy button
	 * @param showLanguage - Whether to show the language label
	 * @param addHeader - Whether to add header section
	 * @param addLines - Whether to add line numbers
	 * @private
	 */
	private static highlightElement(
		element: HTMLElement,
		autoDetect: boolean,
		addCopyButton: boolean,
		showLanguage: boolean,
		addHeader: boolean,
		addLines: boolean
	): void

	/**
	 * Set up a mutation observer to watch for changes to the code element
	 * @param element - The code element to watch
	 * @param container - The container element
	 * @param autoDetect - Whether to auto-detect language
	 * @param showLanguage - Whether to show the language label
	 * @private
	 */
	private static setupMutationObserver(
		element: HTMLElement,
		container: HTMLElement,
		autoDetect: boolean,
		showLanguage: boolean
	): void

	/**
	 * Create a styled container for code block
	 * @param element - The code element to wrap
	 * @returns The container element
	 * @private
	 */
	private static createCodeContainer(element: HTMLElement): HTMLElement

	/**
	 * Create code header with language/filename label and copy button
	 * @param displayLabel - The text to display (language or filename)
	 * @param code - The code to copy
	 * @param addCopyButton - Whether to add a copy button
	 * @param showLanguage - Whether to show the language label
	 * @returns The header element
	 * @private
	 */
	private static createCodeHeader(
		displayLabel: string | null,
		code: string,
		addCopyButton: boolean,
		showLanguage: boolean
	): HTMLElement

	/**
	 * Create copy button element
	 * @param code - The code to copy
	 * @returns The copy button element
	 * @private
	 */
	private static createCopyButton(code: string): HTMLElement

	/**
	 * Create floating copy button for no-header mode
	 * @param code - The code to copy
	 * @returns The floating copy button element
	 * @private
	 */
	private static createFloatingCopyButton(code: string): HTMLElement

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
	 * Update the line heights for line numbers to match the highlighted code
	 * @param element - The code element
	 * @param lineNumbersWrapper - The line numbers container
	 * @private
	 */
	private static updateLineHeights(element: HTMLElement, lineNumbersWrapper: HTMLElement): void

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
		languageOrFilename: string | null,
		code: string,
		showLanguage: boolean
	): void

	/**
	 * Find the original element for live updates
	 * @param element - The code element
	 * @param container - The container element
	 * @returns The original element or null if not found
	 * @private
	 */
	private static findOriginalElement(
		element: HTMLElement,
		container: HTMLElement
	): HTMLElement | null
}

export default HighlightIt

declare global {
	interface Window {
		HighlightIt: typeof HighlightIt
	}

	interface HTMLElement {
		/**
		 * Stored ResizeObserver for line numbers
		 * @internal
		 */
		_lineNumbersResizeObserver?: ResizeObserver

		/**
		 * Highlight.js observer for the element
		 * @internal
		 */
		_highlightObserver?: MutationObserver
	}

	interface HTMLButtonElement {
		/**
		 * Stored code content for copy buttons
		 * @internal
		 */
		_currentCode?: string

		/**
		 * Backup of the click handler
		 * @internal
		 */
		onclickBackup?: (this: GlobalEventHandlers, ev: MouseEvent) => Promise<void>
	}
}
