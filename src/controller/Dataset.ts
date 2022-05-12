import {InsightDatasetKind} from "./IInsightFacade";
import {Data} from "./Data";

export default class Dataset {
	private readonly data: Data[];
	private readonly num_rows: number;
	private readonly datasetKind: InsightDatasetKind;

	constructor(data: Data[], rows: number, kind: InsightDatasetKind) {
		this.data = data;
		this.num_rows = rows;
		this.datasetKind = kind;
	}

	public getData(): Data[] {
		return this.data;
	}

	public getRows(): number {
		return this.num_rows;
	}

	public getKind(): InsightDatasetKind {
		return this.datasetKind;
	}
}
