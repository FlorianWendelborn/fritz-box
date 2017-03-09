// region import

import crypto from 'crypto'

// endregion

// region md5

/**
 * @description ucs-2 encoded string → MD5 → hex
 */
export const md5 = string => crypto
	.createHash('md5')
	.update(new Buffer(string, 'ucs-2'))
	.digest('hex')

// endregion
