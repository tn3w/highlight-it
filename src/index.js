/**
 * HighlightIt - A lightweight syntax highlighting library with themes, line numbers, and copy functionality.
 * Uses highlight.js for code highlighting
 */

import './styles.css'
import polyfills from './polyfills'
import cache from './cache'

import hljs from 'highlight.js'

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

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
	 * @param {boolean} [options.addShare=false] - Whether to add share button to code blocks
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
			addShare = false,
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
					addLines,
					addShare
				)
			}
			if (endIndex < elements.length) {
				polyfills.requestAnimationFrame(() => processChunk(endIndex))
			} else {
				if (window.location.hash) {
					this.scrollToAnchor()
				}
			}
		}

		processChunk(0)
		this._initialized = true

		this.initSharing()
	}

	/**
	 * Generate a hash using SHA-256 and convert to a 12-character base62 string
	 * @param {string} input - The string to hash
	 * @returns {Promise<string>} - A 12-character base62 hash
	 */
	static async generateHash(input) {
		const encoder = new TextEncoder()
		const data = encoder.encode(input)

		const hashBuffer = await crypto.subtle.digest('SHA-256', data)

		const hashArray = Array.from(new Uint8Array(hashBuffer))

		let base62Hash = ''
		let value = 0n

		for (let i = 0; i < hashArray.length; i++) {
			value = (value << 8n) | BigInt(hashArray[i])
		}

		while (value > 0 || base62Hash.length < 12) {
			const remainder = Number(value % 62n)
			base62Hash = BASE62_CHARS[remainder] + base62Hash
			value = value / 62n

			if (value === 0n && base62Hash.length < 12) {
				base62Hash = '0' + base62Hash
			}
		}

		return base62Hash.slice(-12).padStart(12, '0')
	}

	/**
	 * Create a share button for code blocks
	 * @param {string} code - The code to generate hash from if no id exists
	 * @param {HTMLElement} container - The container element (to extract id)
	 * @returns {HTMLElement} - The share button element
	 */
	static async createShareButton(code, container) {
		const shareButton = document.createElement('button')
		shareButton.className = 'highlightit-button highlightit-share'
		shareButton.setAttribute('aria-label', 'Share code')
		shareButton.innerHTML = cache.svgIcons.share

		let blockId = ''
		const originalId = container.getAttribute('data-original-id')
		
		if (originalId) {
			blockId = originalId
		} else {
			if (container.id) {
				blockId = container.id
			} else {
				blockId = await this.generateHash(code)
				container.id = blockId
			}
		}

		const clickListener = async () => {
			const targetId = container.getAttribute('data-original-id') || container.id
			
			const url = new URL(window.location.href)
			url.hash = targetId || blockId

			const success = await polyfills.copyToClipboard(url.toString())

			if (success) {
				shareButton.classList.add('copied')

				shareButton.innerHTML = cache.svgIcons.check

				setTimeout(() => {
					shareButton.classList.remove('copied')
					shareButton.innerHTML = cache.svgIcons.share
				}, 2000)
			}
		}

		shareButton.onclickBackup = clickListener
		shareButton._currentBlockId = blockId
		shareButton.addEventListener('click', clickListener)

		return shareButton
	}

	/**
	 * Update block ID when code changes for blocks with live updates
	 * @param {HTMLElement} container - The container element
	 * @param {string} newCode - The new code content
	 * @returns {Promise<string>} - The updated block ID
	 */
	static async updateBlockId(container, newCode) {
		const originalId = container.getAttribute('data-original-id')

		if (originalId) {
			const originalElement = document.querySelector(`.highlightit-original[id="${originalId}"]`)
			
			if (originalElement) {
				if (originalElement.id !== originalId) {
					originalElement.id = originalId
				}

				if (container.id === originalId) {
					container.id = ''
				}
				container.setAttribute('data-original-id', originalId)
			} else {
				if (!container.id || container.id !== originalId) {
					container.id = originalId
				}
			}
			
			return originalId
		} else {
			const newId = await this.generateHash(newCode)
			container.id = newId
			return newId
		}
	}

	/**
	 * Scroll to the element specified in the URL hash
	 * @param {number} [attempts=0] - Number of attempts made so far
	 */
	static scrollToAnchor(attempts = 0) {
		const hash = window.location.hash.substring(1)
		if (!hash) return

		const target = document.getElementById(hash)
		if (target) {
			if (target.classList.contains('highlightit-original')) {
				const uniqueId = target.getAttribute('data-highlightit-id')
				let visibleTarget = null
				
				if (uniqueId) {
					visibleTarget = document.querySelector(`[data-linked-original="${uniqueId}"]`)
				}
				
				if (visibleTarget) {
					setTimeout(() => {
						visibleTarget.scrollIntoView({ behavior: 'smooth', block: 'start' })
						visibleTarget.classList.add('highlightit-anchor-highlight')
						setTimeout(() => {
							visibleTarget.classList.remove('highlightit-anchor-highlight')
						}, 2000)
					}, 100)
					return
				}
			}
			
			setTimeout(() => {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' })
				target.classList.add('highlightit-anchor-highlight')
				setTimeout(() => {
					target.classList.remove('highlightit-anchor-highlight')
				}, 2000)
			}, 100)
		} else if (attempts < 10) {
			setTimeout(
				() => {
					this.scrollToAnchor(attempts + 1)
				},
				300 * (attempts + 1)
			)
		}
	}

	/**
	 * Initialize the share functionality
	 */
	static initSharing() {
		setTimeout(() => {
			this.scrollToAnchor()
		}, 100)

		window.addEventListener('hashchange', () => {
			this.scrollToAnchor()
		})
	}

	/**
	 * Process an element for highlighting, handling both single and nested element structures
	 * @param {HTMLElement} element - The element to process
	 * @param {boolean} autoDetect - Whether to auto-detect language
	 * @param {boolean} addCopyButton - Whether to add a copy button
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @param {boolean} addHeader - Whether to add header section
	 * @param {boolean} addLines - Whether to add line numbers
	 * @param {boolean} addShare - Whether to add share button
	 * @private
	 */
	static processElement(
		element,
		autoDetect,
		addCopyButton,
		showLanguage,
		addHeader,
		addLines,
		addShare
	) {
		let codeElement
		let preElement
		let originalElement = null
		const withLiveUpdates = element.dataset.withReload !== undefined

		if (element.textContent) {
			element.textContent = element.textContent.trim()
		}

		if (element.dataset.lineStart !== undefined) {
			element.dataset.withLines = ''
			addLines = true
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
					preElement.id = ''
				}

				originalElement.setAttribute('data-highlightit-id', uniqueId)
				originalElement.classList.add('highlightit-visually-hidden')

				if (element.dataset.language) {
					originalCodeElement.dataset.language = element.dataset.language
				}

				if (element.dataset.lineStart !== undefined) {
					originalCodeElement.dataset.lineStart = element.dataset.lineStart
				}

				if (element.dataset.withShare !== undefined) {
					originalCodeElement.dataset.withShare = element.dataset.withShare
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
					element.id = ''
				}

				originalElement.setAttribute('data-highlightit-id', uniqueId)
				originalElement.classList.add('highlightit-visually-hidden')

				if (element.dataset.language) {
					originalCodeElement.dataset.language = element.dataset.language
				}

				if (element.dataset.lineStart !== undefined) {
					originalCodeElement.dataset.lineStart = element.dataset.lineStart
				}

				if (element.dataset.withShare !== undefined) {
					originalCodeElement.dataset.withShare = element.dataset.withShare
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

				if (key === 'lineStart') {
					codeElement.dataset.lineStart = element.dataset[key]
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

		this.highlightElement(
			element,
			autoDetect,
			addCopyButton,
			showLanguage,
			addHeader,
			addLines,
			addShare
		)
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
	 * @param {boolean} addShare - Whether to add share button
	 * @private
	 *
	 * The element can have various data attributes:
	 * - data-language: The programming language for syntax highlighting
	 * - data-filename: Filename to display (also used to detect language)
	 * - data-theme: Override global theme for this element ('light', 'dark', 'auto')
	 * - data-with-lines: Add line numbers to the code block
	 * - data-line-start: Set the starting line number (default is 1, can be positive or negative)
	 * - data-no-header: Hide the header (language label and copy button)
	 * - data-no-copy: Hide the copy button
	 * - data-with-reload: Enable live updates - code will be rehighlighted automatically when content changes
	 * - data-with-share: Add a share button that copies the URL with the element ID as the fragment
	 */
	static highlightElement(
		element,
		autoDetect,
		addCopyButton,
		showLanguage,
		addHeader,
		addLines,
		addShare
	) {
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
		const withShare =
			addShare ||
			elementDataset.withShare !== undefined ||
			containerDataset.withShare !== undefined

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

		if (withShare && !withLiveUpdates) {
			(async () => {
				const originalId = container.getAttribute('data-original-id') || container.id
				if (!originalId) {
					const blockId = await this.generateHash(code)
					container.id = blockId
				}
			})()
		}

		if ((showLanguage || shouldAddCopyButton || withShare) && addHeader && !noHeader) {
			const header = this.createCodeHeader(
				displayLabel,
				code,
				shouldAddCopyButton,
				showLanguage,
				withShare,
				container
			)
			container.prepend(header)
		} else if (noHeader) {
			container.classList.add('highlightit-no-header')
			if (shouldAddCopyButton || withShare) {
				const floatingBtns = this.createFloatingButtons(code, withShare, container)
				container.appendChild(floatingBtns)
			}
		}

		if (withLines) {
			container.classList.add('highlightit-with-lines')
		}

		if (withLiveUpdates) {
			this.setupLiveUpdates(element, container, autoDetect, showLanguage, withShare)
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
	 * Set up live updates to watch for changes to the code element
	 * @param {HTMLElement} element - The code element to watch
	 * @param {HTMLElement} container - The container element
	 * @param {boolean} autoDetect - Whether to auto-detect language
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @param {boolean} withShare - Whether to update block ID for sharing
	 * @private
	 */
	static setupLiveUpdates(element, container, autoDetect, showLanguage, withShare) {
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

		let detectedLanguage = null
		if (!language && autoDetect) {
			const code = (elementToWatch.querySelector('code') || elementToWatch).textContent.trim()
			if (code) {
				const result = this.autoDetectLanguage(code)
				detectedLanguage = result.language || null
			}
		}

		let lastProcessedCode = ''

		const rehighlight = () => {
			const originalCode = elementToWatch.querySelector('code') || elementToWatch
			const code = originalCode.textContent.trim()
			if (!code) return

			if (code === lastProcessedCode) {
				if (container.classList.contains('highlightit-with-lines')) {
					const preElement = targetElement.parentElement
					const lineNumbersWrapper = preElement.querySelector('.highlightit-line-numbers')
					if (lineNumbersWrapper) {
						this.updateLineHeights(targetElement, lineNumbersWrapper)
					}
				}
				return
			}

			lastProcessedCode = code

			if (withShare) {
				this.updateCodeBlock(targetElement, container, language, code, showLanguage)
			} else {
				if (!language && autoDetect) {
					if (
						!detectedLanguage ||
						(showLanguage &&
							!container.querySelector('.highlightit-header .highlightit-language'))
					) {
						const result = this.autoDetectLanguage(code)
						detectedLanguage = result.language || 'unknown'
						targetElement.innerHTML = result.value
						polyfills.classList.add(targetElement, `language-${detectedLanguage}`)

						if (showLanguage && detectedLanguage) {
							const header = container.querySelector('.highlightit-header')
							if (header) {
								const languageLabel = header.querySelector('.highlightit-language')
								if (languageLabel) {
									languageLabel.textContent = detectedLanguage
								} else {
									const newLanguageLabel = document.createElement('span')
									newLanguageLabel.className = 'highlightit-language'
									newLanguageLabel.textContent = detectedLanguage
									header.insertBefore(newLanguageLabel, header.firstChild)
								}
							}
						}
					} else {
						const result = hljs.highlight(code, { language: detectedLanguage })
						targetElement.innerHTML = result.value
						polyfills.classList.add(targetElement, `language-${detectedLanguage}`)
					}
				} else {
					this.updateCodeBlock(targetElement, container, language, code, showLanguage)
					polyfills.classList.add(targetElement, `language-${language || 'unknown'}`)
				}
			}

			if (container.classList.contains('highlightit-with-lines')) {
				const preElement = targetElement.parentElement
				const oldLineNumbers = preElement.querySelector('.highlightit-line-numbers')
				const oldLines = oldLineNumbers
					? oldLineNumbers.querySelectorAll('.highlightit-line-number')
					: null

				if (oldLineNumbers) {
					const lineCount = code.split('\n').length
					const oldLineCount = oldLines ? oldLines.length : 0

					if (lineCount !== oldLineCount) {
						const startLine = parseInt(
							targetElement.dataset.lineStart || preElement.dataset.lineStart || 1,
							10
						)

						while (oldLineNumbers.firstChild) {
							oldLineNumbers.removeChild(oldLineNumbers.firstChild)
						}

						const fragment = document.createDocumentFragment()
						for (let i = 0; i < lineCount; i++) {
							const span = document.createElement('span')
							span.className = 'highlightit-line-number'
							span.textContent = startLine + i
							fragment.appendChild(span)
						}
						oldLineNumbers.appendChild(fragment)

						this.updateLineHeights(targetElement, oldLineNumbers)
					} else {
						this.updateLineHeights(targetElement, oldLineNumbers)
					}
				} else {
					this.addLineNumbers(targetElement, code)
				}
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
	 * @param {boolean} addShareButton - Whether to add a share button
	 * @param {HTMLElement} container - The container element (for share button)
	 * @returns {HTMLElement} - The header element
	 * @private
	 */
	static createCodeHeader(
		displayLabel,
		code,
		addCopyButton,
		showLanguage,
		addShareButton,
		container
	) {
		const header = document.createElement('div')
		header.className = 'highlightit-header'

		if (showLanguage && displayLabel) {
			const labelElement = document.createElement('span')
			labelElement.className = 'highlightit-language'
			labelElement.textContent = displayLabel
			header.appendChild(labelElement)
		}

		const buttonContainer = document.createElement('div')
		buttonContainer.className = 'highlightit-buttons-container'
		buttonContainer.style.display = 'flex'
		buttonContainer.style.alignItems = 'center'

		if (addCopyButton) {
			const copyButton = this.createCopyButton(code)
			buttonContainer.appendChild(copyButton)
		}
		
		if (addShareButton) {
			this.createShareButton(code, container).then((shareButton) => {
				buttonContainer.appendChild(shareButton)
			})
		}

		header.appendChild(buttonContainer)

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
		copyButton.className = 'highlightit-button highlightit-copy'
		copyButton.setAttribute('aria-label', 'Copy code')
		copyButton.innerHTML = `${cache.svgIcons.copy}${cache.svgIcons.check.replace('highlightit-check-icon', 'highlightit-check-icon" style="display: none;')}`

		const clickListener = async () => {
			const codeToCopy = code.trim()
			const success = await polyfills.copyToClipboard(codeToCopy)

			if (success) {
				polyfills.classList.add(copyButton, 'copied')
				copyButton.querySelector('.highlightit-copy-icon').style.display = 'none'
				copyButton.querySelector('.highlightit-check-icon').style.display = 'block'

				setTimeout(() => {
					polyfills.classList.remove(copyButton, 'copied')
					copyButton.querySelector('.highlightit-copy-icon').style.display =
						'block'
					copyButton.querySelector('.highlightit-check-icon').style.display =
						'none'
				}, 2000)
			} else {
				console.warn('Failed to copy code')
			}
		}

		copyButton.onclickBackup = clickListener
		copyButton._currentCode = code.trim()
		copyButton.addEventListener('click', clickListener)

		return copyButton
	}

	/**
	 * Create floating buttons for no-header mode
	 * @param {string} code - The code to copy
	 * @param {boolean} withShare - Whether to add a share button
	 * @param {HTMLElement} container - The container element for share functionality
	 * @returns {HTMLElement} - The container with floating buttons
	 * @private
	 */
	static createFloatingButtons(code, withShare = false, container = null) {
		const buttonsContainer = document.createElement('div')
		buttonsContainer.className = 'highlightit-floating-buttons'

		const copyButton = this.createCopyButton(code)
		copyButton.className = 'highlightit-button highlightit-copy highlightit-floating'

		if (this.isTouchDevice) {
			copyButton.style.opacity = '1'
		}

		buttonsContainer.appendChild(copyButton)
		
		if (withShare && container) {
			(async () => {
				const shareButton = await this.createShareButton(code, container)
				shareButton.className = 'highlightit-button highlightit-share highlightit-floating'
				
				if (this.isTouchDevice) {
					shareButton.style.opacity = '1'
				}
				
				buttonsContainer.appendChild(shareButton)
			})()
		}

		return buttonsContainer
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

		const startLine = parseInt(
			element.dataset.lineStart || preElement.dataset.lineStart || 1,
			10
		)

		const fragment = document.createDocumentFragment()
		for (let i = 0; i < lineCount; i++) {
			const span = document.createElement('span')
			span.className = 'highlightit-line-number'
			span.textContent = startLine + i
			fragment.appendChild(span)
		}
		lineNumbersWrapper.appendChild(fragment)

		polyfills.classList.add(preElement, 'highlightit-has-line-numbers')
		preElement.insertBefore(lineNumbersWrapper, preElement.firstChild)

		this.updateLineHeights(element, lineNumbersWrapper)

		const resizeObserver = new polyfills.ResizeObserver(() => {
			this.updateLineHeights(element, lineNumbersWrapper)
		})

		resizeObserver.observe(element)

		element._lineNumbersResizeObserver = resizeObserver
	}

	/**
	 * Update the line heights for line numbers to match the highlighted code
	 * @param {HTMLElement} element - The code element
	 * @param {HTMLElement} lineNumbersWrapper - The line numbers container
	 * @private
	 */
	static updateLineHeights(element, lineNumbersWrapper) {
		const codeHeight = element.offsetHeight
		const lineNumbers = lineNumbersWrapper.querySelectorAll('.highlightit-line-number')
		const lineCount = lineNumbers.length

		if (lineCount === 0) return

		const lineHeight = codeHeight / lineCount

		lineNumbers.forEach((lineNumber) => {
			lineNumber.style.height = `${lineHeight}px`
		})
	}

	/**
	 * Update code block with new content
	 * @param {HTMLElement} element - The code element to rehighlight
	 * @param {HTMLElement} container - The container element
	 * @param {string} languageOrFilename - The language or filename to use
	 * @param {string} code - The code content
	 * @param {boolean} showLanguage - Whether to show the language label
	 * @private
	 */
	static updateCodeBlock(element, container, languageOrFilename, code, showLanguage) {
		const cleanedCode = code.trim()
		const withLines =
			container.classList.contains('highlightit-with-lines') ||
			element.dataset.lineStart !== undefined

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
				const oldLines = oldLineNumbers
					? oldLineNumbers.querySelectorAll('.highlightit-line-number')
					: null

				const lineCount = cleanedCode.split('\n').length
				const oldLineCount = oldLines ? oldLines.length : 0

				let lineStart = parseInt(
					element.dataset.lineStart || container.dataset.lineStart || 1,
					10
				)

				if (oldLineNumbers && lineCount !== oldLineCount) {
					while (oldLineNumbers.firstChild) {
						oldLineNumbers.removeChild(oldLineNumbers.firstChild)
					}

					const fragment = document.createDocumentFragment()
					for (let i = 0; i < lineCount; i++) {
						const span = document.createElement('span')
						span.className = 'highlightit-line-number'
						span.textContent = lineStart + i
						fragment.appendChild(span)
					}
					oldLineNumbers.appendChild(fragment)

					this.updateLineHeights(element, oldLineNumbers)
				} else {
					this.addLineNumbers(element, cleanedCode)
				}
			}

			const copyButtons = container.querySelectorAll('.highlightit-copy')
			copyButtons.forEach((copyButton) => {
				const currentCode = copyButton._currentCode

				if (currentCode !== cleanedCode) {
					const clickListener = copyButton.onclickBackup || copyButton.onclick

					if (clickListener) {
						copyButton.removeEventListener('click', clickListener)
					}

					const newClickListener = async () => {
						const codeToCopy = cleanedCode
						const success = await polyfills.copyToClipboard(codeToCopy)

						if (success) {
							polyfills.classList.add(copyButton, 'copied')
							copyButton.querySelector('.highlightit-copy-icon').style.display =
								'none'
							copyButton.querySelector('.highlightit-check-icon').style.display =
								'block'

							setTimeout(() => {
								polyfills.classList.remove(copyButton, 'copied')
								copyButton.querySelector('.highlightit-copy-icon').style.display =
									'block'
								copyButton.querySelector('.highlightit-check-icon').style.display =
									'none'
							}, 2000)
						} else {
							console.warn('Failed to copy code')
						}
					}

					copyButton.onclickBackup = newClickListener
					copyButton._currentCode = cleanedCode
					copyButton.addEventListener('click', newClickListener)
				}
			})

			const shareButtons = container.querySelectorAll('.highlightit-share')
			shareButtons.forEach(async (shareButton) => {
				const originalId = container.getAttribute('data-original-id')
				
				if (originalId) {
					if (shareButton._currentBlockId !== originalId) {
						shareButton._currentBlockId = originalId
					}
					return
				}
				
				const blockId = await this.generateHash(cleanedCode)
				container.id = blockId
				
				if (shareButton._currentBlockId !== blockId) {
					const clickListener = shareButton.onclickBackup || shareButton.onclick
					
					if (clickListener) {
						shareButton.removeEventListener('click', clickListener)
					}
					
					const newClickListener = async () => {
						const url = new URL(window.location.href)
						url.hash = blockId
						
						const success = await polyfills.copyToClipboard(url.toString())
						
						if (success) {
							shareButton.classList.add('copied')
							
							const originalIcon = shareButton.innerHTML
							shareButton.innerHTML = cache.svgIcons.check
							
							setTimeout(() => {
								shareButton.classList.remove('copied')
								shareButton.innerHTML = originalIcon
							}, 2000)
						}
					}
					
					shareButton.onclickBackup = newClickListener
					shareButton._currentBlockId = blockId
					shareButton.addEventListener('click', newClickListener)
				}
			})

			const floatingBtnsContainer = container.querySelector('.highlightit-floating-buttons')
			if (floatingBtnsContainer && container.classList.contains('highlightit-no-header')) {
				container.removeChild(floatingBtnsContainer)
				const withShare = container.dataset.withShare !== undefined
				const newFloatingBtns = this.createFloatingButtons(
					cleanedCode,
					withShare,
					container
				)
				container.appendChild(newFloatingBtns)
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

if (typeof window !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => HighlightIt.initSharing())
	} else {
		HighlightIt.initSharing()
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
 * @param {boolean} [options.addShare=false] - Whether to add a share button
 * @param {string} [options.language] - The language to use for syntax highlighting
 * @param {string} [options.theme] - Theme override for this element ('light', 'dark', or 'auto')
 * @param {number} [options.lineStart] - Starting line number (default is 1, can be positive or negative)
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
		addShare = false,
		language,
		theme,
		lineStart
	} = options

	if (addLines) {
		element.dataset.withLines = ''
	}

	if (lineStart !== undefined) {
		element.dataset.lineStart = lineStart
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

	if (addShare) {
		element.dataset.withShare = ''
	}

	if (language) {
		element.dataset.language = language
	}

	if (theme) {
		element.dataset.theme = theme
	}

	this.processElement(
		element,
		autoDetect,
		addCopyButton,
		showLanguage,
		addHeader,
		addLines,
		addShare
	)

	const container =
		element.closest('.highlightit-container') ||
		(element.parentElement && element.parentElement.closest('.highlightit-container'))

	return container || element
}
