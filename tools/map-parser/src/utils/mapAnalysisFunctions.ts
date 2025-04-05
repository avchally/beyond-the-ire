import { Command, CommandsCategoryEntry } from "../file_classes/CommandsSection";
import MapParser, { RawrJson } from "../MapParser";



export function printVerticesCounts(maps: MapParser[]) {
    console.log('VERTICES COUNTS');
    let verticesCount = 0;
    for (const map of maps) {
        console.log(`${map.mapName}: ${map.verticesSection.vertices.length}`);
        verticesCount += map.verticesSection.vertices.length;
    }
    console.log(`TOTAL COUNT: ${verticesCount}`);
}

export function getVerticesCounts(maps: MapParser[]) {
    const vertices: (string | number)[][] = [["MAP", "COUNT"]];
    let verticesCount = 0;
    for (const map of maps) {
        vertices.push([map.mapName, map.verticesSection.vertices.length]);
        verticesCount += map.verticesSection.vertices.length;
    }
    vertices.push(['TOTAL COUNT', verticesCount]);
    return vertices;
}

// export function getUnk0x0AFromFaces(rawr: RawrJson): { [value: number]: number } {
//     const unk0x0AMap: { [value: number]: number } = {};
//     for (const face of rawr.facesSection.faces) {
//         if (!unk0x0AMap[face.unk0x0A]) {
//             unk0x0AMap[face.unk0x0A] = 0;
//         }
//         unk0x0AMap[face.unk0x0A]++;
//     }

//     return unk0x0AMap;
// }

export function printAllUnkFromSectors(maps: MapParser[]): { [value: number]: number } {
    const unk0x0CMap: { [value: number]: number } = {};
    for (const map of maps) {
        for (const sector of map.sectorsSection.sectors) {
            if (!unk0x0CMap[sector.textureMapOverride]) {
                unk0x0CMap[sector.textureMapOverride] = 0;
            }
            unk0x0CMap[sector.textureMapOverride]++;
        }
    }

    console.log(JSON.stringify(unk0x0CMap, null, 2));
    console.log(`unk0x0C\tunk0x0C(hex)\tcount`);
    for (const [unk, count] of Object.entries(unk0x0CMap)) {
        console.log(`${unk}\t${Number(unk).toString(16).padStart(4, '0')}\t${count}`);
    }

    return unk0x0CMap;
}

export function printAllUnk0x0CFromObjects(maps: MapParser[]): { [value: number]: number } {
    const unk0x0CMap: { [value: number]: number } = {};
    for (const map of maps) {
        for (const objectContainer of map.objectsSection.objectContainers) {
            for (const object of objectContainer.objects) {
                if (!unk0x0CMap[object.unk0x0C]) {
                    unk0x0CMap[object.unk0x0C] = 0;
                }
                unk0x0CMap[object.unk0x0C]++;
            }
        }
    }

    console.log(JSON.stringify(unk0x0CMap, null, 2));
    console.log(`unk0x0C\tunk0x0C(hex)\tcount`);
    for (const [unk, count] of Object.entries(unk0x0CMap)) {
        if (count > 100) {
            console.log(`${unk}\t${Number(unk).toString(16).padStart(4, '0')}\t${count}`);
        }
    }

    return unk0x0CMap;
}

export function getAllUnk0x0AFromFaces(maps: MapParser[]): { [value: number]: number } {
    const unk0x0AMap: { [value: number]: number } = {};
    for (const map of maps) {
        for (const face of map.facesSection.faces) {
            if (face.addCollision > 0 && face.sisterFaceOffset === 0xFFFF) {
                console.log(`${map.mapName}: ${face.selfOffset?.toString(16).padStart(4, '0')} ${face.addCollision.toString(16).padStart(4, '0')}`);
            }
            // for (const face of rawr.facesSection.faces) {
            if (!unk0x0AMap[face.addCollision]) {
                unk0x0AMap[face.addCollision] = 0;
            }
            unk0x0AMap[face.addCollision]++;
        }
    }

    return unk0x0AMap;
}

