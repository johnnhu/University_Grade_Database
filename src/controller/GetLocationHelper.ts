import HTMLParserHelper from "./HTMLParserHelper";

export default class GetLocationHelper {
	public static getHTML(buildingAddy: string) {
		const encodedAddy = encodeURI(buildingAddy);
		const link = HTMLParserHelper.url + encodedAddy;
		return link;
	}

	public static getLongLat(parse: any) {
		if (Object.prototype.hasOwnProperty.call(parse, "lat") &&
			Object.prototype.hasOwnProperty.call(parse, "lon")) {
			let result: {[key: string]: number} = {
				latitude: parse.lat as number,
				longitude: parse.lon as number
			};
			return result;
		} else {
			return {
				error: 0
			};
		}
	}
}
