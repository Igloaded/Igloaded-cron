import express from 'express';
import session from 'express-session';
import cron from 'node-cron';
import cors from 'cors';
import connectDB from './Connections/db.js';
import {
	UpdateAllReels,
	deleteCompletedReels,
} from './Controllers/Cronjobs/UpdateAllReels.js';
import { RemoveImages } from './Controllers/Cronjobs/RemoveImages.js';
import { vars } from './secrets.js';

const port = vars.port;
const app = express();
connectDB();

app.use(express.urlencoded({ extended: true }));

const RequestUrl = [
	'http://localhost:5173',
	'https://www.igloaded.com',
];

app.set('trust proxy', 1);
app.use(
	cors({
		origin: RequestUrl,
		methods: [
			'GET',
			'POST',
			'PUT',
			'DELETE',
			'OPTIONS',
			'PATCH',
		],
		credentials: true,
	})
);

app.use(express.json());

app.use(
	session({
		secret: vars.secretCode,
		resave: false,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);

app.get('/', (req, res) => {
	res.status(200).json({
		message: 'IGLoaded Cron',
		status: 'Up and running!',
	});
});

app.get('/reels/updateall', UpdateAllReels);
app.get('/reels/delete', deleteCompletedReels);
app.get('/images/delete', RemoveImages);

cron.schedule('0 2 * * *', UpdateAllReels);
cron.schedule('0 3 * * *', deleteCompletedReels);
cron.schedule('0 4 * * *', RemoveImages);

app.listen(port || 5694, () => {
	console.log(`Server started on port ${port}`);
});
