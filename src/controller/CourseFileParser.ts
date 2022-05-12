import {Section} from "./Section";
import {SectionRaw} from "./SectionRaw";

function hasAllAttributes(course: object): boolean {
	const arr = ["Subject", "Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year"];
	return arr.every((item) => Object.prototype.hasOwnProperty.call(course, item));
}

export default class CourseFileParser {
	public static parseToSections(fileArray: string[]): Section[] {
		let sectionArray: Section[] = [];
		fileArray.forEach(function (file_) {
			try {
				let fileObject = JSON.parse(file_);
				if (Object.prototype.hasOwnProperty.call(fileObject, "result") && fileObject["result"].length > 0) {
					let sections: SectionRaw[] = fileObject["result"];
					sections.forEach((section) => {
						if (hasAllAttributes(section)) {
							const newSection: Section = {
								dept: section.Subject,
								id: section.Course,
								avg: section.Avg,
								instructor: section.Professor,
								title: section.Title,
								pass: section.Pass,
								fail: section.Fail,
								audit: section.Audit,
								uuid: section.id.toString(),
								year: +section.Year
							};
							if (section.Section === "overall") {
								newSection.year = 1900;
							}
							sectionArray.push(newSection);
						}
					});
				}
			} catch {
				console.log("skipped, file cannot be parsed as json");
			}
		});
		return sectionArray;
	}
}
