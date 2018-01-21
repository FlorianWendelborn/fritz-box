// region import
import cheerio from 'cheerio'
import request from 'superagent'
import url from 'url'

// internal
import { fixPassword, onify } from './utilities'
import { md5 } from './crypto'
// endregion

/**
 * @description main class
 */
export default class FritzBoxAPI {
	constructor({
		host,
		password,
		username,
		secure = false,
		allowSelfSignedCertificate = false,
	}) {
		Object.assign(this, {
			host,
			password,
			username,
			secure,
		})

		// TODO: superagent doesn't support selectively allowing self signed certificates. Migrate to another
		// request library. See: https://github.com/visionmedia/superagent/issues?utf8=%E2%9C%93&q=certificate
		if (allowSelfSignedCertificate) process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
	}

	/**
	 * @description FRITZ!Box wants this format (md5 encoding is ucs-2):
	 * response = challenge + '-' + md5.hex(challenge + '-' + password)
	 * @returns {String} sessionId
	 */
	async getSession() {
		const index = await request.get(this.api('/'))

		// get challenge
		const matches = index.text.match(/"challenge":\s*"(.+?)",/)
		const challenge = matches ? matches[1] : null
		if (!challenge) throw new Error('Unable to decode challenge')

		// solve challenge & attempt sign-in

		const signIn = await request
			.post(this.api('/'))
			.type('form')
			.send({
				response: `${challenge}-${md5(
					`${challenge}-${fixPassword(this.password)}`
				)}`,
				username: this.username,
			})

		// get sessionID
		const start = signIn.text.indexOf('?sid=')
		const stop = signIn.text.indexOf('&', start)
		return (this.sessionID = signIn.text.substring(start + 5, stop))
	}

	/**
	 * @description retrieves guest WLAN settings
	 * @returns {Object} WLAN settings
	 */
	async getGuestWLAN() {
		const response = await request
			.post(this.api('/data.lua'))
			.type('form')
			.send({
				sid: this.sessionID,
				page: 'wGuest',
			})
		const $ = cheerio.load(response.text)
		return {
			ssid: $('#uiViewGuestSsid').val(),
			key: $('#uiViewWpaKey').val(),
			active: $('#uiViewActivateGuestAccess').is(':checked'),
			limited: $('#uiGroupAccess').is(':checked'),
			terms: $('#uiUntrusted').is(':checked'),
			allowCommunication: $('#uiUiUserIsolation').is(':checked'),
			autoDisable: $('#uiViewDownTimeActiv').is(':checked'),
			waitForLastGuest: $('#uiViewDisconnectGuestAccess').is(':checked'),
			deactivateAfter: $('#uiViewDownTime').val(),
			security: $('#uiSecMode').val(),
		}
	}

	/**
	 * @description Retrieves connected clients
	 * @returns {Object} connected clients
	 */
	async getConnectedClients() {
		const response = await request
			.post(this.api('/data.lua'))
			.type('form')
			.send({
				sid: this.sessionID,
				page: 'homeNet',
			})

		const $ = cheerio.load(response.text)

		const devices = $('.dev_lan')
			.map(function() {
				const deviceLink = url.parse(
					$('.details > .textlink', this).attr('href'),
					true
				)

				return {
					id: deviceLink.query.dev,
					name: $('.name', this).attr('title'),
				}
			})
			.get()

		return devices
	}

	/**
	 * @description Gathers more information about a specific device.
	 * @param {String} id device Id
	 * @returns {Object} device details
	 */
	async getDeviceDetails(id) {
		const response = await request
			.post(this.api('/data.lua'))
			.type('form')
			.send({
				sid: this.sessionID,
				dev: id,
				oldpage: '/net/edit_device.lua',
			})

		const $ = cheerio.load(response.text)

		return {
			id,
			name: $('#uiViewDeviceName').val(),
			ip: $('#uiViewDeviceIP').val(),
			mac: $('#uiDetailsMacContent')
				.html()
				.substring(0, 17),
		}
	}

	/**
	 * @description saves guest WLAN settings
	 */
	async setGuestWLAN({
		active,
		allowCommunication,
		autoDisable,
		deactivateAfter,
		key,
		limited,
		security,
		ssid,
		terms,
		waitForLastGuest,
	}) {
		const template = {
			sid: this.sessionID,
			xhr: 1,
			lang: 'de',
			no_sidrenew: '',
			autoupdate: 'on',
			apply: '',
			oldpage: '/wlan/guest_access.lua',
		}

		const response = await request
			.post(this.api('/data.lua'))
			.type('form')
			.send(template)
			.send({
				activate_guest_access: onify(active),
				disconnect_guest_access: onify(waitForLastGuest),
				down_time_activ: onify(autoDisable),
				down_time_value: deactivateAfter,
				guest_ssid: ssid,
				sec_mode: security,
				wpa_key: key,
			})

		// deactivate guest WLAN
		if (!active)
			await request
				.post(this.api('/data.lua'))
				.type('form')
				.send(template)
	}

	/**
	 * @description retrieves a network overviews
	 * @returns {Object} overview
	 */
	async overview() {
		const response = await request
			.post(this.api('/data.lua'))
			.type('form')
			.send({
				sid: this.sessionID,
				xhr: 1,
				lang: 'de',
				page: 'overview',
				type: 'all',
				no_sidrenew: '',
			})

		return JSON.parse(response.text)
	}

	/**
	 * @description helper method
	 * @param {String} endpoint API endpoint
	 * @returns {String} API endpoint URL
	 */
	api(endpoint) {
		return `http${this.secure ? 's' : ''}://${this.host}${endpoint}`
	}
}
