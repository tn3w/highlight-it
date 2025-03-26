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
		touch:
			'ontouchstart' in window ||
			navigator.maxTouchPoints > 0 ||
			navigator.msMaxTouchPoints > 0
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

		try {
			const clipboardItem = new ClipboardItem({
				'text/plain': new Blob([text], { type: 'text/plain' })
			})
			await navigator.clipboard.write([clipboardItem])
			return true
		} catch {
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
		}
	}
}

export default polyfills
