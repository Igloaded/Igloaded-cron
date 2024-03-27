import { config } from 'dotenv';
config();

export const vars = {
	rapidApiReelHost: String(
		process.env.RAPIDAPI_REEL_HOST
	),
	rapidApiProfileHost: String(
		process.env.RAPIDAPI_PROFILE_HOST
	),
	rapidApiKey: String(process.env.RAPIDAPI_KEY),
	jwtSecret: String(process.env.JWT_SECRET),
	mongoDbUrl: String(process.env.MONGODB_URL),
	mongoDbId: String(process.env.MONGODB_ID),
	mongoDbPass: String(process.env.MONGODB_PASS),
	rapidApiHost: String(process.env.RAPIDAPI_HOST),
	secretCode: String(process.env.SECRET_CODE),
	cloudName: String(process.env.CLOUD_NAME),
	apiKeyCloudinary: String(
		process.env.API_KEY_CLOUDINARY
	),
	apiSecretCloudinary: String(
		process.env.API_SECRET_CLOUDINARY
	),
	apiMailgun: String(process.env.API_MAILGUN),
	googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY,
	googleClientEmail: String(
		process.env.GOOGLE_CLIENT_EMAIL
	),
	port: String(process.env.PORT),
	authFile: process.env.AUTH_FILE,
	apiProfiToken: String(
		process.env.APIPROFI_TOKEN
	),
};
