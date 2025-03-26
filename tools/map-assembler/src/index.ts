import fs from 'fs';
import * as path from 'path';
import MapAssembler from './MapAssembler';
import { formatAllCommandsForCSV, getVerticesCounts, printVerticesCounts } from './mapAnalysisFunctions';

async function main() {
    const maps = await parseAllMaps();
    
    // printVerticesCounts(maps);
    // writeToCsv('./output/vertex_counts.csv', getVerticesCounts(maps));
    writeToCsv('./output/all_commands.csv', formatAllCommandsForCSV(maps));
}

async function parseAllMaps(): Promise<MapAssembler[]> {
    const mapsDirectory = 'D:\\Games\\SteamLibrary\\steamapps\\common\\Realms of the Haunting_00\\ROTH\\M';
    const mapFileNames = getMapFileNames(mapsDirectory);

    const maps: MapAssembler[] = [];
    for (const mapFileName of mapFileNames) {
        const mapName = mapFileName.split('.')[0];
        console.log(`Processing ${mapName}`);
        const mapFileBuffer = await fs.promises.readFile(mapsDirectory + '\\' + mapFileName);
        maps.push(new MapAssembler(mapFileBuffer, mapName));
    }

    console.log('Finished initial map processing.\n\n');
    return maps;
}

function writeToCsv(filePathWithName: string, arrayOfArrays: (string | number)[][]) {
    let csvString = '';
    for (const outerArray of arrayOfArrays) {
        csvString += outerArray.join(', ') + '\n';
    }
    console.log('Writing to CSV.');
    fs.writeFileSync(filePathWithName, csvString, 'utf8');
    console.log(`Finished writing to CSV. ${filePathWithName}`);
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
