import { URL } from 'url';
import url from 'url';

import cheerio from 'cheerio'
import request from 'superagent'

import {md5} from './crypto'
import {onify, reduceString} from './utilities'

/**
 * @description main class
 */
export default class FritzBoxAPI {
	constructor ({host, password, username, allowSelfSignedCertificate = false}) {
		Object.assign(this, {
			host,
			password,
			username
		});

        // TODO: superagent doesn't support selectively allowing self signed certificates. Migrate
        // to other request library. See: https://github.com/visionmedia/superagent/issues?utf8=%E2%9C%93&q=certificate
        if (allowSelfSignedCertificate) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
        }
	}

	/**
	 * @description FRITZ!Box wants this format (md5 encoding is ucs-2):
	 * response = challenge + '-' + md5.hex(challenge + '-' + password)
	 */
	async getSession() {
		let index;

		try {
			index = await request
				.get(this.api('/'))
		} catch (error) {
			throw error;
		}

		// get challenge
		const matches = index.text.match(/"challenge":\s*"(.+?)",/);
		const challenge = matches
			? matches[1]
			: null;
		if (!challenge) throw (new Error('Unable to decode challenge'));

		// solve challenge & attempt sign-in
		try {
			const signIn = await request
				.post(this.api('/'))
				.type('form')
				.send({
					response: `${challenge}-${md5(`${challenge}-${reduceString(this.password)}`)}`,
					username: this.username
				})

			// get sessionID
			const start = signIn.text.indexOf('?sid=');
			const stop = signIn.text.indexOf('&', start);
			return this.sessionID = signIn.text.substring(start + 5, stop)
		} catch (error) {
			throw new Error(`could not get session`)
		}
	}

	/**
	 * @description retrieves guest WLAN settings
	 */
	async getGuestWLAN() {
		try {
			const response = await request
				.post(this.api('/data.lua'))
				.type('form')
				.send({
					sid: this.sessionID,
					page: 'wGuest'
				})
			const $ = cheerio.load(response.text);
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
				security: $('#uiSecMode').val()
			}
		} catch (error) {
            throw error;
		}
	}

    /**
     * @description Retrieves connected clients
     */
    async getConnectedClients() {
        try {
            const response = await request
                .post(this.api('/data.lua'))
                .type('form')
                .send({
                    sid: this.sessionID,
                    page: 'homeNet'
                });

            const $ = cheerio.load(response.text);

            const devices = $(".dev_lan").map(function() {
				const deviceLink = url.parse($('.details > .textlink', this).attr('href'), true);

                return {
					id: deviceLink.query.dev,
                    name: $('.name', this).attr('title')
                }
            }).get();

            return devices;
        } catch (error) {
            throw error;
        }
    }

    /**
	 * @description Get client details
	 */
    async getClientDetails(id) {
        try {
            const response = await request
                .post(this.api('/data.lua'))
                .type('form')
                .send({
                    sid: this.sessionID,
                    dev: id,
                    oldpage: '/net/edit_device.lua'
                });

            const $ = cheerio.load(response.text);

            return {
                id,
                name: $('#uiViewDeviceName').val(),
                ip: $('#uiViewDeviceIP').val(),
                mac: $('#uiDetailsMacContent').html().substring(0, 17)
            }
        } catch (error) {
            throw error;
        }
    }

	/**
	 * @description saves guest WLAN settings
	 */
	async setGuestWLAN({ssid, key, active, limited, terms, allowCommunication, autoDisable, waitForLastGuest, deactivateAfter, security}) {
		const template = {
			sid: this.sessionID,
			xhr: 1,
			lang: 'de',
			no_sidrenew: '',
			autoupdate: 'on',
			apply: '',
			oldpage: '/wlan/guest_access.lua'
		}
		try {
			const response = await request
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

			if (!active) {
				// deactivate guest WLAN
				await request
					.post(this.api('/data.lua'))
					.type('form')
					.send(template)
			}
		} catch (error) {
			throw new Error('Could not set guest WLAN')
		}
	}

	async overview() {
		try {
			const response = await request
				.post(this.api('/data.lua'))
				.type('form')
				.send({
					sid: this.sessionID,
					xhr: 1,
					lang: 'de',
					page: 'overview',
					type: 'all',
					no_sidrenew: ''
				})

			return JSON.parse(response.text)
		} catch (error) {
			throw error;
		}
	}

	api(endpoint) {
		return `https://${this.host}${endpoint}`;
	}
}
