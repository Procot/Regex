const http = require('http');
const url = require("url");

const Login = require('./server-modules/login.module');
const Registration = require('./server-modules/registration.module');
const SendFile = require('./server-modules/send-file.module');
const UserInfo = require('./server-modules/user-info.module');
const CheckTask = require('./server-modules/check-task.module');

const requests = {};

requests["/account/login"] = Login;
requests['/account/registration'] = Registration;
requests["/getUserInfo"] = UserInfo;
requests['/check-task'] = 

requests["/checkTask"] = function (res, req) {
	let task;
	req.on('data', (data) => {
		task = JSON.parse(data);
	});

	req.on('end', () => {
		let tests;
		const code = new Function('', `return ${task.code}`);
		fs.readFile(`index/tests/${task.titleEnglish}.json`, (err, data) => {
			if (err) {
				res.end();
				return;
			}

			tests = JSON.parse(data);
			let flag = false;
			for (let i = 0; i < tests.length && !flag; ++i) {
				let result;
				try {
					result = code()(tests[i].input);
					if (result !== tests[i].output) {
						const e = {
						"status": "answer",
						"number": i + 1
						};
						results.push({
							"message": `Неправильный ответ на тесте ${i + 1}`,
		                    'status': 'error',
		                    'task': task.titleRussian,
	                    	'href': `#/task/${task.titleEnglish}`
						});
						flag = true;

						fs.readFile(`index/users/${currentUser.data.login}.json`, (err, data) => {
							if (err) {
								res.end();
								return;
							}
							const prop = JSON.parse(data);
							prop.countWrong++;
							prop.results = [];
							results.forEach((element) => {prop.results.push(element);});
							fs.writeFile(`index/users/${currentUser.data.login}.json`, JSON.stringify(prop), (err) => {
								if (err) {
									console.log('Error: cannot write results to file');
								}
							});
							res.end(JSON.stringify(e));
							return;
						});
					}
				} catch(e) {
					let er = {};
					er.status = 'runtime';
					er.number = i + 1;
					results.push({
						"message": `Ошибка исполнения на тесте ${i + 1}`,
	                    'status': 'error',
	                    'task': task.titleRussian,
	                    'href': `#/task/${task.titleEnglish}`
					});
					flag = true;
					
					fs.readFile(`index/users/${currentUser.data.login}.json`, (err, data) => {
						if (err) {
							res.end();
							return;
						}
						const prop = JSON.parse(data);
						prop.results = [];
						results.forEach((element) => {prop.results.push(element);});
						fs.writeFile(`index/users/${currentUser.data.login}.json`, JSON.stringify(prop), (err) => {
							if (err) {
								console.log('Error: cannot write results to file');
							}
						});
						res.end(JSON.stringify(er));
						return;
					});
				}
			}
			if (!flag) {
				const r = {
					status: "OK"
				};

				results.push({
					"message": 'Все тесты пройдены',
                    'status': 'ok',
                    'task': task.titleRussian,
                    'href': `#/task/${task.titleEnglish}`
				});

				fs.readFile(`index/users/${currentUser.data.login}.json`, (err, data) => {
					if (err) {
						res.end();
						return;
					}
					const prop = JSON.parse(data);
					prop.countCompleted++;
					prop.results = [];
					results.forEach((element) => {prop.results.push(element);});
					fs.writeFile(`index/users/${currentUser.data.login}.json`, JSON.stringify(prop), (err) => {
						if (err) {
							console.log('Error: cannot write results to file');
						}
					});
					res.end(JSON.stringify(r));
					return;
				});
			}
		});
	});
}

module.exports = function (port) {
	port = port || process.env.PORT || 8888;
	http.createServer((req, res) => {
		let path = url.parse(req.url);
		if (path.pathname in requests) {
			requests[path.pathname](req, res);
		} else {
			SendFile(path.pathname, res);
		}
	}).listen(port);
	console.log(`Server started on port ${port}`);
}
