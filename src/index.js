/**
 * HighlightIt - A lightweight syntax highlighting library with themes, line numbers, and copy functionality.
 * Uses highlight.js for code highlighting
 */

import './styles.css'
import polyfills from './polyfills'
import cache from './cache'

import hljs from 'highlight.js'

/**
 * HighlightIt class for syntax highlighting
 */
class HighlightIt {
	/**
	 * Initialize HighlightIt by finding and highlighting all matching elements
	 * @param {Object} options - Configuration options
	 * @param {string} [options.selector='.highlightit'] - CSS selector for elements to highlight
	 * @param {boolean} [options.autoDetect=true] - Whether to auto-detect language if not specified
	 * @param {boolean} [options.addCopyButton=true] - Whether to add a copy button to code blocks
	 * @param {boolean} [options.showLanguage=true] - Whether to show the language label
	 * @param {boolean} [options.addHeader=true] - Whether to add the header section to code blocks
	 * @param {boolean} [options.addLines=false] - Whether to add line numbers to code blocks
	 * @param {string} [options.theme='auto'] - Theme to use ('light', 'dark', or 'auto')
	 * @param {number} [options.debounceTime=50] - Debounce time in ms for live updates (lower values = more responsive)
	 */
	static init(options = {}) {
		const {
			selector = '.highlight-it',
			autoDetect = true,
			addCopyButton = true,
			showLanguage = true,
			addHeader = true,
			addLines = false,
			theme = 'auto',
			debounceTime = 50
		} = options

		this.debounceTime = debounceTime
		this.applyGlobalTheme(theme)

		this.isTouchDevice = polyfills.supports.touch

		if (this.isTouchDevice) {
			polyfills.classList.add(document.documentElement, 'highlightit-touch-device')
		}

		const elements = document.querySelectorAll(`${selector}:not(.highlightit-original)`)

		const chunkSize = 50
		const processChunk = (startIndex) => {
			const endIndex = Math.min(startIndex + chunkSize, elements.length)
			for (let i = startIndex; i < endIndex; i++) {
				this.processElement(
					elements[i],
					autoDetect,
					addCopyButton,
					showLanguage,
					addHeader,
					addLines
				)
			}
			if (endIndex < elements.length) {
				polyfills.requestAnimationFrame(() => processChunk(endIndex))
			}
		}

		processChunk(0)
		this._initialized = true
	}

