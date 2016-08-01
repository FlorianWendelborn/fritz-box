require('babel-polyfill');
import request from 'superagent';
import cheerio from 'cheerio';
import crypto from 'crypto';

/**
 * @description replaces all Unicode characters > 255 with a `.`
 */
function reduceString (input) {
	let result = "";
	for (let i = 0; i < input.length; i++) {
		result += input.charCodeAt(i) > 255 ? '.' : input.charAt(i);
	}
	return result;
}

/**
 * @description ucs-2 encoded string → MD5 → hex
 */
function md5 (str) {
	return crypto.createHash('md5').update(new Buffer(str, 'ucs-2')).digest('hex');
}

/**
 * @description (true, false) → ('on', 'off')
 */
function onify (bool) {
	return bool ? 'on' : 'off';
}

/**
 * @description main class
 */
export default class FritzBoxAPI {

	constructor ({username, password, host}) {
		Object.assign(this, {
			username,
			password,
			host
		});
	}

	/**
	 * @description FRITZ!Box wants this format (md5 encoding is ucs-2):
	 * response = challenge + '-' + md5.hex(challenge + '-' + password)
	 */
	getSession () {

		const {username, password} = this;
		const that = this;

		return new Promise((resolve, reject) => {
			request
				.get(this.api('/'))
				.end((error, {text} = {}) => {
					// get challenge
					const valueStart = text.indexOf('"challenge": ') + 14;
					const valueEnd = text.indexOf('",', valueStart);
					const challenge = text.substring(valueStart, valueEnd);

					// solve challenge
					const response = `${challenge}-${md5(`${challenge}-${reduceString(password)}`)}`;

					request
						.post(this.api('/'))
						.type('form')
						.send({
							response,
							username
						})
						.end((error, {text} = {}) => {
							if (error) return reject(error);

							// get sessionID
							const start = text.indexOf('?sid=');
							const stop = text.indexOf('&', start);
							that.sessionID = text.substring(start + 5, stop);

							resolve(that.sessionID);
						});
			});
		});
	}

	/**
	 * @description retrieves guest WLAN settings
	 */
	getGuestWLAN () {

		const {sessionID} = this;

		return new Promise((resolve, reject) => {
			request
				.post(this.api('/data.lua'))
				.type('form')
				.send({
					sid: sessionID,
					page: 'wGuest'
				})
				.end((error, {text} = {}) => {
					if (error) return reject(error);
					const $ = cheerio.load(text);
					resolve({
						ssid: $('#uiViewGuestSsid').val(),
						key: $('#uiViewWpaKey').val(),
						active: $('#uiViewActivateGuestAccess').is(':checked'),
						limited: $('#uiGroupAccess').is(':checked'),
						terms: $('#uiUntrusted').is(':checked'),
						allowCommunication: $('#uiUiUserIsolation').is(':checked'),
						autoDisable: $('#uiViewDownTimeActiv').is(':checked'),
						waitForLastGuest: $('#uiViewDisconnectGuestAccess').is(':checked'),
						deactivateAfter: $('#uiViewDownTime').val(),
						security: $('#uiSecMode').val()
					});
				});
		});
	}

	/**
	 * @description saves guest WLAN settings
	 */
	setGuestWLAN ({ssid, key, active, limited, terms, allowCommunication, autoDisable, waitForLastGuest, deactivateAfter, security}) {

		const template = {
			sid: this.sessionID,
			xhr: 1,
			lang: 'de',
			no_sidrenew: '',
			autoupdate: 'on',
			apply: '',
			oldpage: '/wlan/guest_access.lua'
		};

		return new Promise((resolve, reject) => {
			request
				.post(this.api('/data.lua'))
				.type('form')
				.send(template)
				.send({
					activate_guest_access: onify(active),
					guest_ssid: ssid,
					sec_mode: security,
					wpa_key: key,
					down_time_activ: onify(autoDisable),
					down_time_value: deactivateAfter,
					disconnect_guest_access: onify(waitForLastGuest),
				})
				.end((error, {text} = {}) => {
					if (error) return reject(error);
					if (active) return resolve(text);

					// deactivate guest WLAN
					request
						.post(this.api('/data.lua'))
						.type('form')
						.send(template)
						.end((error, {text} = {}) => {
							if (error) return reject(error);
							resolve(text);
						})
					;
				})
			;
		});
	}

	overview () {

		const template = {
			sid: this.sessionID,
			xhr: 1,
			lang: 'de',
			page: 'overview',
			type: 'all',
			no_sidrenew: ''
		};

		return new Promise((resolve, reject) => {
			request
				.post(this.api('/data.lua'))
				.type('form')
				.send(template)
				.end((error, response) => {
					console.log(error, JSON.parse(response.text));
				})
			;
		});
	}

	api (endpoint) {
		return `http://${this.host}${endpoint}`;
	}

}
