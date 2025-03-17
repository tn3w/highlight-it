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
 * https:
 * (c) ${currentYear} TN3W
 * Released under the Apache 2.0 License
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

async function processCssThemes(stylesDir) {
	const files = fs.readdirSync(stylesDir)
	const cssFiles = files.filter((file) => file.endsWith('.css') && !file.endsWith('.min.css'))
	const themeGroups = new Map()

	cssFiles.forEach((file) => {
		const baseName = file
			.replace(/-light(-[^.]+)?\.css$/, '')
			.replace(/-dark(-[^.]+)?\.css$/, '')
			.replace(/\.css$/, '')

		if (!themeGroups.has(baseName)) {
			themeGroups.set(baseName, [])
		}
		themeGroups.get(baseName).push(file)
	})

	for (const [baseName, relatedFiles] of themeGroups) {
		const hasLight = relatedFiles.some((f) => f.includes('-light'))
		const hasDark = relatedFiles.some((f) => f.includes('-dark'))

		if (relatedFiles.length === 1 && !hasLight && !hasDark) {
			continue
		}

		let lightContent = ''
		let darkContent = ''
		let darkVariants = new Map()

		for (const file of relatedFiles) {
			const content = fs.readFileSync(path.join(stylesDir, file), 'utf8')

			if (file.includes('-light')) {
				lightContent = content
			} else if (file.includes('-dark')) {
				const match = file.match(/-dark(-[^.]+)?\.css$/)
				if (match && match[1]) {
					darkVariants.set(match[1], content)
				} else {
					darkContent = content
				}
			} else if (!hasLight && !file.includes('-dark')) {
				lightContent = content
			} else if (!hasDark && !file.includes('-light')) {
				darkContent = content
			}
		}

		if (!lightContent && !darkContent) {
			const baseContent = fs.readFileSync(path.join(stylesDir, relatedFiles[0]), 'utf8')
			darkContent = baseContent
		} else if (!lightContent) {
			const baseFile = relatedFiles.find((f) => !f.includes('-dark'))
			if (baseFile) {
				lightContent = fs.readFileSync(path.join(stylesDir, baseFile), 'utf8')
			}
		} else if (!darkContent) {
			const baseFile = relatedFiles.find((f) => !f.includes('-light'))
			if (baseFile) {
				darkContent = fs.readFileSync(path.join(stylesDir, baseFile), 'utf8')
			}
		}

		let combinedContent = ''

		const licenseHeaders = new Set()
		const extractLicense = (content) => {
			const match = content.match(/\/\*![\s\S]*?\*\//g)
			if (match && match[0]) {
				const header = match[0]
				if (!Array.from(licenseHeaders).some((h) => h.includes(header.split('\n')[1]))) {
					licenseHeaders.add(header)
				}
			}
		}

		if (lightContent) extractLicense(lightContent)
		if (darkContent) extractLicense(darkContent)

		combinedContent = Array.from(licenseHeaders).join('\n') + '\n\n'

		const removeLicenseHeaders = (content) => {
			return content.replace(/\/\*![\s\S]*?\*\//g, '').trim()
		}

		const baseStyles =
			removeLicenseHeaders(lightContent).match(
				/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g
			) || []
		combinedContent += baseStyles.join('\n\n') + '\n\n'

		if (darkContent) {
			const darkTheme = removeLicenseHeaders(darkContent).replace(
				/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g,
				''
			)
			combinedContent += ':root {\n'
			combinedContent += darkTheme.replace(/\.hljs/g, '.hljs').trim()
			combinedContent += '\n}\n\n'
		}

		if (lightContent) {
			const lightTheme = removeLicenseHeaders(lightContent).replace(
				/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g,
				''
			)
			combinedContent += '.highlightit-theme-light {\n'
			combinedContent += lightTheme.replace(/\.hljs/g, '.hljs').trim()
			combinedContent += '\n}\n\n'

			combinedContent += '@media (prefers-color-scheme: light) {\n'
			combinedContent += '  :root.highlightit-theme-auto {\n'
			combinedContent += lightTheme
				.replace(/\.hljs/g, '.hljs')
				.trim()
				.split('\n')
				.map((line) => '    ' + line)
				.join('\n')
			combinedContent += '\n  }\n}\n\n'

			combinedContent += '.highlightit-container[data-theme="light"],\n'
			combinedContent += '.highlightit-container pre[data-theme="light"],\n'
			combinedContent += '.highlightit-container code[data-theme="light"] {\n'
			combinedContent += lightTheme
				.replace(/\.hljs/g, '.hljs')
				.trim()
				.split('\n')
				.map((line) => '  ' + line)
				.join('\n')
			combinedContent += '\n}\n\n'
		}

		if (darkContent) {
			combinedContent += '.highlightit-container[data-theme="dark"],\n'
			combinedContent += '.highlightit-container pre[data-theme="dark"],\n'
			combinedContent += '.highlightit-container code[data-theme="dark"] {\n'
			combinedContent += removeLicenseHeaders(darkContent)
				.replace(/\.hljs/g, '.hljs')
				.replace(/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g, '')
				.trim()
				.split('\n')
				.map((line) => '  ' + line)
				.join('\n')
			combinedContent += '\n}\n'
		}

		for (const [variant, variantContent] of darkVariants) {
			if (lightContent) {
				const variantFilename = `${baseName}${variant}.css`
				const variantCombined =
					Array.from(licenseHeaders).join('\n') +
					'\n\n' +
					baseStyles.join('\n\n') +
					'\n\n' +
					':root {\n' +
					removeLicenseHeaders(variantContent)
						.replace(/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g, '')
						.replace(/\.hljs/g, '.hljs')
						.trim() +
					'\n}\n\n' +
					'.highlightit-theme-light {\n' +
					removeLicenseHeaders(lightContent)
						.replace(/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g, '')
						.replace(/\.hljs/g, '.hljs')
						.trim() +
					'\n}\n\n' +
					'@media (prefers-color-scheme: light) {\n' +
					'  :root.highlightit-theme-auto {\n' +
					removeLicenseHeaders(lightContent)
						.replace(/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g, '')
						.replace(/\.hljs/g, '.hljs')
						.trim()
						.split('\n')
						.map((line) => '    ' + line)
						.join('\n') +
					'\n  }\n}\n\n' +
					'.highlightit-container[data-theme="light"],\n' +
					'.highlightit-container pre[data-theme="light"],\n' +
					'.highlightit-container code[data-theme="light"] {\n' +
					removeLicenseHeaders(lightContent)
						.replace(/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g, '')
						.replace(/\.hljs/g, '.hljs')
						.trim()
						.split('\n')
						.map((line) => '  ' + line)
						.join('\n') +
					'\n}\n\n' +
					'.highlightit-container[data-theme="dark"],\n' +
					'.highlightit-container pre[data-theme="dark"],\n' +
					'.highlightit-container code[data-theme="dark"] {\n' +
					removeLicenseHeaders(variantContent)
						.replace(/\.hljs/g, '.hljs')
						.replace(/pre code\.hljs[\s\S]*?}|code\.hljs[\s\S]*?}/g, '')
						.trim()
						.split('\n')
						.map((line) => '  ' + line)
						.join('\n') +
					'\n}\n'

				try {
					const prettierConfig = await prettier.resolveConfig(process.cwd())
					const formattedVariant = await prettier.format(variantCombined, {
						...prettierConfig,
						parser: 'css',
						printWidth: 100,
						tabWidth: 2,
						semi: true,
						singleQuote: true
					})
					fs.writeFileSync(path.join(stylesDir, variantFilename), formattedVariant)
				} catch (error) {
					console.warn(
						`Warning: Could not format variant CSS with prettier:`,
						error.message
					)
					fs.writeFileSync(path.join(stylesDir, variantFilename), variantCombined)
				}

				const minified = await postcss([cssnano()]).process(
					removeLicenseHeaders(variantCombined),
					{
						from: path.join(stylesDir, variantFilename)
					}
				)
				fs.writeFileSync(
					path.join(stylesDir, variantFilename.replace('.css', '.min.css')),
					Array.from(licenseHeaders).join('\n') + '\n' + minified.css
				)
			}
		}

		const outputFilename = `${baseName}.css`

		try {
			const prettierConfig = await prettier.resolveConfig(process.cwd())
			const formatted = await prettier.format(combinedContent, {
				...prettierConfig,
				parser: 'css',
				printWidth: 100,
				tabWidth: 2,
				semi: true,
				singleQuote: true
			})
			fs.writeFileSync(path.join(stylesDir, outputFilename), formatted)
		} catch (error) {
			console.warn('Warning: Could not format CSS with prettier:', error.message)
			fs.writeFileSync(path.join(stylesDir, outputFilename), combinedContent)
		}

		const minified = await postcss([cssnano()]).process(removeLicenseHeaders(combinedContent), {
			from: path.join(stylesDir, outputFilename)
		})
		fs.writeFileSync(
			path.join(stylesDir, outputFilename.replace('.css', '.min.css')),
			Array.from(licenseHeaders).join('\n') + '\n' + minified.css
		)

		relatedFiles.forEach((file) => {
			if (file !== outputFilename && file !== outputFilename.replace('.css', '.min.css')) {
				const filePath = path.join(stylesDir, file)
				const minFilePath = filePath.replace('.css', '.min.css')
				if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
				if (fs.existsSync(minFilePath)) fs.unlinkSync(minFilePath)
			}
		})
	}
}