export function formatAllCommandsForCSV(maps: MapParser[]): any[][] {
    const commandsArray: any[][] = [['ID_NAME', 'ID_COUNT', 'MAP', 'ADJUSTED_INDEX', 'COMMAND_CHAIN_ID', 'IS_ENTRY_COMMAND', 'SIZE', 'COMMAND', 'COMMAND_BASE', 'COMMAND_MODIFIER', 'NEXT_COMMAND_INDEX', 'REMAINING_ARGS', 'CALLS_THIS', 'RAW_COMMAND']];
    let idCount = 0;
    for (const map of maps) {
        let commandChainCount = 1;
        let includedCommandIndices: { [key: number]: number } = {};
        for (const commandChain of map.commandsSection.commandEntryPoints) {
            let isEntryCommand: boolean = true;
            const commandChainId = map.mapName + '_' + commandChainCount.toString().padStart(4, '0');
            let currentCommand: Command | undefined = commandChain;
            while (currentCommand) {
                const idName = `${map.mapName}_${currentCommand.adjustedIndexInFile?.toString().padStart(4, '0')}`;
                const callsThis = currentCommand.commandsThatCallThis.map((command: Command) => command.adjustedIndexInFile).join(' ');
                const remainingArgs = currentCommand.remainingArgs.map((arg: number) => arg.toString(16).padStart(4, '0')).join(' ');
                const commandTypeBAString = `${currentCommand.typeB.toString(16).padStart(2, '0')} ${currentCommand.typeA.toString(16).padStart(2, '0')}`;
                const dataArray = [idName, idCount++, map.mapName, currentCommand.adjustedIndexInFile, commandChainId, isEntryCommand, currentCommand.size, commandTypeBAString, currentCommand.typeA, currentCommand.typeB, currentCommand.nextCommandIndex, remainingArgs, callsThis, currentCommand.rawCommand];
                commandsArray.push(dataArray);
                if (currentCommand.adjustedIndexInFile) {
                    includedCommandIndices[currentCommand.adjustedIndexInFile] = includedCommandIndices[currentCommand.adjustedIndexInFile] ? includedCommandIndices[currentCommand.adjustedIndexInFile] + 1 : 1;
                } else {
                    console.log(`Detected blank or zero adjustedIndexInFile. (${currentCommand.selfOffset})`);
                }
                currentCommand = currentCommand.nextCommand;
                isEntryCommand = false;
            }
            commandChainCount++;
        }

        for (const command of map.commandsSection.commands) {
            if (!command.adjustedIndexInFile) {
                console.log(`Detected blank or zero adjustedIndexInFile. (${command.selfOffset})`);
                continue;
            }
            if (!includedCommandIndices[command.adjustedIndexInFile]) {
                const idName = `${map.mapName}_${command.adjustedIndexInFile?.toString().padStart(4, '0')}`;
                const callsThis = command.commandsThatCallThis.map((command: Command) => command.adjustedIndexInFile).join(' ');
                const remainingArgs = command.remainingArgs.map((arg: number) => arg.toString(16).padStart(4, '0')).join(' ');
                const commandTypeBAString = `${command.typeB.toString(16).padStart(2, '0')} ${command.typeA.toString(16).padStart(2, '0')}`;
                const dataArray = [idName, idCount++, map.mapName, command.adjustedIndexInFile, map.mapName + '_X', false, command.size, commandTypeBAString, command.typeA, command.typeB, command.nextCommandIndex, remainingArgs, callsThis, command.rawCommand];
                commandsArray.push(dataArray);
            }
        }
    }

    return commandsArray;
}

export function formatCommandCategoriesForCSV(maps: MapParser[]): any[][] {
    const commandCategoriesArray: any[][] = [['MAP_NAME', 'ADJUSTED_INDEX', 'COMMAND_BASE', 'COMMAND_MODIFIER', 'CATEGORY_INDEX', 'RAW_COMMAND']];
    
    for (const map of maps) {
        
        // for (const mappedEntryPoint of Object.keys(map.commandsSection.commandEntryPointsRelativeOffsets)) {
        //     console.log(Number(mappedEntryPoint).toString(16).padStart(4, '0'));
        // }
        
        map.commandsSection.commandCategoriesSection.forEach((commandCat: CommandsCategoryEntry, index: number) => {
            if (commandCat.count === 0) {
                return;
            }

            let commandEntryIndexOffset: number = commandCat.categoryOffset;
            // console.log(`categoryOffset: ${commandCat.categoryOffset.toString(16).padStart(4, '0')}`);

            for (let i = 0; i < commandCat.count; i++) {
                const command = map.commandsSection.commandEntryPointsRelativeOffsets[commandEntryIndexOffset];
                if (!command) {
                    console.log(`Could not find entry command at relative index 0x${commandEntryIndexOffset.toString(16).padStart(4, '0')} (${map.mapName})`);
                }
                commandCategoriesArray.push([
                    map.mapName,
                    command.adjustedIndexInFile,
                    command.typeA.toString(16).padStart(2, '0'),
                    command.typeB.toString(16).padStart(2, '0'),
                    index,
                    command.rawCommand
                ]);
                commandEntryIndexOffset += 0x02;
            }
        });
    }

    return commandCategoriesArray;
}