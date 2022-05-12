import {InsightResult} from "./IInsightFacade";
import {Data} from "./Data";
import {AggregateHelper} from "./AggregateHelper";

export default class Engine {
	private resultArr: InsightResult[];
	private query: any;

	constructor(query: any) {
		this.resultArr = [];
		this.query = query;
	}


	public applyQuery(valid_data: []): InsightResult[] {
		let filteredData = this.applyWhere(this.query, valid_data);
		if (!Object.keys(this.query).includes("TRANSFORMATIONS")) {
			this.resultArr = this.applyOptions(this.query, filteredData);
		} else {
			let groupedData = this.applyTransform(this.query, filteredData);
			this.resultArr = this.applyOptions(this.query, groupedData);
		}
		return this.resultArr;
	}

	private applyWhere(query: any, valid_data: []): Data[] {
		let queryW = query["WHERE"];
		return this.applyFilter(queryW, valid_data);
	}

	private applyFilter(queryW: any, valid_data: []): Data[] {
		let key = Object.keys(queryW)[0];
		let result: Data[] = [];

		if (Object.keys(queryW).length === 0) {
			return valid_data;
		} else if (key === "OR") {
			let temp: any = this.applyOr(queryW[key], valid_data);
			result = result.concat(temp);
		} else if (key === "AND") {
			let temp: any = this.applyAnd(queryW[key], valid_data);
			result = result.concat(temp);
		} else if (key === "GT" || key === "LT" || key === "EQ") {
			let temp: any = this.applyMComp(queryW[key], key, valid_data);
			result = result.concat(temp);
		} else if (key === "IS") {
			let temp: any = this.applyIS(queryW[key], valid_data);
			result = result.concat(temp);
		} else if (key === "NOT") {
			let temp: any = this.applyNot(queryW[key], valid_data);
			result = result.concat(temp);
		}
		return result;
	}

	private applyOr(queryWElement: any, valid_data: []): Data[] {
		let result: Data[] = [];
		let i = 0;
		let temp: any = valid_data;
		while (i < queryWElement.length) {
			let s = this.applyFilter((queryWElement)[i], temp);
			temp = temp.filter((item: any) => s.indexOf(item) < 0);
			result = result.concat(s);
			i++;
		}
		return result;
	}

	private applyAnd(queryWElement: any, valid_data: []): Data[] {
		let result: Data[] = [];
		let i = 0;
		let temp: any = valid_data;
		while (i < queryWElement.length) {
			result = this.applyFilter((queryWElement)[i], temp);
			temp = result;
			i++;
		}
		return result;
	}

	private applyMComp(query: any, key: string, valid_data: []): Data[] {
		let result: Data[] = [];
		let keyVal: any = Object.keys(query)[0];
		let num: any = Object.values(query)[0];
		let mField = keyVal.split("_", 2)[1];
		for (let data of valid_data) {
			result = this.addData(key, mField, data, num, result);
		}
		return result;
	}

	private addData(key: string, mField: string, data: any, num: any, result: Data[]) {
		if (key === "GT") {
			let v = data[mField];
			if (v > num) {
				result.push(data);
			}
		} else if (key === "LT") {
			let v = data[mField];
			if (v < num) {
				result.push(data);
			}
		} else if (key === "EQ") {
			let v = data[mField];
			if (v === num) {
				result.push(data);
			}
		}
		return result;
	}

	private applyIS(query: any, valid_data: []): Data[] {
		let result: InsightResult[] = [];
		let keyVal: any = Object.keys(query)[0];
		let param: any = Object.values(query)[0];
		let val = keyVal.split("_", 2)[1];
		if (param === "*" || param === "**") {
			return valid_data;
		} else {
			for (let data of valid_data) {
				this.pushDataToResultOnEQ(data, val, param, result);
			}
		}
		return result;
	}

	private pushDataToResultOnEQ(data: any, val: any, param: string, result: Data[]) {
		let x: string = data[val];
		if (param.substring(0, 1) === "*" && param.substring(param.length - 1) === "*") {
			if (x.includes(param.substring(1, param.length - 1))) {
				result.push(data);
			}
		} else if (param.substring(0, 1) === "*") {
			if (param.substring(1) === x.substring(x.length - (param.length - 1))) {
				result.push(data);
			}
		} else if (param.substring(param.length - 1) === "*") {
			if (param.substring(0, param.length - 1) === x.substring(0, param.length - 1)) {
				result.push(data);
			}
		} else {
			if (param === x) {
				result.push(data);
			}
		}
	}

