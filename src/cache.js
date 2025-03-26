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
	])
}

export default cache
