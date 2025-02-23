// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	track_name: undefined,
	player_id: undefined,
	player_name: undefined,
	race_id: undefined,
};

// Wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
});

async function onPageLoad() {
	console.log("Getting form info for dropdowns!");
	try {
		// Fetch tracks and render track cards (each card shows track name)
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks);
				renderAt('#tracks', html);
			});

		// Fetch racers and render racer cards (each card shows driver name and metrics)
		getRacers()
			.then(racers => {
				const html = renderRacerCars(racers);
				renderAt('#racers', html);
			});
	} catch (error) {
		console.error("Problem getting tracks and racers ::", error.message);
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		const { target } = event;

		// Race track form field: When a track card is clicked, update selection
		if (target.matches('.card.track')) {
			handleSelectTrack(target);
			store.track_id = target.id;
			store.track_name = target.innerHTML;
		}

		// Racer form field: When a racer card is clicked, update selection
		if (target.matches('.card.racer')) {
			handleSelectRacer(target);
			store.player_id = target.id;
			store.player_name = target.innerHTML;
		}

		// Submit create race form: Start race creation flow on form submission
		if (target.matches('#submit-create-race')) {
			event.preventDefault();
			handleCreateRace();
		}

		// Handle acceleration click: When accelerate button is pressed, call the API
		if (target.matches('#gas-peddle')) {
			handleAccelerate();
		}

		console.log("Store updated :: ", store);
	}, false);
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.error("Unexpected error in delay:", error);
	}
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// BELOW THIS LINE IS CODE WHERE STUDENT EDITS ARE NEEDED ----------------------------

// This async function controls the flow of the race.
async function handleCreateRace() {
	console.log("in create race");

	// Render the starting UI (race view) using the selected track name.
	renderAt('#race', renderRaceStartView({ name: store.track_name }));

	// Get player_id and track_id from the store.
	const { player_id, track_id } = store;

	try {
		// Call the asynchronous createRace API with the selected player and track.
		const race = await createRace(player_id, track_id);
		console.log("RACE: ", race);

		// Update the store with the race id returned by the API.
		store.race_id = race.id || race.ID;

		// Start the countdown before the race begins.
		await runCountdown();

		// Call the API to start the race.
		await startRace(store.race_id);

		// Begin polling for race progress every 500ms.
		await runRace(store.race_id);
	} catch (err) {
		console.error("Error in handleCreateRace:", err);
	}
}

// Polls for the race progress and updates the leaderboard in real time.
function runRace(raceID) {
	return new Promise((resolve, reject) => {
		const raceInterval = setInterval(async () => {
			try {
				const res = await getRace(raceID);
				// If the race is in progress, update the leaderboard using live data.
				if (res.status === "in-progress") {
					renderAt('#leaderBoard', raceProgress(res.positions));
				} 
				// When the race is finished, clear the interval, display results, and resolve the promise.
				else if (res.status === "finished") {
					clearInterval(raceInterval);
					renderAt('#race', resultsView(res.positions));
					resolve(res);
				}
			} catch (error) {
				clearInterval(raceInterval);
				console.error("Error running race:", error);
				reject(error);
			}
		}, 500);
	});
}

// Displays a countdown before the race starts.
async function runCountdown() {
	try {
		await delay(1000);
		let timer = 3;
		// Render initial countdown UI.
		renderAt('#leaderBoard', renderCountdown(timer));
		
		return new Promise(resolve => {
			const countdownInterval = setInterval(() => {
				timer--;
				document.getElementById('big-numbers').innerHTML = timer;
				if (timer <= 0) {
					clearInterval(countdownInterval);
					resolve();
				}
			}, 1000);
		});
	} catch (error) {
		console.error("Error in runCountdown:", error);
	}
}

// When a racer card is clicked, highlight it.
function handleSelectRacer(target) {
	console.log("selected a racer", target.id);
	const selected = document.querySelector('#racers .selected');
	if (selected) {
		selected.classList.remove('selected');
	}
	target.classList.add('selected');
}

