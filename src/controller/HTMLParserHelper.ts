import JSZip from "jszip";
import * as parser from "parse5";
import * as http from "http";
import HTMLParser from "./HTMLParser";
import {InsightError} from "./IInsightFacade";
import GetLocationHelper from "./GetLocationHelper";

export default class HTMLParserHelper {
	public static url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team556/";
	public static getHref(trow: any): string {
		let href = "";
		if (trow.nodeName === "a") {
			for (let attr of trow.attrs) {
				if (attr.name === "href") {
					href = attr["value"];
					break;
				}
			}
			return href;
		} else {
			if (Object.prototype.hasOwnProperty.call(trow, "childNodes")) {
				for (let child of trow.childNodes) {
					href = this.getHref(child);
					if (href !== "") {
						break;
					}
				}
			}
			return href;
		}
	}

	public static getShortName(trow: any): string {
		let code = "";
		let bool = false;
		if (trow.nodeName === "td") {
			for (let attr of trow.attrs) {
				if (attr.name === "class") {
					bool = attr.value === "views-field views-field-field-building-code";
					break;
				}
			}
		}
		if (bool) {
			for (let child of trow.childNodes) {
				if (child.nodeName === "#text") {
					code = child.value.replace(/\s+/g, "");
					break;
				}
			}
			return code;
		} else {
			if (Object.prototype.hasOwnProperty.call(trow, "childNodes")) {
				for (let child of trow.childNodes) {
					code = this.getShortName(child);
					if (code !== "") {
						break;
					}
				}
			}
			return code;
		}
	}

	public static getFullName(trow: any): string {
		let name = "";
		let bool = false;
		if (trow.nodeName === "td") {
			for (let attr of trow.attrs) {
				if (attr.name === "class") {
					bool = attr.value === "views-field views-field-title";
					break;
				}
			}
		}
		if (bool) {
			for (let child of trow.childNodes) {
				if (child.nodeName === "a") {
					for (let aChild of child.childNodes) {
						if (aChild.nodeName === "#text") {
							name = aChild.value;
							break;
						}
					}
					break;
				}
			}
			return name;
		} else {
			if (Object.prototype.hasOwnProperty.call(trow, "childNodes")) {
				for (let child of trow.childNodes) {
					name = this.getFullName(child);
					if (name !== "") {
						break;
					}
				}
			}
			return name;
		}
	}

	public static getAddy(trow: any): string {
		let addy = "";
		let bool = false;
		if (trow.nodeName === "td") {
			for (let attr of trow.attrs) {
				if (attr.name === "class") {
					bool = attr.value === "views-field views-field-field-building-address";
					break;
				}
			}
		}
		if (bool) {
			for (let child of trow.childNodes) {
				if (child.nodeName === "#text") {
					addy = child.value.replace(/\s+/g, " ").trim();
					break;
				}
			}
			return addy;
		} else {
			if (Object.prototype.hasOwnProperty.call(trow, "childNodes")) {
				for (let child of trow.childNodes) {
					addy = this.getAddy(child);
					if (addy !== "") {
						break;
					}
				}
			}
			return addy;
		}
	}

	public static async getParsedRoomDocument(href: string, zip: JSZip) {
		const ref = "rooms" + href.substring(1);
		let roomHTML = zip.file(ref);
		let roomDocument;
		try {
			if (roomHTML !== null) {
				const stringHTML = await roomHTML.async("string");
				roomDocument = parser.parse(stringHTML);
			}
		} catch {
			return Promise.reject(new InsightError("unable to parse room, not in HTML format"));
		}
		return roomDocument;
	}

	public static getRoomNumber(trowRoom: any): string {
		let roomNumber = HTMLParser.validRoom;
		let bool = false;
		if (trowRoom.nodeName === "td") {
			for (let attr of trowRoom.attrs) {
				if (attr.name === "class") {
					bool = attr.value === "views-field views-field-field-room-number";
					break;
				}
			}
		}
		if (bool) {
			for (let child of trowRoom.childNodes) {
				if (child.nodeName === "a") {
					for (let aChild of child.childNodes) {
						if (aChild.nodeName === "#text") {
							roomNumber = aChild.value;
							break;
						}
					}
					break;
				}
			}
			return roomNumber;
		} else {
			if (Object.prototype.hasOwnProperty.call(trowRoom, "childNodes")) {
				for (let child of trowRoom.childNodes) {
					roomNumber = this.getRoomNumber(child);
					if (roomNumber !== HTMLParser.validRoom) {
						break;
					}
				}
			}
			return roomNumber;
		}
	}

	public static getCapacity(trowRoom: any): number {
		let capacity = -1;
		let bool = false;
		if (trowRoom.nodeName === "td") {
			for (let attr of trowRoom.attrs) {
				if (attr.name === "class") {
					bool = attr.value === "views-field views-field-field-room-capacity";
					break;
				}
			}
		}
		if (bool) {
			for (let child of trowRoom.childNodes) {
				if (child.nodeName === "#text") {
					capacity = Number(child.value.replace(/\s+/g, ""));
					break;
				}
			}
			return capacity;
		} else {
			if (Object.prototype.hasOwnProperty.call(trowRoom, "childNodes")) {
				for (let child of trowRoom.childNodes) {
					capacity = this.getCapacity(child);
					if (capacity !== -1) {
						break;
					}
				}
			}
			return capacity;
		}
	}

	public static getRoomType(trowRoom: any): string {
		let type = "";
		let bool = false;
		if (trowRoom.nodeName === "td") {
			for (let attr of trowRoom.attrs) {
				if (attr.name === "class") {
					bool = attr.value === "views-field views-field-field-room-type";
					break;
				}
			}
		}
		if (bool) {
			for (let child of trowRoom.childNodes) {
				if (child.nodeName === "#text") {
					type = child.value.replace(/\s+/g, "");
					break;
				}
			}
			return type;
		} else {
			if (Object.prototype.hasOwnProperty.call(trowRoom, "childNodes")) {
				for (let child of trowRoom.childNodes) {
					type = this.getRoomType(child);
					if (type !== "") {
						break;
					}
				}
			}
			return type;
		}
	}

	public static getFurnitureType(trowRoom: any): string {
		let type = "";
		let bool = false;
		if (trowRoom.nodeName === "td") {
			for (let attr of trowRoom.attrs) {
				if (attr.name === "class") {
					bool = attr.value === "views-field views-field-field-room-furniture";
					break;
				}
			}
		}
		if (bool) {
			for (let child of trowRoom.childNodes) {
				if (child.nodeName === "#text") {
					type = child.value.replace(/\s+/g, "");
					break;
				}
			}
			return type;
		} else {
			if (Object.prototype.hasOwnProperty.call(trowRoom, "childNodes")) {
				for (let child of trowRoom.childNodes) {
					type = this.getFurnitureType(child);
					if (type !== "") {
						break;
					}
				}
			}
			return type;
		}
	}

	public static async getLocation(buildingAddy: string): Promise<{[key: string]: number}> {
		const link = GetLocationHelper.getHTML(buildingAddy);
		return new Promise((resolve, reject) => {
			http.get(link, (response) => {
				let data = "";
				response.setEncoding("utf8");
				response.on("data", (chunk) => {
					data += chunk;
				});
				response.on("end", () => {
					const ret = GetLocationHelper.getLongLat(JSON.parse(data));
					resolve(ret);
				});
			}).on("error", (err) => {
				reject(new InsightError("Error get Request: " + err.message));
			});
		});
	}
}
