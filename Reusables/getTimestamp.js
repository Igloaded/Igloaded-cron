function epochCurrent(type) {
	switch (type) {
		case 'ms':
			return Date.now();
		case 's':
			return Math.floor(new Date().getTime() / 1000);
		case 'm':
			return Math.floor(
				new Date().getTime() / 1000 / 60
			);
		case 'h':
			return Math.floor(
				new Date().getTime() / 1000 / 60 / 60
			);
		case 'd':
			return Math.floor(
				new Date().getTime() / 1000 / 60 / 60 / 24
			);
		case 'w':
			return Math.floor(
				new Date().getTime() / 1000 / 60 / 60 / 24 / 7
			);
		case 'y':
			return Math.floor(
				new Date().getTime() /
					1000 /
					60 /
					60 /
					24 /
					365
			);
		default:
			return new Date().getTime();
	}
}

const addToEpoch = (days) => {
	const epochTime = Math.floor(
		new Date().getTime() / 1000
	);
	const hoursToAdd = days * 24;
	const newEpochTime =
		epochTime + hoursToAdd * 60 * 60;
	return newEpochTime * 1000;
	// days is a number
	// returns epoch in ms
};

const modifyAddToEpoch = (epoch, days) => {
	const epochTime = epoch;
	const hoursToAdd = days * 24;
	const newEpochTime =
		epochTime + hoursToAdd * 60 * 60 * 1000;
	return newEpochTime;
};

const epochToDate = (epoch, type) => {
	let date;
	if (type == 'ms') {
		date = new Date(epoch);
	} else if (type == 's') {
		date = new Date(epoch * 1000);
	} else if (!type) {
		throw new Error('Type expected');
	} else {
		throw new Error('Invalid type');
	}
	return date.toLocaleString('en-In', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true,
	});
};

export {
	addToEpoch,
	epochCurrent,
	epochToDate,
	modifyAddToEpoch,
};