	private applyNot(query: any, valid_data: []): Data[] {
		let result: Data[] = [];
		let notResult: any = this.applyFilter(query, valid_data);
		let newSet = new Set(notResult);

		for (let data of valid_data) {
			if (!newSet.has(data)) {
				result.push(data);
			}
		}
		return result;
	}

	private applyTransform(query: any, filtered_data: Data[]): any {
		let queryTransform = query["TRANSFORMATIONS"];
		let queryGroup = queryTransform["GROUP"];
		let queryApply = queryTransform["APPLY"];

		let res = [];
		let groupedKeys = this.getGroupKeys(queryGroup);
		let mapGroup = this.groupBy(groupedKeys, filtered_data);
		let arrMapKeys = [...mapGroup.keys()];
		for (let mapKey of arrMapKeys) {
			let aggregatedRes: any = this.aggregate(queryApply, mapKey, mapGroup);
			res.push(aggregatedRes);
		}
		return res;
	}

	private groupBy(groupedKeys: string[], filtered_data: Data[]): any {
		let map: Map<string, Data[]> = new Map();
		// todo check if two arr keys are equal by checking if they contain the same members which are string
		for (let data of filtered_data) {
			const key = this.generateKey(data, groupedKeys);
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [data]);
			} else {
				collection.push(data);
			}
		}
		return map;
	}

	private getGroupKeys(queryGroup: string[]): string[] {
		let groupedKeys = [];
		for (let key of queryGroup) {
			groupedKeys.push(key.split("_")[1]);
		}
		return groupedKeys;
	}

	private generateKey(data: any, groupedKeys: string[]): string {
		let retKey = "";
		for (let key of groupedKeys) {
			retKey = retKey.concat(data[key] + "*");
		}
		return retKey.substring(0, retKey.length - 1);
	}

	private aggregate(queryApply: any, mapKey: any, mapGroup: any) {
		let ret: any = {};
		let mapVal = mapGroup.get(mapKey);
		for (let op of queryApply) {
			let key = Object.keys(op)[0];
			let valAggregate = op[key];
			const groupVal = this.getAggregateVal(mapVal, valAggregate);
			ret[key] = groupVal;
		}
		let i = 0;
		for (let key of mapKey.split("*")) {
			let t = this.query["TRANSFORMATIONS"]["GROUP"][i].split("_")[1];
			ret[t] = key;
			i++;
		}
		return ret;
	}

	private getAggregateVal(groupArr: any, valAggregate: any) {
		let key = Object.keys(valAggregate)[0];
		let value = Object.values(valAggregate)[0];
		if (key === "MAX") {
			return AggregateHelper.handleMax(groupArr, value);
		} else if (key === "MIN") {
			return AggregateHelper.handleMin(groupArr, value);
		} else if (key === "COUNT") {
			return AggregateHelper.handleCount(groupArr, value);
		} else if (key === "SUM") {
			return AggregateHelper.handleSum(groupArr, value);
		} else if (key === "AVG") {
			return AggregateHelper.handleAvg(groupArr, value);
		} else {
			throw new Error("MAX MIN COUNT ...");
		}
	}

	private applyOptions(query: any, data: any): InsightResult[] {
		let allKeys = Object.keys(query["OPTIONS"]);
		let columns = allKeys[0];
		let colKeys = query["OPTIONS"][columns];
		let organizedData = [];
		for (let d of data) {
			let i = 0;
			let obj: InsightResult = {};
			while (i < Object.keys(colKeys).length) {
				if (colKeys[i].includes("_")) {
					let columnKey = colKeys[i].split("_", 2)[1];
					let key = colKeys[i];
					obj[key] = d[columnKey];
				} else {
					obj[colKeys[i]] = d[colKeys[i]];
				}
				i++;
			}
			organizedData.push(obj);
		}

		if (allKeys.includes("ORDER")) {
			let val: any = query["OPTIONS"]["ORDER"];
			if (typeof val === "string") {
				organizedData.sort((a: any, b: any) => {
					return a[val] - b[val];
				});
			} else {
				let dir = Object.values(val)[0];
				let keys = Object.values(val)[1];
				if (dir === "DOWN") {
					AggregateHelper.sortDec(organizedData, keys);
				} else if (dir === "UP") {
					AggregateHelper.sortInc(organizedData, keys);
				}
			}
		}
		return organizedData;
	}
}
