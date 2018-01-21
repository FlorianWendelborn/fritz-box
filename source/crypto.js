import { createHash } from 'crypto'

/**
 * @description ucs-2 encoded string → MD5 → hex
 */
export const md5 = string =>
	createHash('md5')
		.update(new Buffer(string, 'ucs-2'))
		.digest('hex')
