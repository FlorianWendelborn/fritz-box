# Fritz Box

> Node.js (7.6+) FRITZ!Box API.

[![Slack](https://slack.dodekeract.com/badge.svg)](https://slack.dodekeract.com)
[![NPM Downloads](https://img.shields.io/npm/dm/fritz-box.svg)](https://npmjs.com/package/fritz-box)

The whole library is promise/async-based, so it's best to use this in ES6+ code.

Tested in FRITZ!OS 6.80 on a FRITZ!Box 3490.

## Examples

### Basic

```javascript
const box = new FritzBoxAPI({
	host: 'fritz.box',
	password: '...',
	username: '...'
})

const run = async () => {
	await box.getSession()
	const settings = await box.getGuestWLAN()
	settings.active = true
	settings.ssid = 'Example!'
	await box.setGuestWLAN(settings)
	console.log(await box.overview())
}

run()
```

### IFTTT Notify

This will activate the guest WLAN and emit a IFTTT Maker channel notify event. If you create the fitting IFTTT recipe, this snippet should send you the WLAN password right to your smartphone.

```javascript
import FritzBoxAPI from 'fritz-box'
import IFTTT from 'maker-ifttt'

const box = new FritzBoxAPI({
	host: 'fritz.box',
	password: '...',
	username: '...'
})
const maker = new IFTTT('IFTTT_MAKER_TOKEN')

const run = async () => {
	// generate a random 8-digit hex password
	const newPassword = crypto.randomBytes(4).toString('hex');

	// sign-in
	await box.getSession()

	// get current guest WLAN settings
	const settings = await box.getGuestWLAN()

	// set new password & turn on guest WLAN
	settings.key = newPassword
	settings.active = true
	await box.setGuestWLAN(settings)

	// send a message to IFTTT (optional)
	maker.triggerEvent('notify', `Guest WLAN password is ${password}.`, response =>
		response.on('data', chunk =>
			console.info('Response: ' + chunk)
		)
	)
}

run()
```

## API

### default class FritzBoxAPI ({host, password, username}) [<>](/source/index.js)

Creates a new FritzBoxAPI with the given parameters.

````javascript
const box = new FritzBoxAPI({
	host: 'fritz.box',
	password: '...',
	username: '...'
});
````

### async box.getSession()

Attempts to log in and fetches a session ID.

### async box.getGuestWLAN()

Fetches the guest WLAN configuration from the FRITZ!Box.

### async box.setGuestWLAN(settings)

Applies the modified `settings` object.

### async box.overview()

Returns the data contained in the overview tab of the FRITZ!Box user interface.

## Disclaimer

FRITZ!Box and FRITZ!OS are registered trademarks of AVM. This project does not grant you any permissions to use them.