	/**
	 * Process an element for highlighting, handling both single and nested element structures
	 * @param {HTMLElement} element - The element to process
	 * @param {boolean} autoDetect - Whether to auto-detect language
	 * @param {boolean} addCopyButton - Whether to add a copy button
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @param {boolean} addHeader - Whether to add header section
	 * @param {boolean} addLines - Whether to add line numbers
	 * @private
	 */
	static processElement(element, autoDetect, addCopyButton, showLanguage, addHeader, addLines) {
		let codeElement
		let preElement
		let originalElement = null
		const withLiveUpdates = element.dataset.withReload !== undefined

		if (element.textContent) {
			element.textContent = element.textContent.trim()
		}

		if (
			element.tagName.toLowerCase() === 'code' &&
			element.parentElement.tagName.toLowerCase() === 'pre'
		) {
			codeElement = element
			preElement = element.parentElement

			if (withLiveUpdates) {
				const uniqueId = 'highlightit-id-' + Math.random().toString(36).substr(2, 9)

				originalElement = document.createElement('pre')
				const originalCodeElement = document.createElement('code')

				originalCodeElement.textContent = element.textContent || ''

				originalElement.classList.add('highlightit-original')

				if (preElement.id) {
					originalElement.id = preElement.id
					preElement.setAttribute('data-original-id', preElement.id)
					preElement.id = preElement.id + '-highlighted'
				}

				originalElement.setAttribute('data-highlightit-id', uniqueId)
				originalElement.style.display = 'none'

				if (element.dataset.language) {
					originalCodeElement.dataset.language = element.dataset.language
				}

				originalElement.appendChild(originalCodeElement)

				preElement.dataset.linkedOriginal = uniqueId

				preElement.classList.add('highlightit-streaming-target')

				preElement.parentNode.insertBefore(originalElement, preElement)
			}
		} else {
			const content = element.textContent || ''

			if (withLiveUpdates) {
				const uniqueId = 'highlightit-id-' + Math.random().toString(36).substr(2, 9)

				originalElement = document.createElement('pre')
				const originalCodeElement = document.createElement('code')

				originalCodeElement.textContent = content
				originalElement.appendChild(originalCodeElement)

				originalElement.classList.add('highlightit-original')

				if (element.id) {
					originalElement.id = element.id
					element.setAttribute('data-original-id', element.id)
					element.id = element.id + '-highlighted'
				}

				originalElement.setAttribute('data-highlightit-id', uniqueId)
				originalElement.style.display = 'none'

				if (element.dataset.language) {
					originalCodeElement.dataset.language = element.dataset.language
				}

				element.parentNode.insertBefore(originalElement, element)

				element.setAttribute('data-linked-original', uniqueId)
			}

			const container = document.createElement('div')

			if (element.className.includes('highlight-it')) {
				container.className = 'highlight-it highlightit-container'
			} else {
				container.className = element.className
			}

			preElement = document.createElement('pre')
			codeElement = document.createElement('code')

			codeElement.textContent = content.trim()

			for (const key in element.dataset) {
				container.dataset[key] = element.dataset[key]

				if (key === 'language') {
					codeElement.dataset.language = element.dataset[key]
					codeElement.className = `language-${element.dataset[key]}`
				}

				if (key === 'withLines') {
					container.classList.add('highlightit-with-lines')
				}

				if (key === 'noHeader') {
					container.classList.add('highlightit-no-header')
				}
			}

			preElement.appendChild(codeElement)
			container.appendChild(preElement)

			element.parentNode.replaceChild(container, element)
			element = codeElement
		}

		if (addLines || element.dataset.withLines !== undefined) {
			const container = this.createCodeContainer(element)
			container.classList.add('highlightit-with-lines')
		}

		this.highlightElement(element, autoDetect, addCopyButton, showLanguage, addHeader, addLines)
	}

	/**
	 * Apply global theme to the document root
	 * @param {string} theme - Theme to apply ('light', 'dark', or 'auto')
	 * @private
	 */
	static applyGlobalTheme(theme) {
		document.documentElement.classList.remove(
			'highlightit-theme-light',
			'highlightit-theme-dark',
			'highlightit-theme-auto'
		)

		if (['light', 'dark', 'auto'].includes(theme)) {
			document.documentElement.classList.add(`highlightit-theme-${theme}`)
		} else {
			document.documentElement.classList.add('highlightit-theme-auto')
		}
	}

