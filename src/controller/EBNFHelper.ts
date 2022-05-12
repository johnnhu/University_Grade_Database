export default class EBNFHelper {
	public static inputStringLegal(str: any): boolean {
		return (/[*]?[^*]*[*]?/.test(str));
	}

	public static checkIdStringAndApplyKey(idQuery: string): boolean {
		return (/^[^_]+$/.test(idQuery)); // todo
	}

	public static isMComparator(val: string): boolean {
		return (val === "GT" || val === "LT" || val === "EQ");
	}

	public static isLogic(val: string): boolean {
		return (val === "AND" || val === "OR");
	}

	public static checkMfield(str: string): boolean {
		return (str === "avg" || str === "pass" || str === "fail" || str === "audit" || str === "year"
			|| str === "lat" || str === "lon" || str === "seats");
	}

	public static checkSfield(str: string): boolean {
		return (str === "dept" || str === "id" || str === "instructor" || str === "title" || str === "uuid"
			|| str === "fullname" || str === "shortname" || str === "number" || str === "name" || str === "address"
			|| str === "type" || str === "furniture" || str === "href");
	}

	public static checkCourseKind(str: string): boolean {
		return (str === "avg" || str === "pass" || str === "fail" || str === "audit" || str === "year" ||
			str === "dept" || str === "id" || str === "instructor" || str === "title" || str === "uuid");
	}

	public static checkRoomKind(str: string): boolean {
		return (str === "lat" || str === "lon" || str === "seats" || str === "fullname" || str === "shortname"
			|| str === "number" || str === "name" || str === "address" || str === "type" || str === "furniture"
			|| str === "href");
	}

	public static checkDir(string: any): boolean {
		return string === "UP" || string === "DOWN";
	}

	public static checkTokenKey(string: string): boolean {
		return string === "MAX" || string === "MIN" || string === "AVG" || string === "COUNT" || string === "SUM";
	}

	public static checkTokenCompat(s: any, key: any): boolean {
		if (s === "MAX" || s === "MIN" || s === "AVG" || s === "SUM") {
			let splitArr = key.split("_");
			if (!EBNFHelper.checkMfield(splitArr[1])) {
				return false;
			}
		}
		return true;
	}
}
