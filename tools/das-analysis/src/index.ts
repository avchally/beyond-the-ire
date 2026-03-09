import * as fs from "fs";
import path from "path";

const ROTH_INSTALLATION_PATH = "D:\\Games\\SteamLibrary\\steamapps\\common\\Realms of the Haunting\\ROTH";

/**
 * DAS file parser - Header and File Allocation Table
 * Based on file_documentation/DAS.md
 */

// --- Header (68 bytes) ---
interface DasHeader {
	dasIdStr: string;
	dasIdNum: number;
	sizeFat: number;
	imgFatOffset: number;
	paletteOffset: number;
	unk0x10SectionOffset: number;
	fileNamesSection: number;
	fileNamesSectionSize: number;
	unk0x1cSize: number;
	unk0x1cSectionOffset: number;
	unk0x20: number;
	unk0x24: number;
	monsterMappingSection: number;
	monsterMappingSectionSize: number;
	unk0x30: number;
	imgFatBlock1Count: number;
	imgFatBlock2Count: number;
	unk0x38: number;
	unk0x38Size: number;
	unk0x40Size: number;
	unk0x40: number;
}

// --- FAT entry (8 bytes) ---
interface FatEntry {
	dataBlockOffset: number;
	lengthDiv2: number;
	type: number;
	specialInfo: number;
}

// --- Filename block ---
interface FileNameInfo {
	file_name: string;
	file_name_index: number;
	file_name_group: 1 | 2;
}



function processDasFile(dasName: string) {
    // console.log(`Processing ${dasName}...`);
    const buffer = fs.readFileSync(path.join(ROTH_INSTALLATION_PATH, "M", dasName));

	if (buffer.length < 68) {
		console.error("File too small to contain DAS header");
		process.exit(1);
	}
    
    console.log("dasName\tfatIndex\toffset\tlength\ttype\tspecialInfo\tfile_name\tfile_name_index\tfile_name_group");
    const header: DasHeader = processHeader(buffer);
	const fatIndexToFileName = parseFileNamesBlock(buffer, header);
    const fatEntries: FatEntry[] = processFat(dasName, buffer, header, fatIndexToFileName);

    console.log("--------------------------------");
    // 


}


/////////////////////
// --- HEADER ---
/////////////////////

function processHeader(buffer: Buffer): DasHeader {
	const header: DasHeader = parseHeader(buffer);
	// console.log("=== DAS Header ===\n");
	// console.log(JSON.stringify(header, null, 2));

    if (header.dasIdStr !== "DASP") {
		console.warn("\nWarning: Expected signature 'DASP', got:", header.dasIdStr);
	}
    return header;
}

function parseHeader(buffer: Buffer, offset: number = 0): DasHeader {
	return {
		dasIdStr: buffer.toString("ascii", offset + 0x00, offset + 0x04),
		dasIdNum: buffer.readUInt16LE(offset + 0x04),
		sizeFat: buffer.readUInt16LE(offset + 0x06),
		imgFatOffset: buffer.readUInt32LE(offset + 0x08),
		paletteOffset: buffer.readUInt32LE(offset + 0x0c),
		unk0x10SectionOffset: buffer.readUInt32LE(offset + 0x10),
		fileNamesSection: buffer.readUInt32LE(offset + 0x14),
		fileNamesSectionSize: buffer.readUInt16LE(offset + 0x18),
		unk0x1cSize: buffer.readUInt16LE(offset + 0x1a),
		unk0x1cSectionOffset: buffer.readUInt32LE(offset + 0x1c),
		unk0x20: buffer.readUInt32LE(offset + 0x20),
		unk0x24: buffer.readUInt32LE(offset + 0x24),
		monsterMappingSection: buffer.readUInt32LE(offset + 0x28),
		monsterMappingSectionSize: buffer.readUInt32LE(offset + 0x2c),
		unk0x30: buffer.readUInt32LE(offset + 0x30),
		imgFatBlock1Count: buffer.readUInt16LE(offset + 0x34),
		imgFatBlock2Count: buffer.readUInt16LE(offset + 0x36),
		unk0x38: buffer.readUInt32LE(offset + 0x38),
		unk0x38Size: buffer.readUInt16LE(offset + 0x3c),
		unk0x40Size: buffer.readUInt16LE(offset + 0x3e),
		unk0x40: buffer.readUInt32LE(offset + 0x40),
	};
}