// When a track card is clicked, highlight it.
function handleSelectTrack(target) {
	console.log("selected track", target.id);
	const selected = document.querySelector('#tracks .selected');
	if (selected) {
		selected.classList.remove('selected');
	}
	target.classList.add('selected');
}

// When the accelerate button is clicked, invoke the accelerate API.
function handleAccelerate() {
	console.log("accelerate button clicked");
	accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// PROVIDED CODE BELOW (DO NOT REMOVE)

// Renders racer cards including handling, acceleration, and top speed.
function renderRacerCars(racers) {
	if (!racers.length) {
		return `<h4>Loading Racers...</h4>`;
	}
	const results = racers.map(renderRacerCard).join('');
	return `<ul id="racers">${results}</ul>`;
}

// Returns HTML for a single racer card.
function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;
	return `<h4 class="card racer" id="${id}">${driver_name} (Speed: ${top_speed}, Accel: ${acceleration}, Handling: ${handling})</h4>`;
}

// Renders track cards (each card shows the track name).
function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `<h4>Loading Tracks...</h4>`;
	}
	const results = tracks.map(renderTrackCard).join('');
	return `<ul id="tracks">${results}</ul>`;
}

// Returns HTML for a single track card.
function renderTrackCard(track) {
	const { id, name } = track;
	return `<h4 class="card track" id="${id}">${name}</h4>`;
}

// Returns HTML for the countdown display.
function renderCountdown(count) {
	return `<h2>Race Starts In...</h2><p id="big-numbers">${count}</p>`;
}

// Returns the HTML view for starting the race (includes countdown and accelerate button).
function renderRaceStartView(track) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>
			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

// Returns the HTML view for race results.
function resultsView(positions) {
	let userPlayer = positions.find(p => p.id === parseInt(store.player_id));
	if (userPlayer) {
		userPlayer.driver_name += " (you)";
	}
	let count = 1;
	const results = positions.map(p => {
		return `<tr><td><h3>${count++} - ${p.driver_name}</h3></td></tr>`;
	});
	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<h3>Race Results</h3>
			<p>The race is done! Here are the final results:</p>
			<table>${results.join('')}</table>
			<a href="/race">Start a new race</a>
		</main>
	`;
}

// Returns the HTML for the live leaderboard updates during the race.
function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.player_id));
	if (userPlayer) {
		userPlayer.driver_name += " (you)";
	}
	positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
	let count = 1;
	const results = positions.map(p => {
		return `<tr><td><h3>${count++} - ${p.driver_name}</h3></td></tr>`;
	});
	return `<table>${results.join('')}</table>`;
}

// Updates the HTML content at a specific element.
function renderAt(element, html) {
	const node = document.querySelector(element);
	node.innerHTML = html;
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001'; 

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	};
}

// Makes a fetch call to get tracks and handles errors.
function getTracks() {
	console.log(`calling server :: ${SERVER}/api/tracks`);
	return fetch(`${SERVER}/api/tracks`, defaultFetchOpts())
		.then(res => res.json())
		.catch(err => {
			console.error("Error fetching tracks:", err);
		});
}

// Makes a fetch call to get racers and handles errors.
function getRacers() {
	console.log(`calling server :: ${SERVER}/api/cars`);
	return fetch(`${SERVER}/api/cars`, defaultFetchOpts())
		.then(res => res.json())
		.catch(err => {
			console.error("Error fetching racers:", err);
		});
}

// Creates a race by calling the API and returns a promise.
function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with createRace request::", err));
}

// Gets race details by ID.
function getRace(id) {
	console.log(`calling server :: ${SERVER}/api/races/${id}`);
	return fetch(`${SERVER}/api/races/${id}`, defaultFetchOpts())
		.then(res => res.json())
		.catch(err => {
			console.error(`Error fetching race ${id}:`, err);
		});
}

// Starts the race by calling the API.
function startRace(id) {
	console.log(`starting race ${id}`);
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with startRace request::", err));
}

// Accelerates the race by calling the API.
function accelerate(id) {
	console.log(`accelerating race ${id}`);
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		.catch(err => console.error(`Error accelerating race ${id}:`, err));
}
