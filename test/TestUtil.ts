import * as fs from "fs-extra";

const persistDir = "./data";

const getContentFromArchives = (name: string): string =>
	fs.readFileSync(`test/resources/archives/${name}`).toString("base64");

const clearDisk = (): void => {
	fs.removeSync(persistDir);
};

// const writeContentToDataFolder = (name:string) : void => {
//     fs.writeFileSync(`data`, )
// }

export {getContentFromArchives, clearDisk, persistDir};