	/**
	 * Highlight a single element
	 * @param {HTMLElement} element - The code element to highlight
	 * @param {boolean} autoDetect - Whether to auto-detect language
	 * @param {boolean} addCopyButton - Whether to add a copy button
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @param {boolean} addHeader - Whether to add header section
	 * @param {boolean} addLines - Whether to add line numbers
	 * @private
	 *
	 * The element can have various data attributes:
	 * - data-language: The programming language for syntax highlighting
	 * - data-filename: Filename to display (also used to detect language)
	 * - data-theme: Override global theme for this element ('light', 'dark', 'auto')
	 * - data-with-lines: Add line numbers to the code block
	 * - data-no-header: Hide the header (language label and copy button)
	 * - data-no-copy: Hide the copy button
	 * - data-with-reload: Enable live updates - code will be rehighlighted automatically when content changes
	 */
	static highlightElement(element, autoDetect, addCopyButton, showLanguage, addHeader, addLines) {
		const container = this.createCodeContainer(element)

		const code = (element.textContent || '').trim()

		let language = null
		let displayLabel = null
		let filename = null

		const elementDataset = element.dataset
		const containerDataset = container.dataset

		const noHeader =
			!addHeader ||
			elementDataset.noHeader !== undefined ||
			containerDataset.noHeader !== undefined
		const withLines =
			addLines ||
			elementDataset.withLines !== undefined ||
			containerDataset.withLines !== undefined
		const withLiveUpdates =
			elementDataset.withReload !== undefined || containerDataset.withReload !== undefined
		const noCopy = elementDataset.noCopy !== undefined || containerDataset.noCopy !== undefined

		const shouldAddCopyButton = addCopyButton && !noCopy

		if (elementDataset.language) {
			language = elementDataset.language
			displayLabel = language
		} else if (containerDataset.language) {
			language = containerDataset.language
			displayLabel = language
		}

		if (elementDataset.filename) {
			filename = elementDataset.filename
			language = this.getLanguageFromFilename(filename)
			displayLabel = filename
		} else if (containerDataset.filename) {
			filename = containerDataset.filename
			language = this.getLanguageFromFilename(filename)
			displayLabel = filename
		}

		if (elementDataset.theme) {
			const elementTheme = elementDataset.theme.toLowerCase()
			if (['light', 'dark', 'auto'].includes(elementTheme)) {
				container.classList.add(`highlightit-theme-${elementTheme}`)
			}
		} else if (containerDataset.theme) {
			const elementTheme = containerDataset.theme.toLowerCase()
			if (['light', 'dark', 'auto'].includes(elementTheme)) {
				container.classList.add(`highlightit-theme-${elementTheme}`)
			}
		}

		if ((showLanguage || shouldAddCopyButton) && addHeader && !noHeader) {
			const header = this.createCodeHeader(
				displayLabel,
				code,
				shouldAddCopyButton,
				showLanguage
			)
			container.prepend(header)
		} else if (noHeader) {
			container.classList.add('highlightit-no-header')
			if (shouldAddCopyButton) {
				const floatingCopy = this.createFloatingCopyButton(code)
				container.appendChild(floatingCopy)
			}
		}

		if (withLines) {
			container.classList.add('highlightit-with-lines')
		}

		if (withLiveUpdates) {
			this.setupMutationObserver(
				element,
				container,
				autoDetect,
				showLanguage
			)
		}

		if (!language && autoDetect) {
			const result = this.autoDetectLanguage(code)
			language = result.language

			element.innerHTML = result.value
			element.classList.add(`language-${language || 'unknown'}`)

			if (withLines) {
				this.addLineNumbers(element, code)
			}

			if (showLanguage && !noHeader && !displayLabel) {
				const header = container.querySelector('.highlightit-header')
				if (header) {
					const languageLabel = header.querySelector('.highlightit-language')
					if (!languageLabel && language) {
						const newLanguageLabel = document.createElement('span')
						newLanguageLabel.className = 'highlightit-language'
						newLanguageLabel.textContent = language
						header.insertBefore(newLanguageLabel, header.firstChild)
					} else if (languageLabel && language) {
						languageLabel.textContent = language
					}
				}
			}

			return
		}

		if (language) {
			try {
				const result = hljs.highlight(code, { language })
				element.innerHTML = result.value
				element.classList.add(`language-${language}`)

				if (withLines) {
					this.addLineNumbers(element, code)
				}
			} catch {
				if (autoDetect) {
					const result = this.autoDetectLanguage(code)
					element.innerHTML = result.value
					element.classList.add(`language-${result.language || 'unknown'}`)

					if (withLines) {
						this.addLineNumbers(element, code)
					}

					if (showLanguage && !noHeader) {
						const header = container.querySelector('.highlightit-header')
						if (header) {
							const languageLabel = header.querySelector('.highlightit-language')
							if (languageLabel && result.language) {
								languageLabel.textContent = result.language
							}
						}
					}
				}
			}
		} else {
			element.innerHTML = `${this.escapeHtml(code)}`

			if (withLines) {
				this.addLineNumbers(element, code)
			}
		}
	}

