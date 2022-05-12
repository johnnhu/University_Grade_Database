import {Room} from "./Room";
import HTMLParserHelper from "./HTMLParserHelper";
import JSZip from "jszip";

export default class HTMLParser {
	public static validRoom = "no valid room";

	public static async parseToBuildings(document: any, zip: JSZip): Promise<Room[]> {
		const table = this.getTable(document);
		const tbody = this.tableToBody(table);
		if (tbody === null) {
			return [];
		}
		const trows = this.getTrows(tbody);

		let promises: Array<Promise<Room[]>> = [];
		for (let trow of trows) {
			const buildingPromise: Promise<Room[]> = this.parseToBuilding(trow, zip);
			promises.push(buildingPromise);
		}

		let arrBuildings: Room[][] = [];
		try {
			arrBuildings = await Promise.all(promises);
		} catch (error) {
			console.log(error);
		}

		let buildings: Room[] = [];
		for (let building of arrBuildings) {
			buildings = buildings.concat(building);
		}
		return buildings;
	}

	public static async parseToBuilding(trow: any, zip: JSZip): Promise<Room[]> {
		const href = HTMLParserHelper.getHref(trow);
		const buildingCode = HTMLParserHelper.getShortName(trow);
		const buildingName = HTMLParserHelper.getFullName(trow);
		const buildingAddy = HTMLParserHelper.getAddy(trow);
		const location: {[key: string]: number} = await HTMLParserHelper.getLocation(buildingAddy);

		const roomDocument = await HTMLParserHelper.getParsedRoomDocument(href, zip);
		return this.parseToRooms(roomDocument, buildingCode, buildingName, buildingAddy, location);
	}

	public static async parseToRooms(roomDocument: any, buildingCode: string, buildingName: string, buildingAddy:
		string, location: {[key: string]: number}): Promise<Room[]> {
		const tableRooms = this.getTable(roomDocument);
		const tbodyRooms = this.tableToBody(tableRooms);
		if (tbodyRooms === null) {
			return [];
		}
		const trowsRooms = this.getTrows(tbodyRooms);
		let promises = [];
		for (let trowRoom of trowsRooms) {
			let promise: Promise<Room | null> = this.parseToRoom(trowRoom, buildingCode, buildingName, buildingAddy,
				location);
			promises.push(promise);
		}
		let rooms: Room[] = [];
		const arrRooms = await Promise.all(promises);
		for (let room of arrRooms) {
			if (room !== null) {
				rooms.push(room);
			}
		}
		return rooms;
	}

	public static async parseToRoom(trowRoom: any, buildingCode: string, buildingName: string, buildingAddy: string,
		location: {[key: string]: number}): Promise<Room | null> {
		const roomNumber: string = HTMLParserHelper.getRoomNumber(trowRoom);
		const roomName: string = buildingCode + "_" + roomNumber;
		const roomSeat: number = HTMLParserHelper.getCapacity(trowRoom);
		const roomType: string = HTMLParserHelper.getRoomType(trowRoom);
		const furnitureType: string = HTMLParserHelper.getFurnitureType(trowRoom);
		const hrefOnline: string = HTMLParserHelper.getHref(trowRoom);
		const latitude: number = location["latitude"];
		const longitude: number = location["longitude"];

		if (roomNumber === HTMLParser.validRoom || Object.prototype.hasOwnProperty.call(location, "error")) {
			return null;
		}

		return {
			address: buildingAddy,
			fullname: buildingName,
			shortname: buildingCode,
			name: roomName,
			type: roomType,
			furniture: furnitureType,
			number: roomNumber,
			seats: roomSeat,
			lat: latitude,
			lon: longitude,
			href: hrefOnline,
		};
	}

	public static getTable(document: any): any {
		let ret = null;
		if (document.nodeName === "table" && this.hasCorrectTableAttr(document)) {
			ret = document;
			return ret;
		} else {
			if (Object.prototype.hasOwnProperty.call(document, "childNodes")) {
				for (let node of document.childNodes) {
					ret = this.getTable(node);
					if (ret !== null) {
						break;
					}
				}
			}
			return ret;
		}
	}

	public static hasCorrectTableAttr(document: any): boolean {
		const attributes: any[] = document.attrs;
		let ret = false;
		for (let attr of attributes) {
			if (attr.name === "class") {
				ret = attr.value === "views-table cols-5 table";
			}
			break;
		}
		return ret;
	}

	public static tableToBody(document: any): any {
		if (document === null) {
			return null;
		}
		const children = document.childNodes;
		let ret;
		for (let attr of children) {
			if (attr.nodeName === "tbody") {
				ret = attr;
				break;
			}
		}
		return ret;
	}

	public static getTrows(tbody: any): any {
		let trows: any[] = [];
		tbody.childNodes.forEach((childNode: {nodeName: string;}) => {
			if (childNode.nodeName === "tr") {
				trows.push(childNode);
			}
		});
		return trows;
	}
}