async function build() {
	console.log('Building highlight-it.js and highlight-it-min.js...')

	const tempDir = path.resolve(__dirname, 'temp')
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir)
	}

	const tempPackageJson = {
		name: 'highlight-it-temp',
		dependencies: {
			'highlight.js': 'latest'
		}
	}

	fs.writeFileSync(
		path.resolve(tempDir, 'package.json'),
		JSON.stringify(tempPackageJson, null, 2)
	)

	console.log('Installing latest highlight.js...')
	const { execSync } = require('child_process')

	try {
		execSync('npm install --no-audit --no-fund', { cwd: tempDir, stdio: 'inherit' })
	} catch (error) {
		console.error('Failed to install highlight.js:', error)
		return
	}

	const hljsPackageJson = JSON.parse(
		fs.readFileSync(path.resolve(tempDir, 'node_modules/highlight.js/package.json'), 'utf8')
	)
	const hljsVersion = hljsPackageJson.version
	console.log(`Using highlight.js version ${hljsVersion}`)

	const highlightJsLicense = `/*!
 * highlight.js v${hljsVersion}
 * Copyright (c) 2006, Ivan Sagalaev
 * Licensed under the BSD 3-Clause License
 * https:
 */\n`

	const stylesDir = path.resolve(distDir, 'styles')
	if (!fs.existsSync(stylesDir)) {
		fs.mkdirSync(stylesDir)
	}

	const hljsStylesPath = path.resolve(tempDir, 'node_modules/highlight.js/styles')
	console.log('Processing highlight.js styles...')

	const allStyleFiles = fs.readdirSync(hljsStylesPath)

	allStyleFiles
		.filter((file) => file.endsWith('.css'))
		.forEach((styleFile) => {
			const sourcePath = path.resolve(hljsStylesPath, styleFile)
			const destPath = path.resolve(stylesDir, styleFile)
			fs.copyFileSync(sourcePath, destPath)
		})

	await processCssThemes(stylesDir)

	console.log(`Copied ${allStyleFiles.length} highlight.js style files to dist/styles`)

	const hljsMainPath = path.resolve(tempDir, 'node_modules/highlight.js/lib/index.js')

	console.log('Reading highlight.js module...')

	const { rollup } = require('rollup')
	const nodeResolve = require('@rollup/plugin-node-resolve')
	const commonjs = require('@rollup/plugin-commonjs')

	try {
		execSync(
			'npm install --no-save --no-audit --no-fund --no-package-lock rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs',
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

		const [cssImports, indexJsContent] = await Promise.all([
			Promise.resolve(extractCssImports(indexJsPath)),
			Promise.resolve(processJsFile(indexJsPath))
		])

		const cssVariablePromises = cssImports.map(async (cssFile) => {
			const cssPath = path.resolve(__dirname, 'src', cssFile)
			const varName = `${path.basename(cssFile, '.css').toUpperCase()}_CSS`
			return processCssFile(cssPath, varName)
		})

		const cssVariables = await Promise.all(cssVariablePromises)

		const injectCssFunc = `
function injectCSS(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}`

		const combinedCode = [
			'(function(global) {',
			...cssVariables,
			injectCssFunc,
			hljsCode,
			indexJsContent
				.replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
				.replace(/import\s+['"].*?['"];?/g, ''),
			'global.HighlightIt = HighlightIt;',
			'if (typeof window !== "undefined") {',
			'  window.HighlightIt = HighlightIt;',
			'  injectCSS(STYLES_CSS);',
			'}',
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

		console.log('Minifying JavaScript...')
		const minified = UglifyJS.minify(combinedCode, {
			compress: {
				toplevel: true,
				unsafe: false,
				unsafe_math: false,
				unsafe_proto: false,
				unsafe_regexp: false,
				unsafe_Function: false,
				drop_console: true,
				pure_getters: true,
				passes: 2,
				global_defs: {
					DEBUG: false
				},
				dead_code: true,
				drop_debugger: true,
				keep_fargs: false,
				keep_infinity: true,
				reduce_vars: true,
				unused: true,
				hoist_funs: false,
				hoist_vars: false,
				inline: false,
				join_vars: true,
				sequences: true,
				conditionals: true,
				booleans: true,
				if_return: true,
				collapse_vars: true,
				reduce_funcs: false,
				merge_vars: true,
				negate_iife: false
			},
			mangle: {
				toplevel: true,
				eval: true,
				keep_fnames: false,
				properties: {
					regex: /^_/,
					keep_quoted: false,
					debug: false
				},
				keep_fargs: false
			},
			output: {
				comments: /^!/,
				beautify: false,
				ascii_only: true,
				wrap_iife: true
			}
		})

		if (minified.error) {
			console.error('Error minifying JavaScript:', minified.error)
			return
		}

		fs.writeFileSync(
			path.resolve(distDir, 'highlight-it-min.js'),
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
		const files = ['highlight-it.js', 'highlight-it-min.js']

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
