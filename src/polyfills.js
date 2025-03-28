/**
 * Polyfills and browser compatibility helpers
 */

const polyfills = {
	supports: {
		requestAnimationFrame: typeof requestAnimationFrame === 'function',
		ResizeObserver: typeof ResizeObserver === 'function',
		MutationObserver: typeof MutationObserver === 'function',
		classList:
			'classList' in document.documentElement &&
			typeof document.documentElement.classList !== 'undefined',
		dataset:
			'dataset' in document.documentElement &&
			typeof document.documentElement.dataset !== 'undefined',
		clipboard: 'clipboard' in navigator,
		clipboardItem: typeof ClipboardItem !== 'undefined',
		touch:
			'ontouchstart' in window ||
			navigator.maxTouchPoints > 0 ||
			navigator.msMaxTouchPoints > 0,
		getBoundingClientRect: 'getBoundingClientRect' in document.documentElement,
		animation: 'Animation' in window && 'animate' in document.documentElement,
		cssHas: (function () {
			try {
				document.querySelector(':has(*)')
				return true
			} catch {
				return false
			}
		})(),
		download: typeof document.createElement('a').download !== 'undefined',
		blob: typeof Blob !== 'undefined',
		URL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
	},

	requestAnimationFrame: (function () {
		return (
			window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (callback) {
				return window.setTimeout(callback, 1000 / 60)
			}
		)
	})(),

	ResizeObserver: (function () {
		if (typeof ResizeObserver === 'function') return ResizeObserver

		return class ResizeObserver {
			constructor(callback) {
				this.callback = callback
				this.observedElements = new Set()
				this.observer = new MutationObserver(this.handleMutation.bind(this))
			}

			observe(element) {
				if (this.observedElements.has(element)) return
				this.observedElements.add(element)
				this.observer.observe(element, {
					attributes: true,
					attributeFilter: ['style', 'class']
				})
				this.checkSize(element)
			}

			unobserve(element) {
				this.observedElements.delete(element)
				this.observer.unobserve(element)
			}

			disconnect() {
				this.observer.disconnect()
				this.observedElements.clear()
			}

			handleMutation(mutations) {
				mutations.forEach((mutation) => {
					if (mutation.target && this.observedElements.has(mutation.target)) {
						this.checkSize(mutation.target)
					}
				})
			}

			checkSize(element) {
				const size = {
					width: element.offsetWidth,
					height: element.offsetHeight
				}
				this.callback([{ target: element, contentRect: size }])
			}
		}
	})(),

	getBoundingClientRect: function (element) {
		if (!element) return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }

		if (this.supports.getBoundingClientRect) {
			try {
				return element.getBoundingClientRect()
			} catch {
				//
			}
		}

		const rect = {
			top: element.offsetTop,
			left: element.offsetLeft,
			width: element.offsetWidth,
			height: element.offsetHeight
		}

		rect.right = rect.left + rect.width
		rect.bottom = rect.top + rect.height

		let parent = element.offsetParent
		while (parent) {
			rect.top += parent.offsetTop
			rect.left += parent.offsetLeft
			parent = parent.offsetParent
		}

		rect.top -= window.scrollY || document.documentElement.scrollTop || 0
		rect.left -= window.scrollX || document.documentElement.scrollLeft || 0

		return rect
	},

	classList: {
		add: function (element, className) {
			if (!element) return

			try {
				if (this.supports.classList) {
					element.classList.add(className)
				} else {
					const classes = (element.className || '').split(' ')
					if (!classes.includes(className)) {
						classes.push(className)
					}
					element.className = classes.join(' ')
				}
			} catch {
				const classes = (element.className || '').split(' ')
				if (!classes.includes(className)) {
					classes.push(className)
				}
				element.className = classes.join(' ')
			}
		},
		remove: function (element, className) {
			if (!element) return

			try {
				if (this.supports.classList) {
					element.classList.remove(className)
				} else {
					element.className = (element.className || '')
						.split(' ')
						.filter((c) => c !== className)
						.join(' ')
				}
			} catch {
				element.className = (element.className || '')
					.split(' ')
					.filter((c) => c !== className)
					.join(' ')
			}
		},
		contains: function (element, className) {
			if (!element) return false

			try {
				if (this.supports.classList) {
					return element.classList.contains(className)
				}
				return (element.className || '').split(' ').includes(className)
			} catch {
				return (element.className || '').split(' ').includes(className)
			}
		}
	},

	dataset: {
		get: function (element, key) {
			if (!element) return undefined

			try {
				if (this.supports.dataset) {
					return element.dataset[key]
				}
				return element.getAttribute(`data-${key}`)
			} catch {
				return element.getAttribute(`data-${key}`)
			}
		},
		set: function (element, key, value) {
			if (!element) return

			try {
				if (this.supports.dataset) {
					element.dataset[key] = value
				} else {
					element.setAttribute(`data-${key}`, value)
				}
			} catch {
				element.setAttribute(`data-${key}`, value)
			}
		}
	},

	copyToClipboard: async function (text) {
		if (this.supports.clipboard) {
			try {
				await navigator.clipboard.writeText(text)
				return true
			} catch {
				//
			}
		}

		if (this.supports.clipboard && this.supports.clipboardItem) {
			try {
				const clipboardItem = new ClipboardItem({
					'text/plain': new Blob([text], { type: 'text/plain' })
				})
				await navigator.clipboard.write([clipboardItem])
				return true
			} catch {
				//
			}
		}

		const textArea = document.createElement('textarea')
		textArea.value = text
		textArea.style.position = 'fixed'
		textArea.style.left = '-9999px'
		document.body.appendChild(textArea)
		textArea.focus()
		textArea.select()

		try {
			const success = document.execCommand('copy')
			document.body.removeChild(textArea)
			return success
		} catch {
			document.body.removeChild(textArea)
			return false
		}
	},

	downloadFile: function (filename, content, mimeType = 'text/plain') {
		if (this.supports.blob && this.supports.URL) {
			try {
				const blob = new Blob([content], { type: mimeType })
				const url = URL.createObjectURL(blob)

				if (this.supports.download) {
					const link = document.createElement('a')
					link.href = url
					link.download = filename
					link.style.display = 'none'
					document.body.appendChild(link)
					link.click()

					setTimeout(() => {
						document.body.removeChild(link)
						URL.revokeObjectURL(url)
					}, 100)

					return true
				} else {
					window.open(url, '_blank')

					setTimeout(() => {
						URL.revokeObjectURL(url)
					}, 100)

					return true
				}
			} catch (e) {
				console.error('Error downloading file:', e)
			}
		}

		try {
			const iframeId = 'highlightit-download-iframe'
			let iframe = document.getElementById(iframeId)

			if (!iframe) {
				iframe = document.createElement('iframe')
				iframe.id = iframeId
				iframe.style.display = 'none'
				document.body.appendChild(iframe)
			}

			const iframeDocument = iframe.contentWindow.document
			iframeDocument.open('text/html', 'replace')
			iframeDocument.write(content)
			iframeDocument.close()

			iframeDocument.execCommand('SaveAs', true, filename)
			return true
		} catch (e) {
			console.error('Legacy download failed:', e)
			return false
		}
	},

	animate: function (element, keyframes, options) {
		if (!element) return null

		if (this.supports.animation) {
			try {
				return element.animate(keyframes, options)
			} catch {
				//
			}
		}

		const animationId = Date.now().toString(36)
		const duration = options.duration || 1000

		Object.keys(keyframes[0]).forEach((prop) => {
			element.style[prop] = keyframes[0][prop]
		})

		setTimeout(() => {
			element.style.transition = `all ${duration}ms ${options.easing || 'ease'}`

			const finalState = keyframes[keyframes.length - 1]
			Object.keys(finalState).forEach((prop) => {
				element.style[prop] = finalState[prop]
			})

			setTimeout(() => {
				element.style.transition = ''
				if (options.fill !== 'forwards') {
					Object.keys(finalState).forEach((prop) => {
						element.style[prop] = ''
					})
				}
			}, duration)
		}, 0)

		return {
			id: animationId,
			cancel: function () {
				element.style.transition = ''
			},
			finished: new Promise((resolve) => {
				setTimeout(resolve, duration)
			})
		}
	},

	/**
	 * Helper to check if a container has an element with a certain class
	 * Used as a fallback for browsers that don't support :has() selector
	 *
	 * @param {HTMLElement} container - The container element to check
	 * @param {string} selector - The selector to look for within the container
	 * @param {string} className - The class to add/remove from the container
	 * @param {boolean} shouldHaveClass - Whether to add or remove the class
	 */
	updateHasClass: function (container, selector, className, shouldHaveClass) {
		if (!container || !selector || !className) return
		if (this.supports.cssHas) return

		const hasElement = container.querySelector(selector)

		if (shouldHaveClass && hasElement) {
			this.classList.add(container, className)
		} else if (!shouldHaveClass && !hasElement) {
			this.classList.remove(container, className)
		}
	}
}

export default polyfills
