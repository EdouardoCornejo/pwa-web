module.exports = {
	globDirectory: 'build/',
	globPatterns: [
		'**/*.{json,ico,svg,html,png,txt,css,js}'
	],
	swDest: 'build/sw.js',
	// ignoreURLParametersMatching: [
	// 	/^utm_/,
	// 	/^fbclid$/
	// ],
	swSrc: 'src/sw-template.js' // generate sw no funciona con esta propiedad

};