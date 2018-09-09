import dayjs from 'dayjs'

export class FritzBoxError extends Error {
	constructor(message, error) {
		return super(`fritz-box: ${message} (${error.message})`)
	}
}

export const parseLogEntry = dateHeader => ([
	rawDate,
	rawTime,
	rawMessage,
	rawHelpCode,
	rawLogType,
	rawHelpLink,
]) => {
	// parse raw dates
	const [date, month, year] = rawDate.split('.')
	const [hour, minute, second] = rawTime.split(':')
	let d = dayjs(
		new Date(Date.UTC(`20${year}`, month, date, hour, minute, second))
	)

	// handle fritzbox time zone
	const serverTimezoneOffset = new Date(dateHeader).getTimezoneOffset()
	d = d.add(serverTimezoneOffset, 'minute')

	// convert log types
	const type = {
		1: 'system',
		2: 'internet',
		3: 'phone',
		4: 'wlan',
		5: 'usb',
	}[rawLogType]

	// @TODO parse log entries and return a message object

	// don’t return helpLink since it leaks session IDs
	return {
		date: d.toDate(),
		helpCode: rawHelpCode,
		isoDate: d.toISOString(),
		raw: {
			date: rawDate,
			helpCode: rawHelpCode,
			logType: rawLogType,
			message: rawMessage,
			time: rawTime,
		},
		type,
	}
}

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
