import EBNFHelper from "./EBNFHelper";

export default class Ebnf {
	private static where = "WHERE";
	private static options = "OPTIONS";
	private static columns = "COLUMNS";
	private static trans = "TRANSFORMATIONS";
	private query: any;
	private arrId: any[];
	private arrKeys: string[];

	constructor(query: any) {
		this.query = query;
		this.arrId = [];
		this.arrKeys = [];
	}

	public getArrID() {
		return this.arrId;
	}

	public isEbnf(): boolean {
		let allKeys = Object.keys(this.query);
		if (typeof this.query !== "object" || !(allKeys.length === 2 || allKeys.length === 3)) {
			return false;
		}
		if (!allKeys.includes(Ebnf.trans)) {
			if (allKeys.indexOf(Ebnf.where) === 0 && allKeys.indexOf(Ebnf.options) === 1) {
				let queryWhere = this.query[Ebnf.where];
				let queryOptions = this.query[Ebnf.options];
				let whereSuccess = this.checkWhere(queryWhere);
				let optionsSuccess = this.checkOptions(queryOptions);
				return whereSuccess && optionsSuccess && this.isSameDatasetAndKind();
			} else {
				return false;
			}
		} else {
			if (allKeys.indexOf(Ebnf.where) === 0 && allKeys.indexOf(Ebnf.options) === 1
				&& allKeys.indexOf(Ebnf.trans) === 2) {
				let queryWhere = this.query[Ebnf.where];
				let queryOptions = this.query[Ebnf.options];
				let queryTrans = this.query[Ebnf.trans];
				let whereSuccess = this.checkWhere(queryWhere);
				let optionsSuccess = this.checkOptions(queryOptions);
				let transSuccess = this.checkTrans(queryTrans);
				return whereSuccess && optionsSuccess && transSuccess && this.isSameDatasetAndKind();
			} else {
				return false;
			}
		}
	}

	private checkWhere(whereQuery: any): boolean {
		if (Object.keys(whereQuery).length === 0) {
			return true;
		}
		if (Object.keys(whereQuery).length > 1) {
			return false;
		}

		let outerKey = Object.keys(whereQuery)[0];
		if (outerKey === "IS") {
			return this.checkSComp(whereQuery["IS"]);
		} else if (EBNFHelper.isMComparator(outerKey)) {
			return this.checkMComp(whereQuery, outerKey);
		} else if (EBNFHelper.isLogic(outerKey)) {
			return this.checkLogic(whereQuery, outerKey);
		} else if (outerKey === "NOT") {
			return this.checkNegation(whereQuery["NOT"]);
		} else {
			return false;
		}
	}

	private checkNegation(NotQuery: any): boolean {
		return this.checkWhere(NotQuery);
	}

	private checkLogic(whereQuery: any, outerKey: string): boolean {
		let bool = false;
		let arr = whereQuery[outerKey];
		if (arr.length < 1) {
			return false;
		}
		for (let item of arr) {
			bool = this.checkWhere(item);
			if (!bool) {
				return bool;
			}
		}
		return bool;
	}

	private checkMComp(whereQuery: any, outerKey: string) {
		if (typeof whereQuery !== "object" || Object.keys(whereQuery[outerKey]).length !== 1) {
			return false;
		}
		let key = Object.keys(whereQuery[outerKey])[0];
		return this.checkMKey(key) && typeof whereQuery[outerKey][key] === "number";
	}

	private checkSComp(IsQuery: any): boolean {
		if (typeof IsQuery !== "object" || Object.keys(IsQuery).length !== 1) {
			return false;
		}
		let isKey = Object.keys(IsQuery)[0];
		return this.checkSKey(isKey) && typeof (IsQuery[isKey]) === "string"
			&& EBNFHelper.inputStringLegal(IsQuery[isKey]);
	}

	private checkOptions(queryOptions: any): boolean {
		let allKeys = Object.keys(queryOptions);
		if (!(allKeys.length === 1 || allKeys.length === 2) || Object.keys(queryOptions)[0] !== (Ebnf.columns)) {
			return false;
		}
		if (Object.keys(queryOptions).length === 2) {
			if (Object.keys(queryOptions)[1] !== "ORDER") {
				return false;
			} else {
				return this.checkColumns(queryOptions[Ebnf.columns]) && this.checkOrder(queryOptions["ORDER"]);
			}
		} else {
			return this.checkColumns(queryOptions[Ebnf.columns]);
		}
		return false;
	}

	private checkColumns(arr: any): boolean {
		if (arr.length < 1) {
			return false;
		}
		let bool = true;
		if (Object.keys(this.query).includes(Ebnf.trans)) {
			let groupKeys = this.query[Ebnf.trans]["GROUP"];
			let applyKey = [];
			for (let k of this.query[Ebnf.trans]["APPLY"]) {
				applyKey.push(Object.keys(k)[0]);
			}
			for (let column of arr) {
				bool = this.checkAnyKey(column) && (groupKeys.includes(column) || applyKey.includes(column));
				if (!bool) {
					return bool;
				}
			}
			return bool;
		} else {
			for (let column of arr) {
				bool = this.checkAnyKey(column);
				if (!bool) {
					return bool;
				}
			}
			return bool;
		}
	}

