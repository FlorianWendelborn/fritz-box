/**
 * @description replaces all Unicode characters > 255 with a `.`
 * And yes, this implies that all passwords containing special characters are the same. m(
 */
export function reduceString (input) {
	let result = ''
	for (let i = 0; i < input.length; i++) {
		result += input.charCodeAt(i) > 255 ? '.' : input.charAt(i)
	}
	return result
}

/**
 * @description (true, false) → ('on', 'off')
 */
export const onify = bool => bool
	? 'on'
	: 'off'
