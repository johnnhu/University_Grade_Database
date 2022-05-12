import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, request, use} from "chai";
import chaiHttp from "chai-http";
import * as fs from "fs-extra";
import exp from "constants";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	let SERVER_URL = "http://localhost:4321";
	let ENDPOINT_URL = "/dataset/courses/courses";
	let ZIP_FILE_DATA_COURSES = fs.readFileSync("test/resources/archives/courses.zip");
	let ZIP_FILE_DATA_ROOMS = fs.readFileSync("test/resources/archives/rooms.zip");
	let SIMPLE_QUERY = fs.readFileSync("test/resources/queries/simple.json");
	let url: string;

	chai.use(chaiHttp);

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		url = "http://localhost:4321";
		// TODO: start server here once and handle errors properly
		server.start().catch((err) => {
			console.log(err);
		});
	});

	after(function () {
		// TODO: stop server here once!
		server.stop().catch((err) => {
			console.log(err);
		});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
		console.log("initiating test ... ");
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
		console.log("test finished ... ");
	});

	// Sample on how to format PUT requests
	it("Should pass- PUT test for courses dataset", function () {
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA_COURSES)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					console.log("response success - PUT request dataset courses");
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					console.log("response fail - PUT request error");
					// expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("VERY BAD \n");
		}
	});
	it("Should pass- PUT test for rooms dataset", function () {
		let ROOMS_ENDPOINT_URL = "/dataset/rooms3/rooms";
		try {
			return request(SERVER_URL)
				.put(ROOMS_ENDPOINT_URL)
				.send(ZIP_FILE_DATA_ROOMS)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					console.log("response success - PUT request dataset rooms");
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					console.log("response fail - PUT request error");
				});
		} catch (err) {
			// and some more logging here!
			console.log("fail - server endpoints issue");
		}
	});

	it("Should fail invalid ID- PUT test for courses dataset", function () {
		let WRONG_ENDPOINT_URL = "/dataset/cour_ses/courses";
		try {
			return request(SERVER_URL)
				.put(WRONG_ENDPOINT_URL)
				.send(ZIP_FILE_DATA_COURSES)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					console.log(res.status);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					//
				});
		} catch (err) {
			console.log("fail - server endpoints issue");
		}
	});

	it("Should fail invalid Kind- PUT test for courses dataset", function () {
		let WRONG_ENDPOINT_URL = "/dataset/courses/invalid";
		try {
			return request(SERVER_URL)
				.put(WRONG_ENDPOINT_URL)
				.send(ZIP_FILE_DATA_COURSES)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.log("response fail - PUT request error");
				});
		} catch (err) {
			// and some more logging here!
			console.log("fail - server endpoints issue");
		}
	});

	// delete tests
	it("Delete should fail, dataset does not exist (Err 404)", function () {
		try{
			return request(SERVER_URL).delete("/dataset/doesNotExist") // enter path
				.then(function (res: ChaiHttp.Response){
					//
				}).catch((e) => {
					expect(e.status).to.be.equal(404);
				});
		} catch (e) {
			console.log("failed- success, dataset does not exist");
		}
	});

	it("Delete should fail, dataset id invalid (Err 400)", function () {
		try{
			return request(SERVER_URL).delete( "/dataset/ ") // enter path
				.then(function (res: ChaiHttp.Response){
					console.log(res.status);
					// expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					expect(err.status).to.be.equal(400);
					console.log(err);
					console.log("print this");
				});
		} catch (e) {
			//
		}
	});
	// User Story #2
	it("should delete valid dataset and respond with 200", function () {
		try{
			return request(SERVER_URL).delete("/dataset/courses") // enter path
				.then(function (res: ChaiHttp.Response){
					expect(res).to.have.status(200);
				})
				.catch(function (err){
				//
				});
		} catch (e) {
			console.log("should not reach here");
		}

	});

	// list tests
	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
	// User Story #1
	it("should list all datasets- resolve with 200", function () {
		try{
			return request(SERVER_URL).get("/datasets")
				.then(function (res: ChaiHttp.Response){
					console.log(typeof res);
					expect(res.status).to.be.equal(200);
					expect(res.body).should.be.a("array");
				})
				.catch(function (err) {
					expect.fail(err);
				});
		} catch (e) {
			console.log("should not reach here");
		}

	});

	it("POST - success Simple Query", function () {
		try{
			return request(SERVER_URL).post("/query").send({
				WHERE: {
					GT: {
						courses_avg: 97
					}
				},
				OPTIONS: {
					COLUMNS: [
						"courses_dept",
						"courses_avg"
					],
					ORDER: "courses_dept"
				}
			}).set("Content-Type", "application/json")
				.then(function (res: ChaiHttp.Response){
					expect(res.status).to.be.equal(200);
					expect(res.body).should.be.a("array");
				})
				.catch(function (err) {
					//
				});
		} catch (e) {
			console.log("should not reach here");
		}
	});

	it("POST - failure Invalid Query", function () {
		try{
			return request(SERVER_URL).post("/query").send({
				WHERE: {
					GT: {
						courses_avg: 97
					}
				},
				OPTIONS: {
					COLUMNS: [
						"rooms_dept", // cannot reference multiple datasets
						"courses_avg"
					],
					ORDER: "courses_dept"
				}
			}).set("Content-Type", "application/json")
				.then(function (res: ChaiHttp.Response){
					console.log(typeof res);
					console.log(res.status);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					//
				});
		} catch (e) {
			console.log("should not reach here");
		}
	});

});

