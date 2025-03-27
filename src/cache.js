/**
 * Cache for commonly used data in the highlighting process
 */

const cache = {
	popularLanguages: new Set([
		'javascript',
		'typescript',
		'python',
		'java',
		'html',
		'css',
		'scss',
		'php',
		'ruby',
		'go',
		'rust',
		'c',
		'cpp',
		'csharp',
		'bash',
		'json',
		'markdown',
		'yaml',
		'xml'
	]),
	extensionMap: new Map([
		['js', 'javascript'],
		['ts', 'typescript'],
		['jsx', 'javascript'],
		['tsx', 'typescript'],
		['html', 'html'],
		['css', 'css'],
		['scss', 'scss'],
		['sass', 'scss'],
		['py', 'python'],
		['rb', 'ruby'],
		['java', 'java'],
		['c', 'c'],
		['cpp', 'cpp'],
		['cs', 'csharp'],
		['php', 'php'],
		['go', 'go'],
		['rust', 'rust'],
		['rs', 'rust'],
		['swift', 'swift'],
		['md', 'markdown'],
		['json', 'json'],
		['xml', 'xml'],
		['yaml', 'yaml'],
		['yml', 'yaml'],
		['sh', 'bash'],
		['bash', 'bash']
	]),
	htmlEscapes: new Map([
		['&', '&amp;'],
		['<', '&lt;'],
		['>', '&gt;'],
		['"', '&quot;'],
		["'", '&#39;'],
		['/', '&#x2F;'],
		['`', '&#x60;'],
		['=', '&#x3D;']
	]),
	svgIcons: {
		copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="highlightit-copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
		check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="highlightit-check-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
		share: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="highlightit-share-icon"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`
	}
}

export default cache
