<h1 align="center">fritz-box</h2>

<p align="center">
	Promise-based JavaScript FRITZ!Box API.
</p>

<p align="center">
	<a href="https://codeclimate.com/github/dodekeract/fritz-box/maintainability"><img src="https://api.codeclimate.com/v1/badges/0c35f27e2de42a35257b/maintainability"/></a>
	<a href="https://npmjs.com/package/fritz-box"><img src="https://img.shields.io/npm/dm/fritz-box.svg"/></a>
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
({ host = 'fritz.box', password: String, username: String }: Object): FritzBox
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
;(async () => {
	const box = new FritzBox(/* ... */)
	await box.getSession()
	// fritz-box is now ready for use
})()
```

### box.getGuestWLAN

```ts
(): Promise
```

Fetches the guest WLAN configuration from the FRITZ!Box.

```js
;(async () => {
	const box = new FritzBox(/* ... */)
	await box.getSession()
	const settings = await box.getGuestWLAN()
})()
```

### box.setGuestWLAN

```ts
(settings: Object): Promise
```

Applies the (modified) `settings` object.

```js
;(async () => {
	const box = new FritzBox(/* ... */)
	await box.getSession()
	await box.setGuestWLAN(settings)
})()
```

### box.overview

```ts
(): Promise
```

Returns the data contained in the overview tab of the FRITZ!Box user interface.

```js
;(async () => {
	const box = new FritzBox(/* ... */)
	await box.getSession()
	console.log(await box.overview())
})()
```

### box.getDeviceDetails

```ts
(id: String): Promise
```

Gathers more information about a specific device.

```js
;(async () => {
	const box = new FritzBox(/* ... */)
	await box.getSession()
	console.log(await box.getDeviceDetails('some-id'))
})()
```

### box.getLog

```ts
(type = 'all' : String): Promise
```

Returns log entries. Supported types: `'all'`, `'system'`, `'internet'`, `'wlan'`, `'usb'`.

```js
;(async () => {
	const box = new FritzBox(/* ... */)
	await box.getSession()
	console.log(await box.getLog())
})()
```

## Disclaimer

Tested in FRITZ!OS 6.92 on a FRITZ!Box 7590.

FRITZ!Box and FRITZ!OS are registered trademarks of AVM. This project does not grant you any permissions to use them.

## History

* 1.2.0
	* add `getLog`
	* improve documentation

* 1.1.0
	* directly throw errors
	* add `getDeviceDetails`
