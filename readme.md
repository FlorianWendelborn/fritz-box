# Fritz Box

Node.js FRITZ!Box API. Tested in FRITZ!OS 6.51 on a FRITZ!Box 3490.

The whole library is promise-based, so it's best to use this in ES6+ code.

## Example

````javascript
import IFTTT from 'maker-ifttt';

const box = new FritzBoxAPI({
	username: 'exampleUser',
	password: 'examplePassword',
	host: 'fritz.box'
});
const maker = new IFTTT('IFTTT_MAKER_TOKEN');

function run () {
	async function activateGuestWLAN ({password}) {
		await box.getSession();
		const settings = await box.getGuestWLAN();
		settings.key = password;
		settings.active = true;
		await box.setGuestWLAN(settings);
	}

	function notify (message) {
		maker.triggerEvent('notify', message, function (res) {
			console.log('notify', message);
			res.on('data', function (chunk) {
				console.log('Response: ' + chunk);
			});
		});
	}

	const password = crypto.randomBytes(4).toString('hex');
	activateGuestWLAN({password});
	notify(`Guest WLAN password is ${password}.`);
}

run();
````

This will activate the guest WLAN and emit a IFTTT Maker channel notify event. If you create the fitting IFTTT recipe, this snippet should send you the WLAN password right to your smartphone.

## API

### default class FritzBoxAPI ({username, password, host})

Creates a new FritzBoxAPI with the given parameters.

````javascript
const box = new FritzBoxAPI({
	username: 'exampleUser',
	password: 'examplePassword',
	host: 'fritz.box'
});
````

### box.getSession()

Attempts to log in and fetches a session ID.

### box.getGuestWLAN()

Feteches the guest WLAN configuration from the FRITZ!Box.

### box.setGuestWLAN(settings)

Applies the modified `settings` object.

### box.overview()

Returns the data contained in the overview tab of the FRITZ!Box user interface.

## Disclaimer

FRITZ!Box and FRITZ!OS are registered trademarks of AVM. This project does not grant you any permissions to use them. 