	private checkOrder(queryOrder: string | any): boolean {
		if (typeof queryOrder === "string") {
			return this.checkAnyKey(queryOrder) && this.checkKeyInColumns(queryOrder);
		} else {
			return this.checkDirKeys(queryOrder);
		}
	}

	private checkKeyInColumns(queryOrder: string) {
		return this.query["OPTIONS"]["COLUMNS"].includes(queryOrder);
	}

	private checkDirKeys(queryOrder: any) {
		if (Object.keys(queryOrder).length !== 2) {
			return false;
		} else if (Object.keys(queryOrder)[0] !== "dir" || Object.keys(queryOrder)[1] !== "keys") {
			return false;
		}
		return EBNFHelper.checkDir(Object.values(queryOrder)[0]) && this.checkKeysOrder(Object.values(queryOrder)[1]);
	}

	private checkKeysOrder(arr: any): boolean {
		if (arr.length < 1) {
			return false;
		}
		let bool = true;
		for (let a of arr) {
			bool = this.checkAnyKey(a) && this.checkKeyInColumns(a);
			if (!bool) {
				return false;
			}
		}
		return bool;
	}

	private checkTrans(queryTrans: any) {
		let keys = Object.keys(queryTrans);
		if (keys.length !== 2 || !keys.includes("GROUP") || !keys.includes("APPLY")) {
			return false;
		}
		return this.checkGroup(queryTrans["GROUP"]) && this.checkApply(queryTrans["APPLY"]);
	}

	private checkGroup(queryGroup: any) {
		if (queryGroup.length < 1) {
			return false;
		}
		let bool = true;
		for (let i of queryGroup) {
			bool = this.checkKey(i);
			if (!bool) {
				return false;
			}
		}
		return bool;
	}

	private checkApply(queryApply: any) {
		let bool = true;
		let allApplyKeys: string[] = [];
		for (let item of queryApply) {
			if (allApplyKeys.includes(Object.keys(item)[0])) {
				return false;
			}
			bool = this.checkApplyRule(item);
			if (!bool) {
				return false;
			}
			allApplyKeys.push(Object.keys(item)[0]);
		}
		return bool;
	}

	private checkApplyRule(item: any): boolean {
		if (Object.keys(item).length !== 1) {
			return false;
		}
		return EBNFHelper.checkIdStringAndApplyKey(Object.keys(item)[0])
			&& this.checkApplyToken(Object.values(item)[0]);
	}

	private checkApplyToken(item: any): boolean {
		if (Object.keys(item).length !== 1) {
			return false;
		}
		return EBNFHelper.checkTokenKey(Object.keys(item)[0]) && this.checkKey(Object.values(item)[0])
			&& EBNFHelper.checkTokenCompat(Object.keys(item)[0], Object.values(item)[0]);
	}

	private checkKey(key: any) {
		return this.checkSKey(key) || this.checkMKey(key);
	}

	private checkSKey(key: string) {
		let arr = key.split("_");
		this.arrId.push(arr[0]);
		this.arrKeys.push(arr[1]);
		return arr.length === 2 && EBNFHelper.checkIdStringAndApplyKey(arr[0]) && EBNFHelper.checkSfield(arr[1]);
	}

	private checkMKey(key: string) {
		let arr = key.split("_");
		this.arrId.push(arr[0]);
		this.arrKeys.push(arr[1]);
		return EBNFHelper.checkIdStringAndApplyKey(arr[0]) && EBNFHelper.checkMfield(arr[1]);
	}


	private checkAnyKey(column: string): boolean {
		if (column.split("_").length === 1) {
			return EBNFHelper.checkIdStringAndApplyKey(column);
		} else {
			return this.checkKey(column);
		}
	}

	private isSameDatasetAndKind(): boolean {
		let i;
		for (i = 0; i < this.arrId.length; i++) {
			if (this.arrId[i] !== this.arrId[0]) {
				return false;
			}
		}
		let j;
		if (EBNFHelper.checkCourseKind(this.arrKeys[0])) {
			for (j = 0; j < this.arrKeys.length; j++) {
				if (!EBNFHelper.checkCourseKind(this.arrKeys[j])) {
					return false;
				}
			}
		} else if (EBNFHelper.checkRoomKind(this.arrKeys[0])){
			for (j = 0; j < this.arrKeys.length; j++) {
				if (!EBNFHelper.checkRoomKind(this.arrKeys[j])) {
					return false;
				}
			}
		} else {
			return false;
		}
		return true;
	}
}
