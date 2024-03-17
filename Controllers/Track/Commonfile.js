import { google } from 'googleapis';
import { vars } from '../../secrets.js';

const googleAuthFile = JSON.parse(vars.authFile);

export const createSpreadSheet = async (
	sheetName,
	userEmail
) => {
	const auth = new google.auth.GoogleAuth({
		credentials: googleAuthFile,
		scopes: [
			'https://www.googleapis.com/auth/spreadsheets',
			'https://www.googleapis.com/auth/drive',
		],
	});

	const sheets = google.sheets({
		version: 'v4',
		auth: auth,
	});

	const spreadsheet =
		await sheets.spreadsheets.create({
			resource: {
				properties: {
					title: sheetName,
				},
			},
		});

	const spreadSheetUrl =
		spreadsheet.data.spreadsheetUrl;

	const spreadsheetId = spreadSheetUrl
		.split('/d/')[1]
		.split('/')[0];

	const drive = google.drive({
		version: 'v3',
		auth: auth,
	});

	return new Promise((resolve, reject) => {
		drive.permissions.list(
			{
				fileId: spreadsheetId,
				fields: 'permissions(id,emailAddress)',
			},
			function (err, res) {
				if (err) {
					console.error(
						'Error retrieving permissions:',
						err
					);
					return reject({
						status: 400,
						message: 'Error retrieving permissions',
						error: err,
					});
				}

				const permissions = res.data.permissions;
				const isShared = permissions.some(
					(permission) =>
						permission.role === 'writer' &&
						permission.type === 'user' &&
						permission.emailAddress === userEmail
				);

				if (!isShared) {
					drive.permissions.create(
						{
							fileId: spreadsheetId,
							requestBody: {
								role: 'writer',
								type: 'user',
								emailAddress: userEmail,
							},
						},
						function (err, res) {
							if (err) {
								console.error(
									'Error sharing the spreadsheet:',
									err
								);
								return reject({
									status: 400,
									message: 'Error sharing the spreadsheet',
									error: err,
								});
							} else {
								drive.permissions.create(
									{
										fileId: spreadsheetId,
										requestBody: {
											role: 'reader',
											type: 'anyone',
										},
									},
									function (err, res) {
										if (err) {
											console.error(
												'Error sharing the spreadsheet:',
												err
											);
											return reject({
												status: 400,
												message:
													'Error sharing the spreadsheet',
												error: err,
											});
										} else {
											return resolve({
												status: 200,
												message:
													'Spreadsheet shared successfully',
												spreadsheetUrl: spreadSheetUrl,
											});
										}
									}
								);
							}
						}
					);
				} else {
					console.log('Spreadsheet already shared');
					return resolve({
						status: 200,
						message: 'Spreadsheet already shared',
						spreadsheetUrl: spreadSheetUrl,
					});
				}
			}
		);
	});
};

export const deleteSpreadSheet = async (
	sheetId
) => {
	const auth = new google.auth.GoogleAuth({
		credentials: googleAuthFile,
		scopes: [
			'https://www.googleapis.com/auth/drive',
		],
	});

	const client = await auth.getClient();

	const drive = google.drive({
		version: 'v3',
		auth: client,
	});

	return new Promise(async (resolve, reject) => {
		try {
			const resp = await drive.files.delete({
				fileId: sheetId,
			});
			console.log(resp);
			console.log(`Spreadsheet ${sheetId} deleted.`);
			resolve({
				status: 200,
				message: 'Spreadsheet deleted successfully',
			});
		} catch (error) {
			if (error.errors[0].reason === 'notFound') {
				reject({
					status: 400,
					message: 'Spreadsheet not found',
				});
				console.error(
					`Spreadsheet ${sheetId} not found.`
				);
			} else {
				reject({
					status: 400,
					message: 'Error deleting spreadsheet',
					error: error,
				});
				console.error(
					`Failed to delete spreadsheet: ${error}`
				);
			}
		}
	});
};
