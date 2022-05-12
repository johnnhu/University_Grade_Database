import Decimal from "decimal.js";
import {InsightResult} from "./IInsightFacade";

export class AggregateHelper {

	public static handleMax(groupArr: any, value: any) {
		let max = groupArr[0][value.split("_")[1]];
		for (let data of groupArr) {
			let cur = data[value.split("_")[1]];
			if (cur > max) {
				max = cur;
			}
		}
		return max;
	}

	public static handleMin(groupArr: any, value: any) {
		let min = groupArr[0][value.split("_")[1]];
		for (let data of groupArr) {
			let cur = data[value.split("_")[1]];
			if (cur < min) {
				min = cur;
			}
		}
		return min;
	}

	public static handleCount(groupArr: any, value: any) {
		let count = 0;
		let existed: any = [];
		for (let data of groupArr) {
			let val = data[value.split("_")[1]];
			if (!existed.includes(val)) {
				count++;
				existed.push(val);
			}
		}
		return count;
	}

	public static handleSum(groupArr: any, value: any) {
		let total = new Decimal(0);
		for (let data of groupArr) {
			let key = value.split("_")[1];
			let cur = new Decimal(data[key]);
			total = total.add(cur);
		}
		return Number(total.toFixed(2));
	}

	public static handleAvg(groupArr: any, value: any) {
		let total = new Decimal(0);
		let rows = 0;
		for (let data of groupArr) {
			let key = value.split("_")[1];
			let cur = new Decimal(data[key]);
			total = total.add(cur);
			rows++;
		}
		let avg = total.toNumber() / rows;
		let res = Number(avg.toFixed(2));
		return res;
	}

	public static sortDec(organizedData: InsightResult[], keys: any) {
		organizedData.sort(function (a, b): number {
			for (let k of keys) {
				if (a[k] < b[k]) {
					return 1;
				} else if (a[k] > b[k]) {
					return -1;
				}
			}
			return 0;
		});
	}

	public static sortInc(organizedData: InsightResult[], keys: any) {
		organizedData.sort(function (a, b): number {
			for (let k of keys) {
				if (a[k] < b[k]) {
					return -1;
				} else if (a[k] > b[k]) {
					return 1;
				}
			}
			return 0;
		});
	}
}
