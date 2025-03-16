# highlight-it

A lightweight syntax highlighting library with themes, line numbers, and copy functionality.

## Data Attributes

HighlightIt supports the following data attributes to customize the appearance and behavior of code blocks:

| Attribute          | Description                                                                     | Example                                                                         |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `data-language`    | Specifies the programming language for syntax highlighting                      | `<div class="highlight-it" data-language="javascript">const foo = 'bar';</div>` |
| `data-filename`    | Displays a filename in the header and auto-detects language from file extension | `<div class="highlight-it" data-filename="example.js">const foo = 'bar';</div>` |
| `data-theme`       | Sets the theme to 'light', 'dark', or 'auto' for the specific code block        | `<div class="highlight-it" data-theme="dark">const foo = 'bar';</div>`          |
| `data-with-lines`  | Adds line numbers to the code block                                             | `<div class="highlight-it" data-with-lines>const foo = 'bar';</div>`            |
| `data-no-header`   | Removes the header (hides language label but keeps copy button as floating)     | `<div class="highlight-it" data-no-header>const foo = 'bar';</div>`             |
| `data-with-reload` | Enables live updates - code will be rehighlighted when content changes          | `<div class="highlight-it" data-with-reload data-language="javascript"></div>`  |

## Usage Example

```html
<!-- Auto-detect language -->
<div class="highlight-it">const greeting = 'Hello, world!'; console.log(greeting);</div>

<!-- Basic usage with language -->
<div class="highlight-it" data-language="javascript">
	const greeting = 'Hello, world!'; console.log(greeting);
</div>

<!-- With filename and line numbers -->
<div class="highlight-it" data-filename="app.js" data-with-lines>
	function calculateTotal(items) { return items.map((item) => item.price) .reduce((total, price)
	=> total + price, 0); }
</div>

<!-- Dark theme without header -->
<div class="highlight-it" data-language="css" data-theme="dark" data-no-header>
	.container { display: flex; justify-content: center; }
</div>

<!-- With live updates for streaming code -->
<div class="highlight-it" data-language="python" data-with-reload>
	# This code will be automatically rehighlighted as content changes
</div>
```

## Initialization

To initialize HighlightIt with custom options:

```javascript
// Default configuration
HighlightIt.init()

// Custom configuration
HighlightIt.init({
	selector: '.custom-code', // Custom CSS selector
	autoDetect: true, // Auto-detect language if not specified
	addCopyButton: true, // Add copy button to code blocks
	showLanguage: true, // Show language label in header
	theme: 'auto', // Global theme (light, dark, auto)
	debounceTime: 40 // Debounce time in ms for live updates (lower values = more responsive)
})
```

## Live Updates

The `data-with-reload` attribute enables automatic rehighlighting when code content changes, which is particularly useful for apps that stream in code responses. This feature ensures that code syntax highlighting is applied in real-time as code is being added to the DOM.

### Implementation Example

```javascript
// Create an empty code block with live updates enabled
const codeBlock = document.createElement('div')
codeBlock.className = 'highlight-it'

// Add it to your container
document.querySelector('.container').appendChild(codeBlock)

// Add it to HighlightIt
HighlightIt.highlight(codeBlock, {
	withReload: true,
	language: 'javascript'
})

// HighlightIt will automatically rehighlight the code
function onAiResponseChunk(codeChunk) {
	codeBlock.textContent += codeChunk
	// No need to manually rehighlight - it happens automatically!
}
```

### Benefits

- Real-time syntax highlighting as code streams in
- No need to manually call highlighting functions after content updates
- Ensures users see properly highlighted code even during streaming
- Works with all other HighlightIt features (themes, line numbers, etc.)
- Debounced to optimize performance during rapid updates
