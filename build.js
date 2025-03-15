const fs = require('fs')
const path = require('path')
const cssnano = require('cssnano')
const postcss = require('postcss')
const UglifyJS = require('uglify-js')
const prettier = require('prettier')

const distDir = path.resolve(__dirname, 'dist')
if (!fs.existsSync(distDir)) {
	fs.mkdirSync(distDir)
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))
const version = packageJson.version

const currentYear = new Date().getFullYear()
const licenseHeader = `/*!
 * HighlightIt v${version}
 * https://github.com/TN3W/highlight-it
 * (c) ${currentYear} TN3W
 * Released under the Apache 2.0 License
 */\n`

const highlightJsLicense = `/*!
 * highlight.js v11.11.1
 * Copyright (c) 2006, Ivan Sagalaev
 * Licensed under the BSD 3-Clause License
 * https://github.com/highlightjs/highlight.js/blob/main/LICENSE
 */\n`

async function processCssFile(filePath, variableName) {
	const css = fs.readFileSync(filePath, 'utf8')

	const result = await postcss([
		cssnano({
			preset: [
				'default',
				{
					discardComments: { removeAll: true },
					normalizeWhitespace: true
				}
			]
		})
	]).process(css, { from: filePath })

	return `const ${variableName} = "${result.css.replace(/"/g, '\\"').replace(/\n/g, '')}";`
}

function processJsFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf8')

	return content
		.replace(/import\s+(?:{[^}]*}\s+from\s+)?['"][^'"]+['"];?\n?/g, '')
		.replace(/export default HighlightIt;?\n?/g, '')
}

function extractCssImports(filePath, visitedFiles = new Set()) {
	if (visitedFiles.has(filePath)) {
		return []
	}
	visitedFiles.add(filePath)

	const content = fs.readFileSync(filePath, 'utf8')
	const directCssImports = []

	const cssImportRegex = /import\s+['"]\.\/([^'"]+\.css)['"];?\n?/g
	let match
	while ((match = cssImportRegex.exec(content))) {
		directCssImports.push(match[1])
	}

	return directCssImports
}

