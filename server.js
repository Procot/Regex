const http = require('http');
const fs = require('fs');
const url = require("url");
const querystring = require("querystring");
const mongoClient = require("mongodb").MongoClient;
const mongoUrl = "mongodb://localhost:27017/regexdb";

const requests = {};
let currentUser = {};

requests["/"] = function (res) {
	requests["file"](res, "/index/index.html");
}

requests["/logout"] = function (res, req) {
	currentUser.data = {};
	currentUser.isAutorizated = false;
	res.end();
}

requests["file"] = function (res, nameFile) {
	nameFile = nameFile.slice(1);
	
	fs.readFile(nameFile, (err, data) => {
		if (err) return res.end();

		if (/.js$/.test(nameFile)) {
			res.writeHead(200, {"Content-Type": "text/javascript"});
			res.write(data);
		}
		else if (/.ico$/.test(nameFile)) {
			res.writeHead(200, {"Content-Type": "image/ico"});
			res.write(data, "binary");
		}
		else if (/.ttf$/.test(nameFile)) {
			res.writeHead(200, {"Content-Type": "fonts/ttf"});
			res.write(data);
		} else {
			res.writeHead(200, {"Content-Type": `text/${nameFile.match(/\.(\S+)$/)[1]}`});
			res.write(data);
		}
		res.end();
	});
}

requests["/autoriz"] = function (res, req, query) {
	if (query === "reg") {
		let user = {};

		req.on("data", (data) => {
			user = JSON.parse(data);
		});

		req.on("end", () => {
			mongoClient.connect(mongoUrl, (err, db) => {
				if (err) {
					res.end();
					return err;
				}
				db.collection("users").find(user).toArray((err, result) => {
					if (err) {
						res.end();
						return err;
					}

					if (result.length) {
						res.end();
					}
					else {
						db.collection("users").insertOne(user, (err, result) => {
							if (err) {
								res.end();
								return err;
							}
							
							currentUser.data = {};
							currentUser.isAutorizated = true;
							for (let key in user)
								currentUser['data'][key] = user[key];

							fs.writeFile('index/users/' + user.login + '.json', JSON.stringify({"login": user.login}), (err) => {
								if (err) {
									console.log('Error: cannot create file' + user.login + '.json');
								}
							});
							res.write(JSON.stringify(currentUser));
							res.end();
						});
					}
				});				
			});
		});
	} else {
		let user = {};

		req.on("data", (data) => {
			user = JSON.parse(data);
		});

		req.on("end", () => {
			mongoClient.connect(mongoUrl, (err, db) => {
				if (err) {
					res.end();
					return err;
				}

				db.collection("users").find(user).toArray((err, result) => {
					if (err) {
						db.close();
						res.end();
						return err;
					}

					currentUser = {};
					currentUser.data = {};
					currentUser.isAutorizated = true;
					for (let key in result[0])
						currentUser['data'][key] = result[0][key];

					res.write(JSON.stringify(currentUser));
					res.end();
					db.close();
				});				
			});
		});
	}
}

requests["/getUserInfo"] = function (res) {
	res.end(JSON.stringify(currentUser));
}

requests["/checkTask"] = function (res, req) {
	let task;
	req.on('data', (data) => {
		task = JSON.parse(data);
	});

	req.on('end', () => {
		let tests;
		const code = new Function('', `return ${task.code}`);
		fs.readFile(`index/tests/${task.task}.json`, (err, data) => {
			if (err) {
				res.end();
				return;
			}

			tests = JSON.parse(data);
			for (let i = 0; i < tests.length; ++i) {
				let result;
				try {
					result = code()(tests[i].input);
					if (result !== tests[i].output) {
						const e = {
						"status": "answer",
						"number": i + 1
						};
						res.end(JSON.stringify(e));
						return;
					}
				} catch(e) {
					let er = {};
					er.status = 'runtime';
					er.number = i + 1;
					res.end(JSON.stringify(er));
					return;
				}
			}
			const r = {
				status: "OK"
			};
			res.end(JSON.stringify(r));
		});
	});
}

function start() {
    http.createServer((req, res) => {
        let path = url.parse(req.url);
		if (/(\.\S+)$/.test(path.pathname))
			requests["file"](res, path.pathname);
		else
        requests[path.pathname](res, req, path.query);
    }).listen(8888, "127.0.0.1");
    console.log("Server started");
}

start();