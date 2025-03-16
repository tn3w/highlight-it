# highlight-it

A lightweight syntax highlighting library with themes, line numbers, and copy functionality.

## Data Attributes

HighlightIt supports the following data attributes to customize the appearance and behavior of code blocks:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-language` | Specifies the programming language for syntax highlighting | `<div class="highlight-it" data-language="javascript">const foo = 'bar';</div>` |
| `data-filename` | Displays a filename in the header and auto-detects language from file extension | `<div class="highlight-it" data-filename="example.js">const foo = 'bar';</div>` |
| `data-theme` | Sets the theme to 'light', 'dark', or 'auto' for the specific code block | `<div class="highlight-it" data-theme="dark">const foo = 'bar';</div>` |
| `data-with-lines` | Adds line numbers to the code block | `<div class="highlight-it" data-with-lines>const foo = 'bar';</div>` |
| `data-no-header` | Removes the header (hides language label but keeps copy button as floating) | `<div class="highlight-it" data-no-header>const foo = 'bar';</div>` |

## Usage Example

```html
<!-- Basic usage with language -->
<div class="highlight-it" data-language="javascript">
const greeting = 'Hello, world!';
console.log(greeting);
</div>

<!-- With filename and line numbers -->
<div class="highlight-it" data-filename="app.js" data-with-lines>
function calculateTotal(items) {
    return items
        .map(item => item.price)
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
```

## Initialization

To initialize HighlightIt with custom options:

```javascript
// Default configuration
HighlightIt.init();

// Custom configuration
HighlightIt.init({
    selector: '.custom-code', // Custom CSS selector
    autoDetect: true,         // Auto-detect language if not specified
    addCopyButton: true,      // Add copy button to code blocks
    showLanguage: true,       // Show language label in header
    theme: 'auto'             // Global theme (light, dark, auto)
});
```
