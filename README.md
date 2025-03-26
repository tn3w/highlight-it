<p align="center">
  <a href="https://github.com/librecap/librecap">
      <picture>
          <source height="260" media="(prefers-color-scheme: dark)" srcset="https://github.com/tn3w/highlight-it/releases/download/v0.1.4-img/highlight-dark.png">
          <source height="260" media="(prefers-color-scheme: light)" srcset="https://github.com/tn3w/highlight-it/releases/download/v0.1.4-img/highlight-light.png">
          <img height="260" alt="HighlightIt Logo" src="https://github.com/tn3w/highlight-it/releases/download/v0.1.4-img/highlight-light.png">
      </picture>
  </a>
</p>

<h1 align="center">Highlight-It</h1>
<p align="center">A lightweight syntax highlighting library with themes, line numbers, and copy functionality.</p>

Example:

```html
<code class="highlight-it">
def greet(name):
	"""Return a personalized greeting."""
	return f"Hello, {name}!"

# Example usage
if __name__ == "__main__":
	print(greet("World"))
</code>
```

Add highlight-it using this script:

```html
<script
	src="https://cdn.jsdelivr.net/npm/highlight-it@0.1.16/dist/highlight-it-min.js"
	integrity="sha512-hJWSehqOXo2rIb3+fIOstpyklJa3tTL77pCD7/jwDk/xgYQmoQ0Y9GeKELRLowdTbO5rrImfkIC5thlrwnaISw=="
	crossorigin="anonymous"
></script>
<script>
	window.addEventListener('load', () => {
		HighlightIt.init();
	});
</script>
```

## Themes and Styling

Highlight-It provides comprehensive theming support by integrating all themes from [highlight.js](https://github.com/highlightjs/highlight.js/tree/main/src/styles). The library intelligently bundles related theme files (e.g. `theme-dark.css` and `theme-light.css`) into a single `theme.css` file that automatically handles both light and dark modes.

### Adding Themes

Include your preferred theme by adding a stylesheet link:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight-it@latest/dist/styles/a11y.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight-it@latest/dist/styles/github.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight-it@latest/dist/styles/vs2015.min.css">
```

## Data Attributes

HighlightIt supports the following data attributes to customize the appearance and behavior of code blocks:

| Attribute          | Description                                                                     | Example                                                                         |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `data-language`    | Specifies the programming language for syntax highlighting                      | `<div class="highlight-it" data-language="javascript">const foo = 'bar';</div>` |
| `data-filename`    | Displays a filename in the header and auto-detects language from file extension | `<div class="highlight-it" data-filename="example.js">const foo = 'bar';</div>` |
| `data-theme`       | Sets the theme to 'light', 'dark', or 'auto' for the specific code block        | `<div class="highlight-it" data-theme="dark">const foo = 'bar';</div>`          |
| `data-with-lines`  | Adds line numbers to the code block                                             | `<div class="highlight-it" data-with-lines>const foo = 'bar';</div>`            |
| `data-line-start`  | Sets the starting line number for the code block and enables line numbers       | `<div class="highlight-it" data-line-start="10">const foo = 'bar';</div>`       |
| `data-no-header`   | Removes the header (hides language label but keeps copy button as floating)     | `<div class="highlight-it" data-no-header>const foo = 'bar';</div>`             |
| `data-no-copy`     | Hides the copy button                                                           | `<div class="highlight-it" data-no-copy>const foo = 'bar';</div>`               |
| `data-with-reload` | Enables live updates - code will be rehighlighted when content changes          | `<div class="highlight-it" data-with-reload data-language="javascript"></div>`  |

## Usage Example

```html
<!-- Auto-detect language -->
<div class="highlight-it">
const greeting = 'Hello, world!';
console.log(greeting);
</div>

<!-- Basic usage with language -->
<div class="highlight-it" data-language="javascript">
const greeting = 'Hello, world!';
console.log(greeting);
</div>

<!-- With filename and line numbers -->
<div class="highlight-it" data-filename="app.js" data-with-lines>
function calculateTotal(items) {
    return items
        .map((item) => item.price)
        .reduce((total, price) => total + price, 0);
}
</div>

<!-- With filename and line numbers starting from line 10 -->
<div class="highlight-it" data-filename="app.js" data-line-start="10">
function calculateTotal(items) {
	return items
		.map((item) => item.price)
		.reduce((total, price) => total + price, 0);
}
</div>

<!-- Dark theme without header -->
<div class="highlight-it" data-language="css" data-theme="dark" data-no-header>
.container {
	display: flex;
	justify-content: center;
}
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
	addHeader: true, // Add header section to code blocks
	addLines: false, // Add line numbers to code blocks
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
	language: 'javascript',
	addHeader: true,
	addCopyButton: true,
	addLines: false
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


## Development

1. Clone the repository

```bash
git clone https://github.com/tn3w/highlight-it.git
```

2. Install dependencies

```bash
npm install
```

3. Build the project

```bash
npm run build
```

Open `demo.html` in your browser to see the library in action.

## Coming soon?

### 🚀 Epic Features Coming Your Way!
- [ ] **Speak Any Code's Language**: Because your obscure programming language deserves some love too! 🗣️
- [ ] **Show Off Your Code**: Turn those beautiful snippets into shareable images. Perfect for Twitter bragging! 📸
- [ ] **Find That One Line**: Lost in your code? Our search feature will be your best friend! 🔍
- [ ] **Link Like a Pro**: Share exact lines of code. No more "it's somewhere in there"! 🔗
- [ ] **Chat About Code**: Leave comments on specific lines, because code reviews should be social! 💬
- [ ] **Time Travel**: Track code versions like a git ninja! ⏰
- [ ] **Share the Love**: Embed your awesome code anywhere and everywhere! 🌐
- [ ] **Code Playground**: Run JavaScript/Python right in the browser. What could go wrong? 🎮
- [ ] **Spot the Difference**: Side-by-side diffs that actually make sense! 👀
- [ ] **Code for Everyone**: Making sure everyone can enjoy your code, no exceptions! ♿
- [ ] **Spread the Word**: Share code snippets faster than you can say "Stack Overflow"! 🚀
- [ ] **Save for Later**: Bookmark those golden code snippets for future inspiration! 🔖

### 🛠️ Making Things Even More Awesome
- [ ] **Speed Demon**: Making big code blocks load faster than your coffee break ⚡
- [ ] **Mobile Magic**: Code that looks gorgeous even on tiny screens 📱
- [ ] **Theme Party**: Create themes that make your code look like a million bucks 🎨
- [ ] **Language Detective**: We'll figure out what language it is, probably! 🔍
- [ ] **Oops Handler**: Because sometimes things go wrong, and that's okay 🤷
- [ ] **Show & Tell**: More examples than you can shake a stick at! 📚
- [ ] **Bug Squashing**: Testing all the weird edge cases you can think of 🐛
- [ ] **Browser BFFs**: Works everywhere, even on your grandma's browser! 🌐
- [ ] **Diet Mode**: Keeping our bundle size slimmer than a JavaScript framework 🏋️
- [ ] **API Tales**: Documentation so good, you might actually read it! 📖

## License

Copyright 2025 TN3W

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.