	/**
	 * Set up a mutation observer to watch for changes to the code element
	 * @param {HTMLElement} element - The code element to watch
	 * @param {HTMLElement} container - The container element
	 * @param {boolean} autoDetect - Whether to auto-detect language
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @private
	 */
	static setupMutationObserver(element, container, autoDetect, showLanguage) {
		if (!polyfills.supports.MutationObserver) {
			return
		}

		const debounceTime = this.debounceTime || 30
		let timeout = null

		const originalElement = this.findOriginalElement(element, container)
		const elementToWatch = originalElement || element
		const targetElement = element
		const language =
			polyfills.dataset.get(element, 'language') ||
			(element.className.match(/language-(\w+)/) || [])[1] ||
			null

		const rehighlight = () => {
			const originalCode = elementToWatch.querySelector('code') || elementToWatch
			const code = originalCode.textContent.trim()
			if (!code) return

			if (!language && autoDetect) {
				const result = this.autoDetectLanguage(code)
				targetElement.innerHTML = result.value
				polyfills.classList.add(targetElement, `language-${result.language || 'unknown'}`)

				if (showLanguage && result.language) {
					const header = container.querySelector('.highlightit-header')
					if (header) {
						const languageLabel = header.querySelector('.highlightit-language')
						if (languageLabel) {
							languageLabel.textContent = result.language
						}
					}
				}
			} else {
				this.rehighlightElement(targetElement, container, language, code, showLanguage)
				polyfills.classList.add(targetElement, `language-${language || 'unknown'}`)
			}

			if (polyfills.classList.contains(container, 'highlightit-with-lines')) {
				this.addLineNumbers(targetElement, code)
			}
		}

		const observer = new MutationObserver(() => {
			if (timeout) clearTimeout(timeout)
			timeout = setTimeout(() => {
				rehighlight()
				timeout = null
			}, debounceTime)
		})

		observer.observe(elementToWatch, {
			characterData: true,
			childList: true,
			subtree: true
		})

		elementToWatch._highlightObserver = observer
	}

	/**
	 * Create a styled container for code block
	 * @param {HTMLElement} element - The code element to wrap
	 * @returns {HTMLElement} - The container element
	 * @private
	 */
	static createCodeContainer(element) {
		const preElement = element.parentElement

		if (
			preElement.parentElement &&
			preElement.parentElement.classList.contains('highlightit-container')
		) {
			return preElement.parentElement
		}

		const container = document.createElement('div')
		container.className = 'highlightit-container'

		if (preElement.dataset && preElement.dataset.linkedOriginal) {
			container.dataset.linkedOriginal = preElement.dataset.linkedOriginal
		} else if (preElement.hasAttribute('data-linked-original')) {
			container.setAttribute(
				'data-linked-original',
				preElement.getAttribute('data-linked-original')
			)
			preElement.removeAttribute('data-linked-original')
		}

		if (preElement.hasAttribute('data-original-id')) {
			container.setAttribute('data-original-id', preElement.getAttribute('data-original-id'))
		}

		preElement.parentNode.insertBefore(container, preElement)
		container.appendChild(preElement)

		return container
	}

	/**
	 * Create code header with language/filename label and copy button
	 * @param {string} displayLabel - The text to display (language or filename)
	 * @param {string} code - The code to copy
	 * @param {boolean} addCopyButton - Whether to add a copy button
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @returns {HTMLElement} - The header element
	 * @private
	 */
	static createCodeHeader(displayLabel, code, addCopyButton, showLanguage) {
		const header = document.createElement('div')
		header.className = 'highlightit-header'

		if (showLanguage && displayLabel) {
			const labelElement = document.createElement('span')
			labelElement.className = 'highlightit-language'
			labelElement.textContent = displayLabel
			header.appendChild(labelElement)
		}

		if (addCopyButton) {
			const copyButton = this.createCopyButton(code)
			header.appendChild(copyButton)
		}

		return header
	}

