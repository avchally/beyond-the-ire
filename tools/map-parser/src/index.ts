import fs from 'fs';
import * as path from 'path';
import MapParser, { RawrJson } from './MapParser';
import { formatAllCommandsForCSV, formatCommandCategoriesForCSV, getAllUnk0x0AFromFaces, getVerticesCounts, printAllUnk0x0CFromObjects, printAllUnkFromSectors, printVerticesCounts } from './utils/mapAnalysisFunctions';
import { mirrorMapY, setMapMetadata, stripUnkFields } from './utils/mapModifierFunctions';

async function main() {
    
    const mapsDirectory = 'D:/Games/SteamLibrary/steamapps/common/Realms of the Haunting_00/ROTH/M';
    const outputDirectory = '../../output/RAWR/';
    const maps = await parseAllMaps(mapsDirectory);
    
    // printVerticesCounts(maps);
    // writeToCsv('./output/vertex_counts.csv', getVerticesCounts(maps));
    // writeToCsv('./output/all_commands.csv', formatAllCommandsForCSV(maps));
    // writeToCsv('./output/command_categories.csv', formatCommandCategoriesForCSV(maps));

    // const unk0x0AFaces = getAllUnk0x0AFromFaces(maps);
    // console.log(JSON.stringify(unk0x0AFaces, null, 2));
    // console.log(`unk0x0A\tunk0x0A(hex)\tcount`);
    // for (const [unk, count] of Object.entries(unk0x0AFaces)) {
    //     console.log(`${unk}\t${Number(unk).toString(16).padStart(4, '0')}\t${count}`);
    // }

    // printAllUnk0x0CFromObjects(maps);
    // printAllUnkFromSectors(maps);

    for (const map of maps) {
        console.log(`Starting ${map.mapName}`);
        const rawr = MapParser.exportToRAWR(map);
        setMapMetadata(rawr);
        // stripUnkFields(rawr);
        // mirrorMapY(rawr);
        writeToRAWRFile(outputDirectory, rawr);
    }
}

async function parseAllMaps(rawMapDirectory: string): Promise<MapParser[]> {
    const mapFileNames = getMapFileNames(rawMapDirectory);

    const maps: MapParser[] = [];
    for (const mapFileName of mapFileNames) {
        const mapName = mapFileName.split('.')[0];
        console.log(`Processing ${mapName}`);
        const mapFileBuffer = await fs.promises.readFile(rawMapDirectory + '\\' + mapFileName);
        maps.push(new MapParser(mapFileBuffer, mapName));
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

function writeToRAWRFile(outputDirectory: string, rawrJSON: RawrJson, mapName?: string) {
    const fileNamePath = path.join(outputDirectory, `${mapName || rawrJSON.rawrMetadata.mapName}.RAWR`);
    console.log('Writing to RAWR file.');
    fs.mkdirSync(outputDirectory, { recursive: true });
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
