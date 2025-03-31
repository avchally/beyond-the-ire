import fs from 'fs';
import * as path from 'path';
import MapDisassembler, { RawrJson } from './MapAssembler';
import { formatAllCommandsForCSV, formatCommandCategoriesForCSV, getVerticesCounts, printVerticesCounts } from './mapAnalysisFunctions';

async function main() {
    const maps = await parseAllMaps();
    
    // printVerticesCounts(maps);
    // writeToCsv('./output/vertex_counts.csv', getVerticesCounts(maps));
    // writeToCsv('./output/all_commands.csv', formatAllCommandsForCSV(maps));
    // writeToCsv('./output/command_categories.csv', formatCommandCategoriesForCSV(maps));

    console.log(maps[0].mapName);
    const rawrJson = MapDisassembler.exportToRAWR(maps[0]);
    for (const map of maps) {
        console.log(`Starting ${map.mapName}`);
        writeToRAWRFile(MapDisassembler.exportToRAWR(map));
    }
    // console.log(JSON.stringify(MapDisassembler.exportToRAWR(maps[0]), null, 2));
}

async function parseAllMaps(): Promise<MapDisassembler[]> {
    const mapsDirectory = 'D:\\Games\\SteamLibrary\\steamapps\\common\\Realms of the Haunting_00\\ROTH\\M';
    const mapFileNames = getMapFileNames(mapsDirectory);

    const maps: MapDisassembler[] = [];
    for (const mapFileName of mapFileNames) {
        const mapName = mapFileName.split('.')[0];
        console.log(`Processing ${mapName}`);
        const mapFileBuffer = await fs.promises.readFile(mapsDirectory + '\\' + mapFileName);
        maps.push(new MapDisassembler(mapFileBuffer, mapName));
    }

    console.log('Finished initial map processing.\n\n');
    return maps;
}

function writeToCsv(filePathWithName: string, arrayOfArrays: (string | number)[][]) {
    let csvString = '';
    for (const outerArray of arrayOfArrays) {
        csvString += outerArray.join(',') + '\n';
    }
    console.log('Writing to CSV.');
    fs.writeFileSync(filePathWithName, csvString, 'utf8');
    console.log(`Finished writing to CSV. ${filePathWithName}`);
}

function writeToRAWRFile(rawrJSON: RawrJson, mapName?: string) {
    const fileNamePath = `./output/RAWR/${mapName || rawrJSON.rawrMetadata.mapName}.RAWR`;
    console.log('Writing to RAWR file.');
    fs.writeFileSync(fileNamePath, JSON.stringify(rawrJSON, null, 2), 'utf-8');
    console.log(`Finished writing to RAWR file. ${fileNamePath}`);
}

function getMapFileNames(directoryPath: string): string[] {
  try {
    const files = fs.readdirSync(directoryPath);
    const mapFiles = files.filter(file => path.extname(file).toLowerCase() === '.raw');
    return mapFiles;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
};

main();
