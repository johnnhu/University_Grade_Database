import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "./IInsightFacade";
import JSZip, {JSZipObject} from "jszip";
import Dataset from "./Dataset";
import {Section} from "./Section";
import * as fs from "fs";
import Ebnf from "./Ebnf";
import Engine from "./Engine";
import * as parser from "parse5";
import {Room} from "./Room";
import {Data} from "./Data";
import HTMLParser from "./HTMLParser";
import CourseFileParser from "./CourseFileParser";

const dataDir = "./data/";
const courseDir = "./data/courses/";
const roomDir = "./data/rooms/";
const jsonExtensionLength = 5;

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

function isOnlyWhiteSpace(str: string): boolean {
	return str == null || str.match(/^\s*$/) !== null;
}

export default class InsightFacade implements IInsightFacade {
	private datasets: Map<string, Dataset>;

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.datasets = new Map<string, Dataset>();

		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir);
		}
		if (!fs.existsSync(courseDir)) {
			fs.mkdirSync(courseDir);
		} else {
			const files: string[] = fs.readdirSync(courseDir);
			files.forEach((dataset_id) => {
				let id = dataset_id.substring(0, dataset_id.length - jsonExtensionLength);
				if (!this.datasets.has(id)) {
					const fileData = fs.readFileSync(courseDir + dataset_id, "utf-8");
					let dataArr: Data[] = JSON.parse(fileData); // fileData is def not empty and valid
					this.datasets.set(id, new Dataset(dataArr, dataArr.length, InsightDatasetKind.Courses));
				}
			});
		}
		if (!fs.existsSync(roomDir)) {
			fs.mkdirSync(roomDir);
		} else {
			const files: string[] = fs.readdirSync(roomDir);
			files.forEach((dataset_id) => {
				let id = dataset_id.substring(0, dataset_id.length - jsonExtensionLength);
				if (!this.datasets.has(id)) {
					const fileData = fs.readFileSync(roomDir + dataset_id, "utf-8");
					let dataArr: Data[] = JSON.parse(fileData); // fileData is def not empty and valid
					this.datasets.set(id, new Dataset(dataArr, dataArr.length, InsightDatasetKind.Rooms));
				}
			});
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (this.datasets.has(id) || id.includes("_") || isOnlyWhiteSpace(id)) {
			return Promise.reject(new InsightError("duplicate datasetID or invalid dataset id"));
		}
		if (kind === InsightDatasetKind.Courses) {
			await this.addDatasetCourses(id, content);
		} else if (kind === InsightDatasetKind.Rooms) {
			await this.addDatasetRooms(id, content);
		} else {
			return Promise.reject(new InsightError("Invalid kind of dataset added!"));
		}
		return new Promise((resolve) => {
			let arr: string[] = [];
			this.datasets.forEach((value, key) => {
				arr.push(key);
			});
			resolve(arr);
		});
	}

	private async addDatasetCourses(id: string, content: string) {
		let zip = new JSZip();
		try {
			await zip.loadAsync(content, {base64: true});
		} catch {
			return Promise.reject(new InsightError("invalid zip file - failed zip.loadAsync"));
		}

		let promises: Array<Promise<string>> = [];
		if (zip.folder(/courses/).length === 1) {
			zip.folder("courses")?.forEach(function (relativePath, file) {
				promises.push(file.async("string"));
			});
		} else {
			return Promise.reject(new InsightError("course folder does not contain any files"));
		}
		const fileArray = await Promise.all(promises);
		let sectionArray: Section[] = CourseFileParser.parseToSections(fileArray);

		if (sectionArray.length <= 0) {
			return Promise.reject(new InsightError("course folder does not contain any valid course sections"));
		}
		this.datasets.set(id, new Dataset(sectionArray, sectionArray.length, InsightDatasetKind.Courses));

		fs.writeFileSync(courseDir + id + ".json", JSON.stringify(sectionArray));
	}

	private async addDatasetRooms(id: string, content: string) {
		let zip1 = new JSZip();
		try {
			await zip1.loadAsync(content, {base64: true});
		} catch {
			return Promise.reject(new InsightError("invalid zip file - failed zip.loadAsync"));
		}

		let index: JSZipObject[] = zip1.file(/index.htm/);
		if (index.length <= 0) {
			return Promise.reject(new InsightError("room does not contain index.htm or room does not exist in root"));
		}

		let document;
		let htmlFile = zip1.file("rooms/index.htm");
		try {
			if (htmlFile !== null) {
				const htmlString = await htmlFile.async("string");
				document = parser.parse(htmlString);
			}
		} catch {
			return Promise.reject(new InsightError("unable to parse room, not in HTML format"));
		}

		let roomArray: Room[] = await HTMLParser.parseToBuildings(document, zip1);
		if (roomArray.length <= 0) {
			return Promise.reject(new InsightError("room folder does not contain any valid buildings with rooms"));
		}
		this.datasets.set(id, new Dataset(roomArray, roomArray.length, InsightDatasetKind.Rooms));

		fs.writeFileSync(roomDir + id + ".json", JSON.stringify(roomArray));
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (this.datasets.has(id)) {
				let temp: any = this.datasets.get(id);
				this.deleteDisk(id, temp.getKind());
				this.datasets.delete(id);
				resolve(id);
			} else if (isOnlyWhiteSpace(id) || id.includes("_")) {
				reject(new InsightError("invalid ID"));
			} else {
				reject(new NotFoundError("ID not found"));
			}
		});
	}

	private deleteDisk(id: string, kind: string) {
		if (kind === "courses") {
			fs.unlink(courseDir + id + ".json", (err) => {
				if (err) {
					return Promise.reject(new InsightError("unable to delete in disk"));
				}
			});
		} else {
			fs.unlink(roomDir + id + ".json", (err) => {
				if (err) {
					return Promise.reject(new InsightError("unable to delete in disk"));
				}
			});
		}
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let ebnfChecker: Ebnf = new Ebnf(query);
		let resultArr: InsightResult[] = [];
		let dataset: Dataset | any;

		try {
			if (!ebnfChecker.isEbnf()) {
				return Promise.reject(new InsightError("EBNF failed"));
			}
			if (this.datasets.has(ebnfChecker.getArrID()[0])) {
				dataset = this.datasets.get(ebnfChecker.getArrID()[0]);
			} else {
				return Promise.reject(new InsightError("dataset does not exist"));
			}
			let runEngine = new Engine(query);
			resultArr = runEngine.applyQuery(dataset.getData());
			if (resultArr.length > 5000) {
				return Promise.reject(new ResultTooLargeError("result length > 5000"));
			}
		} catch (error) {
			return Promise.reject(error);
		}
		return Promise.resolve(resultArr);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let insightArr: InsightDataset[] = [];
		this.datasets.forEach((value, key) => {
			let rows = value.getRows();
			let kind = value.getKind();
			const myDataset: InsightDataset = {
				id: key,
				kind: kind,
				numRows: rows
			};
			insightArr.push(myDataset);
		});

		return new Promise<InsightDataset[]>((resolve) => {
			resolve(insightArr);
		});
	}
}
