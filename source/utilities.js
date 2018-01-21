/**
 * @description Replaces all Unicode characters > 255 with a `.`.
 * And yes, this implies that all passwords containing special characters are the same. m(
 * @param {String} input password
 * @returns {String} less secure password
 */
export function fixPassword(input) {
	let result = ''

	for (let i = 0; i < input.length; i++)
		result += input.charCodeAt(i) > 255 ? '.' : input.charAt(i)

	return result
}

/**
 * @description (true, false) → ('on', 'off')
 * @param {Boolean} bool input boolean
 * @returns {String} 'on' or 'off'
 */
export const onify = bool => (bool ? 'on' : 'off')