/////////////////////
// --- Filename Block ---
/////////////////////

function parseFileNamesBlock(buffer: Buffer, header: DasHeader): Map<number, FileNameInfo> {
	const map = new Map<number, FileNameInfo>();
	const baseOffset = header.fileNamesSection;

	if (baseOffset === 0 || baseOffset >= buffer.length) return map;

	const elementCountSect1 = buffer.readUInt16LE(baseOffset + 0x00);
	const elementCountSect2 = buffer.readUInt16LE(baseOffset + 0x02);
	let offset = baseOffset + 4;

	function parseSection(count: number, group: 1 | 2) {
		for (let i = 0; i < count; i++) {
			if (offset + 4 > buffer.length) break;
			const elementSize = buffer.readUInt16LE(offset);
			const fatIndex = buffer.readUInt16LE(offset + 2);
			let pos = offset + 4;

			// Null-terminated title
			const titleEnd = buffer.indexOf(0, pos);
			const title = titleEnd >= 0 ? buffer.toString("ascii", pos, titleEnd) : "";
			pos = titleEnd >= 0 ? titleEnd + 1 : buffer.length;

			// Null-terminated description
			const descEnd = pos < buffer.length ? buffer.indexOf(0, pos) : -1;
			const description = descEnd >= 0 ? buffer.toString("ascii", pos, descEnd) : "";

			const file_name = description ? `${title} | ${description}` : title;
			map.set(fatIndex, { file_name, file_name_index: i, file_name_group: group });
			offset += elementSize;
		}
	}

	parseSection(elementCountSect1, 1);
	parseSection(elementCountSect2, 2);
	return map;
}

/////////////////////
// --- FAT ---
/////////////////////

function processFat(
	dasName: string,
	buffer: Buffer,
	header: DasHeader,
	fatIndexToFileName: Map<number, FileNameInfo>
): FatEntry[] {
	const fatEntries: FatEntry[] = parseFat(buffer, header);

	fatEntries.forEach((entry, i) => {
		const offset = `0x${entry.dataBlockOffset.toString(16).padStart(8, "0")}`;
		const length = entry.lengthDiv2 * 2;
		const type = `0x${entry.type.toString(16).padStart(2, "0")}`;
		const specialInfo = `0x${entry.specialInfo.toString(16).padStart(2, "0")}`;

		const fnInfo = fatIndexToFileName.get(i);
		const file_name = fnInfo?.file_name ?? "";
		const file_name_index = fnInfo?.file_name_index ?? -1;
		const file_name_group = fnInfo?.file_name_group ?? 0;

		console.log(
			`${dasName}\t${i}\t${offset}\t${length}\t${type}\t${specialInfo}\t${file_name}\t${file_name_index}\t${file_name_group}`
		);
	});

	return fatEntries;
}

function parseFatEntry(buffer: Buffer, offset: number): FatEntry {
	return {
		dataBlockOffset: buffer.readUInt32LE(offset),
		lengthDiv2: buffer.readUInt16LE(offset + 4),
		type: buffer.readUInt8(offset + 6),
		specialInfo: buffer.readUInt8(offset + 7),
	};
}

function parseFat(buffer: Buffer, header: DasHeader): FatEntry[] {
	const entries: FatEntry[] = [];
	// const totalEntries = header.imgFatBlock1Count + header.imgFatBlock2Count;
    const totalEntries = header.sizeFat / 8;
	let offset = header.imgFatOffset;

	for (let i = 0; i < totalEntries; i++) {
		entries.push(parseFatEntry(buffer, offset));
		offset += 8;
	}

	return entries;
}



function main() {

	
	const dasFiles = [
		"ADEMO.DAS",
		"DEMO.DAS",
		"DEMO1.DAS",
		"DEMO2.DAS",
		"DEMO3.DAS",
		"DEMO4.DAS",
	]
	
	for (const dasFile of dasFiles) {
		processDasFile(dasFile);
	}

}

main();
