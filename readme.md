<h1 align="center">fritz-box</h2>

<p align="center">
	Promise-based JavaScript FRITZ!Box API.
</p>

<p align="center">
	<a href="https://slack.dodekeract.com"><img src="https://slack.dodekeract.com/badge.svg"/></a>
	<a href="https://codeclimate.com/github/dodekeract/fritz-box/maintainability"><img src="https://api.codeclimate.com/v1/badges/0c35f27e2de42a35257b/maintainability"/></a>
	<a href="https://npmjs.com/package/fritz-box"><img src="https://img.shields.io/npm/dm/fritz-box.svg"/></a>
	<a href="https://david-dm.org/dodekeract/fritz-box"><img src="https://david-dm.org/dodekeract/fritz-box.svg"/></a>
</p>

## Examples

### Basic

```javascript
import FritzBox from 'fritz-box'

const box = new FritzBox({
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
import FritzBox from 'fritz-box'
import IFTTT from 'maker-ifttt'

const box = new FritzBox({
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

## Installation

<pre>
<a href="https://yarnpkg.com">yarn</a> add <a href="https://yarnpkg.com/en/package/fritz-box">fritz-box</a>
</pre>
or
<pre>
<a href="https://npmjs.com">npm</a> i <a href="https://npmjs.com/package/fritz-box">fritz-box</a>
</pre>

## API

### default class FritzBox [<>](/source/index.js)

```ts
({host, password, username}: Object)
```

Creates a new FritzBox with the given parameters.

````javascript
const box = new FritzBox({
	host: 'fritz.box',
	password: '...',
	username: '...'
});
````

### box.getSession

```ts
(): Promise
```

Attempts to log in and fetches a session ID.

```js
const box = new FritzBox(/* .. */)
box
	.getSession()
	.then(() => {})
	.catch(error => {})
```

### box.getGuestWLAN

```ts
(): Promise
```

Fetches the guest WLAN configuration from the FRITZ!Box.

```js
const box = new FritzBox(/* .. */)
box
	.getGuestWLAN()
	.then(settings => {})
	.catch(error => {})
```

### box.setGuestWLAN

```ts
(settings: Object): Promise
```

Applies the (modified) `settings` object.

```js
const box = new FritzBox(/* .. */)
box
	.setGuestWLAN(settings)
	.then(data => {})
	.catch(error => {})
```

### box.overview

```ts
(): Promise
```

Returns the data contained in the overview tab of the FRITZ!Box user interface.

```js
const box = new FritzBox(/* .. */)
box
	.overview()
	.then(data => {})
	.catch(error => {})
```

### box.getDeviceDetails

```ts
(id: String): Promise
```

Gathers more information about a specific device.

```js
const box = new FritzBox(/* .. */)
box
	.getDeviceDetails('some-id')
	.then(details => {})
	.catch(error => {})
```

### box.getWlanLog

```ts
(): Promise
```

Gets the last entries of the wlan log file.

```js
const box = new FritzBox(/* .. */)
box
	.getWlanLog()
	.then(logEntries => {})
	.catch(error => {})
```

## Disclaimer

Tested in FRITZ!OS 6.92 on a FRITZ!Box 7590.

FRITZ!Box and FRITZ!OS are registered trademarks of AVM. This project does not grant you any permissions to use them.

## History

* 1.1.0
	* directly throw errors
	* add `getDeviceDetails`