	/**
	 * Create copy button element
	 * @param {string} code - The code to copy
	 * @returns {HTMLElement} - The copy button element
	 * @private
	 */
	static createCopyButton(code) {
		const copyButton = document.createElement('button')
		copyButton.className = 'highlightit-copy'
		copyButton.setAttribute('aria-label', 'Copy code')
		copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="highlightit-copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="highlightit-check-icon" style="display: none;"><polyline points="20 6 9 17 4 12"></polyline></svg>`

		copyButton.addEventListener('click', async () => {
			const codeToCopy = code.trim()
			const success = await polyfills.copyToClipboard(codeToCopy)

			if (success) {
				polyfills.classList.add(copyButton, 'copied')
				copyButton.querySelector('.highlightit-copy-icon').style.display = 'none'
				copyButton.querySelector('.highlightit-check-icon').style.display = 'block'

				setTimeout(() => {
					polyfills.classList.remove(copyButton, 'copied')
					copyButton.querySelector('.highlightit-copy-icon').style.display = 'block'
					copyButton.querySelector('.highlightit-check-icon').style.display = 'none'
				}, 2000)
			} else {
				console.warn('Failed to copy code')
			}
		})

		return copyButton
	}

	/**
	 * Create floating copy button for no-header mode
	 * @param {string} code - The code to copy
	 * @returns {HTMLElement} - The floating copy button element
	 * @private
	 */
	static createFloatingCopyButton(code) {
		const copyButton = this.createCopyButton(code)
		copyButton.className += ' highlightit-floating-copy'

		if (this.isTouchDevice) {
			copyButton.style.opacity = '1'
		}

		return copyButton
	}

	/**
	 * Get language from filename extension
	 * @param {string} filename - The filename to extract extension from
	 * @returns {string|null} - The language name or null if not determined
	 * @private
	 */
	static getLanguageFromFilename(filename) {
		const extension = filename.split('.').pop().toLowerCase()
		return cache.extensionMap.get(extension) || null
	}

	/**
	 * Auto-detect language with priority given to popular languages
	 * @param {string} code - The code to detect the language of
	 * @returns {Object} - The highlight.js result object with language and value properties
	 * @private
	 */
	static autoDetectLanguage(code) {
		const result = hljs.highlightAuto(code, Array.from(cache.popularLanguages))
		return result.language ? result : hljs.highlightAuto(code)
	}

