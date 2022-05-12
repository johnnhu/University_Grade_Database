import {expect, use} from "chai";
import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {folderTest} from "@ubccpsc310/folder-test";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let courses: string;
	let rooms: string;
	before(() => {
		courses = getContentFromArchives("courses.zip");
		rooms = getContentFromArchives("rooms.zip");
	});

	describe("list Datasets", function () {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should list no dataset", function () {
			return facade.listDatasets().then((insightDatasets) => {
				expect(insightDatasets).to.deep.equal([]);

			});
		});

		it("should list one dataset", function () {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then((addedIds) =>
					facade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([{
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					}]);
				});
		});

		it("should list multiple datasets", function () {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then((addedIds) => {
					return facade.addDataset("courses-2", courses, InsightDatasetKind.Courses);
				})
				.then((addedIds) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.instanceof(Array);
					expect(insightDatasets).to.have.length(2);
					const coursesDataset = insightDatasets.find((dataset) => dataset.id === "courses");
					expect(coursesDataset).to.exist;
					expect(coursesDataset).to.deep.equal({
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					});
					const courses2Dataset = insightDatasets.find((dataset) => dataset.id === "courses-2");
					expect(courses2Dataset).to.exist;
					expect(courses2Dataset).to.deep.equal({
						id: "courses-2",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					});
				});
		});
	});

	describe("addDataset", function () {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should add one valid dataset", async function () {
			const courseID = await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["courses"]);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([{
				id: "courses",
				kind: InsightDatasetKind.Courses,
				numRows: 64612
			}]);
		});

		it("should add multiple valid datasets", async function () {
			const courseID = await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["courses"]);

			const courseID2 = await facade.addDataset("courses-2", courses, InsightDatasetKind.Courses);
			expect(courseID2).to.have.deep.members(["courses", "courses-2"]);
			expect(courseID2).to.be.instanceof(Array);
			expect(courseID2).to.have.length(2);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.be.instanceof(Array);
			expect(insightDatasets).to.have.length(2);
			expect(insightDatasets).to.have.deep.members([
				{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				},
				{
					id: "courses-2",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				}
			]);
		});

		it("should fail - duplicateDatasetAdded", async function () {
			const courseID = await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["courses"]);
			try {
				await facade.addDataset("courses",
					getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				}]);
			}
		});

		it("should fail - duplicateDatasetAdded2", async function () {
			const courseID = await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["courses"]);
			try {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				}]);
			}
		});

		it("should add - DatasetIDWithWhitespace", async function () {
			const courseID = await facade.addDataset("whitespace with chars is okay", courses,
				InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["whitespace with chars is okay"]);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([{
				id: "whitespace with chars is okay",
				kind: InsightDatasetKind.Courses,
				numRows: 64612
			}]);
		});

		it("should fail - DatasetIDInvalidWhiteSpace", async function () {
			try {
				await facade.addDataset("", courses, InsightDatasetKind.Courses);
				await facade.addDataset(" ", courses, InsightDatasetKind.Courses);
				await facade.addDataset("    ", courses, InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should fail - DatasetIDUnderscore", async function () {
			try {
				await facade.addDataset("dataset_", courses, InsightDatasetKind.Courses);
				await facade.addDataset("datasets___", courses, InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should fail - invalid root directory folder", async function () {
			try {
				await facade.addDataset("notCourses", getContentFromArchives("notCourses.zip"),
					InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should add - different zip name but right folder", async function () {
			const courseID = await facade.addDataset("courses but different zip name",
				getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["courses but different zip name"]);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([{
				id: "courses but different zip name",
				kind: InsightDatasetKind.Courses,
				numRows: 2
			}]);
		});

		it("should fail - no valid course section, folder empty", async function () {
			try {
				await facade.addDataset("empty", getContentFromArchives("empty.zip"), InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should fail - no valid course section, folder not empty", async function () {
			try {
				await facade.addDataset("courses empty folders",
					getContentFromArchives("courses_empty_folders.zip"), InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should add - some files empty some valid", async function () {
			const courseID = await facade.addDataset("courses valid some files empty",
				getContentFromArchives("courses_valid_some_files_empty.zip"), InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["courses valid some files empty"]);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([{
				id: "courses valid some files empty",
				kind: InsightDatasetKind.Courses,
				numRows: 2
			}]);
		});

		it("should fail - no valid course section, all not in json", async function () {
			try {
				await facade.addDataset("sections all not in json",
					getContentFromArchives("sections_all_not_in_json.zip"), InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should fail - no valid course section but some json exists", async function () {
			try {
				await facade.addDataset("some json but not valid",
					getContentFromArchives("some_json_but_not_valid.zip"), InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should add - some in json", async function () {
			const courseID = await facade.addDataset("sections some in json",
				getContentFromArchives("sections_some_in_json.zip"), InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["sections some in json"]);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([{
				id: "sections some in json",
				kind: InsightDatasetKind.Courses,
				numRows: 9
			}]);
		});

		it("should add - some json some empty", async function () {
			const courseID = await facade.addDataset("sections some json some empty",
				getContentFromArchives("sections_some_json_some_empty.zip"), InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["sections some json some empty"]);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([{
				id: "sections some json some empty",
				kind: InsightDatasetKind.Courses,
				numRows: 2
			}]);
		});

		it("should fail - not a zip file", async function () {
			try {
				await facade.addDataset("courses", getContentFromArchives("courses"), InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should fail - not Courses InsightDataType", async function () {
			try {
				await facade.addDataset("courses", getContentFromArchives("courses.zip"), InsightDatasetKind.Rooms);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should add - complex adding", async function () {
			const courseID = await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			expect(courseID).to.deep.equal(["courses"]);

			const courseID1 = await facade.addDataset("courses but different zip name",
				getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);
			expect(courseID1).to.be.instanceof(Array);
			expect(courseID1).to.have.length(2);
			expect(courseID1).to.have.deep.members(["courses", "courses but different zip name"]);

			const courseID2 = await facade.addDataset("sections some in json",
				getContentFromArchives("sections_some_in_json.zip"), InsightDatasetKind.Courses);
			expect(courseID2).to.be.instanceof(Array);
			expect(courseID2).to.have.length(3);
			expect(courseID2).to.have.deep.members(["courses", "courses but different zip name",
				"sections some in json"]);

			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.be.instanceof(Array);
			expect(insightDatasets).to.have.length(3);
			expect(insightDatasets).to.have.deep.members([
				{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				},
				{
					id: "courses but different zip name",
					kind: InsightDatasetKind.Courses,
					numRows: 2
				},
				{
					id: "sections some in json",
					kind: InsightDatasetKind.Courses,
					numRows: 9
				}
			]);
		});

		it("should fail - complex adding", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("courses but different zip name",
				getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);

			try {
				await facade.addDataset("courses", getContentFromArchives("sections_some_in_json.zip"),
					InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.have.deep.members([
					{
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					},
					{
						id: "courses but different zip name",
						kind: InsightDatasetKind.Courses,
						numRows: 2
					}]);
			}
		});

		it("two InsightFacades", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("courses but different zip name",
				getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);
			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.be.instanceof(Array);
			expect(insightDatasets).to.have.length(2);
			expect(insightDatasets).to.have.deep.members([
				{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				},
				{
					id: "courses but different zip name",
					kind: InsightDatasetKind.Courses,
					numRows: 2
				}
			]);

			facade = new InsightFacade();
			try {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets2 = await facade.listDatasets();
				expect(insightDatasets2).to.have.deep.members([
					{
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					},
					{
						id: "courses but different zip name",
						kind: InsightDatasetKind.Courses,
						numRows: 2
					}
				]);
			}
		});
	});

	describe("removeDataset", function () {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should remove success", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			try {
				const stringID = await facade.removeDataset("courses");
				expect(stringID).to.deep.equal("courses");
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			} catch {
				expect.fail();
			}

		});

		it("should fail - remove twice", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			try {
				const stringID = await facade.removeDataset("courses");
				expect(stringID).to.deep.equal("courses");
				await facade.removeDataset("courses");
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(NotFoundError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should fail - no fileID exists", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			try {
				await facade.removeDataset("non-existent-courses");
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(NotFoundError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				}]);
			}
		});

		it("should remove - complex adding and removing", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("courses but different zip name",
				getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);
			await facade.addDataset("sections some in json",
				getContentFromArchives("sections_some_in_json.zip"), InsightDatasetKind.Courses);
			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.be.instanceof(Array);
			expect(insightDatasets).to.have.length(3);
			expect(insightDatasets).to.have.deep.members([
				{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				},
				{
					id: "courses but different zip name",
					kind: InsightDatasetKind.Courses,
					numRows: 2
				},
				{
					id: "sections some in json",
					kind: InsightDatasetKind.Courses,
					numRows: 9
				}
			]);
			try {
				const stringID = await facade.removeDataset("courses");
				expect(stringID).to.deep.equal("courses");
				const stringID2 = await facade.removeDataset("sections some in json");
				expect(stringID2).to.deep.equal("sections some in json");
				const datasets = await facade.listDatasets();
				expect(datasets).to.deep.equal([{
					id: "courses but different zip name",
					kind: InsightDatasetKind.Courses,
					numRows: 2
				}]);
			} catch {
				expect.fail();
			}
		});

		it("should fail - complex adding and removing", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("courses but different zip name",
				getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);
			await facade.addDataset("sections some in json",
				getContentFromArchives("sections_some_in_json.zip"), InsightDatasetKind.Courses);
			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.be.instanceof(Array);
			expect(insightDatasets).to.have.length(3);
			expect(insightDatasets).to.have.deep.members([
				{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612
				},
				{
					id: "courses but different zip name",
					kind: InsightDatasetKind.Courses,
					numRows: 2
				},
				{
					id: "sections some in json",
					kind: InsightDatasetKind.Courses,
					numRows: 9
				}
			]);
			try {
				await facade.removeDataset("courses");
				await facade.removeDataset("courses but different zip name");
				await facade.removeDataset("courses");
				expect.fail();
			} catch (error) {
				expect(error).to.be.instanceof(NotFoundError);
				const datasets = await facade.listDatasets();
				expect(datasets).to.deep.equal([{
					id: "sections some in json",
					kind: InsightDatasetKind.Courses,
					numRows: 9
				}]);
			}
		});

		it("should fail - invalidID, underscore", async function () {
			try {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				await facade.addDataset("courses_with_underscore", courses, InsightDatasetKind.Courses);
				expect.fail();
			} catch {
				try {
					await facade.removeDataset("courses_with_underscore");
					expect.fail();
				} catch (error) {
					expect(error).to.be.instanceof(InsightError);
					const insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.deep.equal([{
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					}]);
				}
			}
		});

		it("should fail - invalidID, underscore starting empty", async function () {
			try {
				await facade.removeDataset("courses_with_underscore");
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});

		it("should fail - invalidID, whitespace", async function () {
			try {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				await facade.addDataset("  ", courses, InsightDatasetKind.Courses);
				expect.fail();
			} catch {
				try {
					await facade.removeDataset("  ");
				} catch (error) {
					expect(error).to.be.instanceof(InsightError);
					const insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.deep.equal([{
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					}]);
				}
			}
		});

		it("should fail - invalidID, whitespace starting empty", async function () {
			try {
				await facade.removeDataset("  ");
			} catch (error) {
				expect(error).to.be.instanceof(InsightError);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([]);
			}
		});
	});

	describe("query", function () {
		type Input = unknown;
		type Output = Promise<InsightResult[]>;
		type Error = "InsightError" | "ResultTooLargeError";

		let facade: IInsightFacade;

		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("nineSections", getContentFromArchives("sections_some_in_json.zip"),
				InsightDatasetKind.Courses);
			await facade.addDataset("twoSections",
				getContentFromArchives("courses_but_different_zip_name.zip"), InsightDatasetKind.Courses);
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
		});

		folderTest<Input, Output, Error>(
			"query on dataset w/o ordering",
			(input: Input): Output => {
				return facade.performQuery(input);
			},
			"./test/resources/queries",
			{
				assertOnResult: (actual, expected) => {
					expect(actual).to.have.deep.members(expected);
					expect(actual).to.have.length(expected.length);
				},
				assertOnError: (actual, expected) => {
					if (expected === "InsightError") {
						expect(actual).to.be.instanceof(InsightError);
					} else if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect.fail("expected errors but none thrown");
					}
				}
			}
		);
		folderTest<Input, Output, Error>(
			"query on dataset w ordering",
			(input: Input): Output => {
				return facade.performQuery(input);
			},
			"./test/resources/queries_C2Sort",
			{
				assertOnResult: (actual, expected) => {
					expect(actual).to.deep.equal(expected);
					expect(actual).to.have.length(expected.length);
				},
				assertOnError: (actual, expected) => {
					if (expected === "InsightError") {
						expect(actual).to.be.instanceof(InsightError);
					} else if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect.fail("expected errors but none thrown");
					}
				}
			}
		);
	});

	describe("RoomDataset - add, remove", function () {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should add one room", async function () {
			try {
				const arr = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(arr).to.deep.equal(["rooms"]);
			} catch {
				expect.fail();
			}
		});

		it("should add two rooms", async function () {
			try {
				const arr = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(arr).to.deep.equal(["rooms"]);
				const arr2 = await facade.addDataset("rooms2", rooms, InsightDatasetKind.Rooms);
				expect(arr2).to.have.deep.members(["rooms", "rooms2"]);
				expect(arr2).to.have.length(2);
			} catch {
				expect.fail();
			}
		});

		it("should fail, duplicate added", async function () {
			try {
				const arr = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(arr).to.deep.equal(["rooms"]);
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect.fail();
			} catch {
				// success!
			}

		});

		it("should fail, deleting nonexistent", async function () {
			try {
				const arr = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(arr).to.deep.equal(["rooms"]);
				await facade.removeDataset("rooms2");
				expect.fail();
			} catch {
				// success!
			}

		});

		it("should delete one", async function () {
			try {
				const arr = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(arr).to.deep.equal(["rooms"]);
				const str = await facade.removeDataset("rooms");
				expect(str).to.deep.equal("rooms");
			} catch {
				expect.fail();
			}

		});

	});
})
;