async function build() {
	console.log('Building highlight-it.js and highlight-it.min.js...')

	const tempDir = path.resolve(__dirname, 'temp')
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir)
	}

	const tempPackageJson = {
		name: 'highlight-it-temp',
		dependencies: {
			'highlight.js': '^11.11.1'
		}
	}

	fs.writeFileSync(
		path.resolve(tempDir, 'package.json'),
		JSON.stringify(tempPackageJson, null, 2)
	)

	console.log('Installing highlight.js...')
	const { execSync } = require('child_process')
	try {
		execSync('npm install', { cwd: tempDir, stdio: 'inherit' })
	} catch (error) {
		console.error('Failed to install highlight.js:', error)
		return
	}

	const hljsMainPath = path.resolve(tempDir, 'node_modules/highlight.js/lib/index.js')

	console.log('Reading highlight.js module...')

	const { rollup } = require('rollup')
	const nodeResolve = require('@rollup/plugin-node-resolve')
	const commonjs = require('@rollup/plugin-commonjs')

	try {
		execSync(
			'npm install --no-save rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs',
			{
				cwd: tempDir,
				stdio: 'inherit'
			}
		)

		console.log('Bundling highlight.js...')
		const bundle = await rollup({
			input: hljsMainPath,
			plugins: [nodeResolve(), commonjs()]
		})

		const { output } = await bundle.generate({
			format: 'iife',
			name: 'hljs'
		})

		const hljsCode = output[0].code
		const indexJsPath = path.resolve(__dirname, 'src/index.js')

		const cssImports = extractCssImports(indexJsPath)
		const cssVariables = []

		for (const cssFile of cssImports) {
			const cssPath = path.resolve(__dirname, 'src', cssFile)
			const varName = `${path.basename(cssFile, '.css').toUpperCase()}_CSS`
			const cssVar = await processCssFile(cssPath, varName)
			cssVariables.push(cssVar)
		}

		const indexJsContent = processJsFile(indexJsPath)
		const injectCssFunc = `
function injectCSS(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}`

		const stylesPath = path.resolve(tempDir, 'node_modules/highlight.js/styles')

		const defaultCssPath = path.resolve(stylesPath, 'default.css')
		const defaultCss = fs.readFileSync(defaultCssPath, 'utf8')
		const processedDefaultCss = await postcss([cssnano()]).process(defaultCss, {
			from: defaultCssPath
		})
		const defaultCssVar = `const DEFAULT_CSS = "${processedDefaultCss.css.replace(/"/g, '\\"').replace(/\n/g, '')}";`

		const cssVarNames = cssImports.length > 0 ? `STYLES_CSS` : ''

		const combinedCode = [
			'(function(global) {',
			...cssVariables,
			defaultCssVar,
			injectCssFunc,
			hljsCode,
			indexJsContent
				.replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
				.replace(/import\s+['"].*?['"];?/g, '')
				.replace(
					"if (typeof window !== 'undefined') {",
					`if (typeof window !== 'undefined') {\n  // Inject default highlight.js styles\n  injectCSS(DEFAULT_CSS);\n  ${cssVarNames ? '// Inject our custom styles\n  injectCSS(' + cssVarNames + ');' : ''}`
				),
			'if (typeof window !== "undefined") { window.HighlightIt = HighlightIt; window.HighlightIt.init(); }',
			'global.HighlightIt = HighlightIt;',
			'})(typeof window !== "undefined" ? window : this);'
		].join('\n\n')

		let formattedCode = combinedCode
		try {
			const prettierConfig = await prettier.resolveConfig(process.cwd())

			formattedCode = await prettier.format(combinedCode, {
				...prettierConfig,
				parser: 'babel',
				printWidth: 100,
				tabWidth: 2,
				semi: true,
				singleQuote: true,
				trailingComma: 'es5'
			})
		} catch (error) {
			console.warn('Warning: Could not format code with prettier:', error.message)
		}

		const unminifiedWithHeader = licenseHeader + highlightJsLicense + formattedCode
		fs.writeFileSync(path.resolve(distDir, 'highlight-it.js'), unminifiedWithHeader)

		const minified = UglifyJS.minify(combinedCode, {
			compress: {
				toplevel: true,
				unsafe: true,
				unsafe_math: true,
				unsafe_proto: true,
				unsafe_regexp: true,
				unsafe_Function: true,
				drop_console: true,
				pure_getters: true,
				passes: 3,
				global_defs: {
					DEBUG: false
				}
			},
			mangle: {
				toplevel: true,
				eval: true,
				keep_fnames: false,
				properties: {
					regex: /^_/
				}
			},
			output: {
				comments: /^!/,
				beautify: false
			}
		})

		if (minified.error) {
			console.error('Error minifying JavaScript:', minified.error)
			return
		}

		fs.writeFileSync(
			path.resolve(distDir, 'highlight-it.min.js'),
			licenseHeader + highlightJsLicense + minified.code
		)

		fs.rmSync(tempDir, { recursive: true, force: true })

		console.log('Build complete!')
	} catch (error) {
		console.error('Error building highlight-it:', error)
		throw error
	}
}

build()
	.then(() => {
		const { execSync } = require('child_process')
		const files = ['highlight-it.js', 'highlight-it.min.js']

		files.forEach((file) => {
			try {
				const filePath = path.resolve(distDir, file)
				const hash = execSync(
					`openssl dgst -sha512 -binary "${filePath}" | openssl base64 -A`
				).toString()
				console.log(`\nSRI hash for ${file}:`)
				console.log(`sha512-${hash}`)
			} catch (err) {
				console.warn(`Warning: Could not generate SRI hash for ${file}:`, err.message)
			}
		})
	})
	.catch((err) => {
		console.error('Build failed:', err)
		process.exit(1)
	})
