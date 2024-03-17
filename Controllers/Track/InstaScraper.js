import axios from 'axios';
import cheerio from 'cheerio';

export const InstaScript = async (query) => {
	if (!query) {
		throw new Error('Input Query Expected!');
	}

	const options = {
		method: 'POST',
		url: 'https://saveig.app/api/ajaxSearch',
		headers: {
			'Content-Type':
				'application/x-www-form-urlencoded',
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
			'X-Requested-With': 'XMLHttpRequest',
			Accept: '*/*',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'en-US,en;q=0.9',
			'Content-Type':
				'application/x-www-form-urlencoded',
			Origin: 'https://saveig.app',
			Referer: 'https://saveig.app/en',
			'Sec-Fetch-Dest': 'empty',
			'Sec-Fetch-Mode': 'cors',
			'Sec-Fetch-Site': 'same-origin',
			'Sec-Ch-Ua-Mobile': '?0',
			'Sec-Ch-Ua-Platform': 'Windows',
			'Sec-Ch-Ua':
				"Not;A Brand';v='99', 'Google Chrome';v='91', 'Chromium';v='91'",
		},
		data: {
			q: query,
			t: 'media',
			lang: 'en',
		},
	};

	return new Promise((resolve, reject) => {
		axios
			.request(options)
			.then(function (response) {
				if (
					response.data.mess &&
					response.data.mess.includes(
						'Video is private'
					)
				) {
					console.log('here');
					resolve({
						error:
							'Private Account or Story Unavailable',
					});
				}
				if (response.data.data) {
					const html = response.data.data;
					const $ = cheerio.load(html);
					let data = [];

					$('.download-box > li').each(function (
						i,
						el
					) {
						let objectData = {};
						let imgSrc = $(this)
							.find('.download-items__thumb > img')
							.attr('src');

						if (imgSrc.includes('gif')) {
							imgSrc = $(this)
								.find('.download-items__thumb > img')
								.attr('data-src');
						}

						let linkHref = $(this)
							.find('.download-items__btn > a')
							.attr('href');

						objectData['count'] = i;
						objectData['thumbnail'] = imgSrc;
						objectData['video'] = linkHref;
						data.push(objectData);
					});
					resolve(data);
				} else {
					resolve({ error: 'No Data Found' });
				}
			})
			.catch(function (error) {
				console.error(error);
				reject(error);
			});
	});
};