	/**
	 * Escape HTML special characters
	 * @param {string} html - The HTML string to escape
	 * @returns {string} - The escaped HTML string
	 * @private
	 */
	static escapeHtml(html) {
		return html.replace(/[&<>"'`=/]/g, (char) => cache.htmlEscapes.get(char))
	}

	/**
	 * Add line numbers to a code element
	 * @param {HTMLElement} element - The code element to add line numbers to
	 * @param {string} code - The original code content
	 * @private
	 */
	static addLineNumbers(element, code) {
		const preElement = element.parentElement
		if (preElement.querySelector('.highlightit-line-numbers')) return

		const lines = code.trim().split('\n')
		const lineCount = lines.length

		const lineNumbersWrapper = document.createElement('div')
		lineNumbersWrapper.className = 'highlightit-line-numbers'

		const fragment = document.createDocumentFragment()
		for (let i = 1; i <= lineCount; i++) {
			const span = document.createElement('span')
			span.className = 'highlightit-line-number'
			span.textContent = i
			fragment.appendChild(span)
		}
		lineNumbersWrapper.appendChild(fragment)

		polyfills.classList.add(preElement, 'highlightit-has-line-numbers')
		preElement.insertBefore(lineNumbersWrapper, preElement.firstChild)

		const resizeObserver = new polyfills.ResizeObserver((entries) => {
			const element = entries[0].target
			const codeHeight = element.offsetHeight
			const renderedLineCount = element.innerHTML.split('\n').length
			const lineHeight = codeHeight / renderedLineCount

			const lineNumbers = lineNumbersWrapper.querySelectorAll('.highlightit-line-number')
			lineNumbers.forEach((lineNumber) => {
				lineNumber.style.height = `${lineHeight}px`
			})
		})

		resizeObserver.observe(element)
	}

	/**
	 * Rehighlight an element with updated content
	 * @param {HTMLElement} element - The code element to rehighlight
	 * @param {HTMLElement} container - The container element
	 * @param {string} languageOrFilename - The language or filename to use
	 * @param {string} code - The code content
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @private
	 */
	static rehighlightElement(element, container, languageOrFilename, code, showLanguage) {
		const cleanedCode = code.trim()
		const withLines = container.classList.contains('highlightit-with-lines')
		let language = null
		let displayLabel = languageOrFilename

		if (languageOrFilename) {
			language = this.getLanguageFromFilename(languageOrFilename) || languageOrFilename
		}

		try {
			const result = language
				? hljs.highlight(cleanedCode, { language })
				: { value: this.escapeHtml(cleanedCode) }

			element.innerHTML = result.value

			if (withLines) {
				const oldLineNumbers = container.querySelector('.highlightit-line-numbers')
				oldLineNumbers?.remove()
				this.addLineNumbers(element, cleanedCode)
			}

			const copyButton = container.querySelector(
				'.highlightit-copy, .highlightit-floating-copy'
			)
			if (copyButton) {
				copyButton.replaceWith(this.createCopyButton(cleanedCode))
			}

			if (showLanguage && language) {
				const header = container.querySelector('.highlightit-header')
				const languageLabel = header?.querySelector('.highlightit-language')
				if (languageLabel) {
					languageLabel.textContent = displayLabel || language
				}
			}
		} catch (error) {
			console.warn(`HighlightIt: Error highlighting with language ${language}`, error)
			element.innerHTML = this.escapeHtml(cleanedCode)
		}
	}

	static findOriginalElement(element, container) {
		let linkId =
			element.parentElement?.dataset.linkedOriginal ||
			container?.dataset.linkedOriginal ||
			element.parentElement?.getAttribute('data-linked-original') ||
			container?.getAttribute('data-linked-original')

		if (linkId) {
			return (
				document.querySelector(`.highlightit-original[data-highlightit-id="${linkId}"]`) ||
				document.getElementById(linkId)
			)
		}

		if (container?.previousSibling?.classList?.contains('highlightit-original')) {
			return container.previousSibling
		}

		const originalId =
			element.parentElement?.getAttribute('data-original-id') ||
			container?.getAttribute('data-original-id')
		return originalId ? document.getElementById(originalId) : null
	}
}

export default HighlightIt

/**
 * Highlight a new element that wasn't present when the library was initialized
 * @param {HTMLElement} element - The element to highlight
 * @param {Object} options - Configuration options
 * @param {boolean} [options.autoDetect=true] - Whether to auto-detect language if not specified
 * @param {boolean} [options.addCopyButton=true] - Whether to add a copy button
 * @param {boolean} [options.showLanguage=true] - Whether to show the language label
 * @param {boolean} [options.addHeader=true] - Whether to add a header section
 * @param {boolean} [options.addLines=false] - Whether to add line numbers
 * @param {boolean} [options.withReload=false] - Whether to enable live updates
 * @param {string} [options.language] - The language to use for syntax highlighting
 * @param {string} [options.theme] - Theme override for this element ('light', 'dark', or 'auto')
 * @returns {HTMLElement} - The highlighted element container
 */
HighlightIt.highlight = function (element, options = {}) {
	if (
		!element ||
		element.classList.contains('highlightit-original') ||
		element.closest('.highlightit-container') ||
		(element.parentElement && element.parentElement.classList.contains('highlightit-container'))
	) {
		console.warn('HighlightIt: Element is already highlighted or is a hidden original element')
		return element
	}

	const {
		autoDetect = true,
		addCopyButton = true,
		showLanguage = true,
		addHeader = true,
		addLines = false,
		withReload = false,
		language,
		theme
	} = options

	if (addLines) {
		element.dataset.withLines = ''
	}

	if (withReload) {
		element.dataset.withReload = ''
	}

	if (!addHeader) {
		element.dataset.noHeader = ''
	}

	if (!addCopyButton) {
		element.dataset.noCopy = ''
	}

	if (language) {
		element.dataset.language = language
	}

	if (theme) {
		element.dataset.theme = theme
	}

	this.processElement(element, autoDetect, addCopyButton, showLanguage, addHeader, addLines)

	const container =
		element.closest('.highlightit-container') ||
		(element.parentElement && element.parentElement.closest('.highlightit-container'))

	return container || element
}
