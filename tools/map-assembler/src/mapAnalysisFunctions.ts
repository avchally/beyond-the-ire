import { Command } from "./file_classes/CommandsSection";
import MapAssembler from "./MapAssembler";

export function printVerticesCounts(maps: MapAssembler[]) {
    console.log('VERTICES COUNTS');
    let verticesCount = 0;
    for (const map of maps) {
        console.log(`${map.mapName}: ${map.verticesSection.vertices.length}`);
        verticesCount += map.verticesSection.vertices.length;
    }
    console.log(`TOTAL COUNT: ${verticesCount}`);
}

export function getVerticesCounts(maps: MapAssembler[]) {
    const vertices: (string | number)[][] = [["MAP", "COUNT"]];
    let verticesCount = 0;
    for (const map of maps) {
        vertices.push([map.mapName, map.verticesSection.vertices.length]);
        verticesCount += map.verticesSection.vertices.length;
    }
    vertices.push(['TOTAL COUNT', verticesCount]);
    return vertices;
}

export function formatAllCommandsForCSV(maps: MapAssembler[]): any[][] {
    const commandsArray: any[][] = [['ID_NAME', 'ID_COUNT', 'MAP', 'ADJUSTED_INDEX', 'COMMAND_CHAIN_ID', 'IS_ENTRY_COMMAND', 'SIZE', 'COMMAND', 'TYPE_A', 'TYPE_B', 'NEXT_COMMAND_INDEX', 'REMAINING_ARGS', 'CALLS_THIS', 'RAW_COMMAND']];
    let idCount = 0;
    for (const map of maps) {
        let commandChainCount = 1;
        let includedCommandIndices: { [key: number]: number } = {};
        let isEntryCommand: boolean = true;
        for (const commandChain of map.commandsSection.commandEntryPoints) {
            const commandChainId = map.mapName + '_' + commandChainCount.toString().padStart(4, '0');
            let currentCommand: Command | undefined = commandChain;
            while (currentCommand) {
                const idName = `${map.mapName}_${currentCommand.adjustedIndexInFile?.toString().padStart(4, '0')}`;
                const callsThis = currentCommand.commandsThatCallThis.map((command: Command) => command.adjustedIndexInFile).join(' ');
                const remainingArgs = currentCommand.remainingArgs.map((arg: number) => arg.toString(16).padStart(4, '0')).join(' ');
                const commandTypeABString = `${currentCommand.typeA.toString(16).padStart(2, '0')} ${currentCommand.typeB.toString(16).padStart(2, '0')}`;
                const dataArray = [idName, idCount++, map.mapName, currentCommand.adjustedIndexInFile, commandChainId, isEntryCommand, currentCommand.size, commandTypeABString, currentCommand.typeA, currentCommand.typeB, currentCommand.nextCommandIndex, remainingArgs, callsThis, currentCommand.rawCommand];
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
                const commandTypeABString = `${command.typeA.toString(16).padStart(2, '0')} ${command.typeB.toString(16).padStart(2, '0')}`;
                const dataArray = [idName, idCount++, map.mapName, command.adjustedIndexInFile, map.mapName + '_X', false, command.size, commandTypeABString, command.typeA, command.typeB, command.nextCommandIndex, remainingArgs, callsThis, command.rawCommand];
                commandsArray.push(dataArray);
            }
        }
    }

    return commandsArray;
}
