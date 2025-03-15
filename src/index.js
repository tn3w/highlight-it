/**
 * HighlightIt - A lightweight syntax highlighting library with themes, line numbers, and copy functionality.
 * Uses highlight.js for code highlighting
 */

import './styles.css'
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
	 * @param {string} [options.theme='auto'] - Theme to use ('light', 'dark', or 'auto')
	 */
	static init(options = {}) {
		const {
			selector = '.highlight-it',
			autoDetect = true,
			addCopyButton = true,
			showLanguage = true,
			theme = 'auto'
		} = options

		this.applyGlobalTheme(theme)

		const elements = document.querySelectorAll(selector)

		elements.forEach((element) => {
			this.processElement(element, autoDetect, addCopyButton, showLanguage)
		})
	}

	/**
	 * Process an element for highlighting, handling both single and nested element structures
	 * @param {HTMLElement} element - The element to process
	 * @param {boolean} autoDetect - Whether to auto-detect language
	 * @param {boolean} addCopyButton - Whether to add a copy button
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @private
	 */
	static processElement(element, autoDetect, addCopyButton, showLanguage) {
		let codeElement
		let preElement

		if (element.textContent) {
			element.textContent = element.textContent.trim()
		}

		if (
			element.tagName.toLowerCase() === 'code' &&
			element.parentElement.tagName.toLowerCase() === 'pre'
		) {
			codeElement = element
			preElement = element.parentElement
		} else {
			const content = element.textContent || ''

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

		this.highlightElement(element, autoDetect, addCopyButton, showLanguage)
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
	 * @private
	 */
	static highlightElement(element, autoDetect, addCopyButton, showLanguage) {
		const container = this.createCodeContainer(element)

		const code = (element.textContent || '').trim()

		let language = null
		let displayLabel = null
		let filename = null

		const elementDataset = element.dataset
		const containerDataset = container.dataset

		const noHeader =
			elementDataset.noHeader !== undefined || containerDataset.noHeader !== undefined
		const withLines =
			elementDataset.withLines !== undefined || containerDataset.withLines !== undefined

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

		if ((showLanguage || addCopyButton) && !noHeader) {
			const header = this.createCodeHeader(displayLabel, code, addCopyButton, showLanguage)
			container.prepend(header)
		} else if (noHeader) {
			container.classList.add('highlightit-no-header')
			if (addCopyButton) {
				const floatingCopy = this.createFloatingCopyButton(code)
				container.appendChild(floatingCopy)
			}
		}

		if (withLines) {
			container.classList.add('highlightit-with-lines')
		}

		if (!language && autoDetect) {
			const result = hljs.highlightAuto(code)
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
			} catch (error) {
				console.warn(`HighlightIt: Error highlighting with language ${language}`, error)
				if (autoDetect) {
					const result = hljs.highlightAuto(code)
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

		copyButton.addEventListener('click', () => {
			const codeToCopy = code.trim()

			navigator.clipboard
				.writeText(codeToCopy)
				.then(() => {
					copyButton.classList.add('copied')
					copyButton.querySelector('.highlightit-copy-icon').style.display = 'none'
					copyButton.querySelector('.highlightit-check-icon').style.display = 'block'

					setTimeout(() => {
						copyButton.classList.remove('copied')
						copyButton.querySelector('.highlightit-copy-icon').style.display = 'block'
						copyButton.querySelector('.highlightit-check-icon').style.display = 'none'
					}, 2000)
				})
				.catch((err) => {
					console.error('Failed to copy code:', err)
				})
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

		const extensionMap = {
			js: 'javascript',
			ts: 'typescript',
			jsx: 'javascript',
			tsx: 'typescript',
			html: 'html',
			css: 'css',
			scss: 'scss',
			sass: 'scss',
			py: 'python',
			rb: 'ruby',
			java: 'java',
			c: 'c',
			cpp: 'cpp',
			cs: 'csharp',
			php: 'php',
			go: 'go',
			rust: 'rust',
			rs: 'rust',
			swift: 'swift',
			md: 'markdown',
			json: 'json',
			xml: 'xml',
			yaml: 'yaml',
			yml: 'yaml',
			sh: 'bash',
			bash: 'bash'
		}

		return extensionMap[extension] || null
	}

	/**
	 * Escape HTML special characters
	 * @param {string} html - The HTML string to escape
	 * @returns {string} - The escaped HTML string
	 * @private
	 */
	static escapeHtml(html) {
		const entityMap = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
			'/': '&#x2F;',
			'`': '&#x60;',
			'=': '&#x3D;'
		}

		return html.replace(/[&<>"'`=/]/g, (s) => entityMap[s])
	}

	/**
	 * Add line numbers to a code element
	 * @param {HTMLElement} element - The code element to add line numbers to
	 * @param {string} code - The original code content
	 * @private
	 */
	static addLineNumbers(element, code) {
		const trimmedCode = code.trim()
		const lines = trimmedCode.split('\n')
		const lineCount = lines.length

		const lineNumbersWrapper = document.createElement('div')
		lineNumbersWrapper.className = 'highlightit-line-numbers'

		let lineNumbersHtml = ''
		for (let i = 1; i <= lineCount; i++) {
			lineNumbersHtml += `<span class="highlightit-line-number">${i}</span>`
		}

		lineNumbersWrapper.innerHTML = lineNumbersHtml

		const preElement = element.parentElement
		preElement.classList.add('highlightit-has-line-numbers')
		preElement.prepend(lineNumbersWrapper)

		setTimeout(() => {
			const renderedLineCount = element.innerHTML.split('\n').length
			const codeHeight = element.offsetHeight
			const lineHeight = codeHeight / renderedLineCount

			const lineNumbers = lineNumbersWrapper.querySelectorAll('.highlightit-line-number')
			lineNumbers.forEach((lineNumber) => {
				lineNumber.style.height = `${lineHeight}px`
			})
		}, 0)
	}
}

export default HighlightIt

if (typeof window !== 'undefined') {
	window.HighlightIt = HighlightIt
}
