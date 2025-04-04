import MapParser from "../MapParser";

export interface CommandsSectionHeader {
    signature: string;
    unk0x02: number;
    relativeOffsetToCommands: number;
    commandCount: number;
}

export interface CommandsCategoryEntry {
    categoryOffset: number; // 0x0000
    count: number; // 0x0000
}

export interface CommandsSectionJSON {
    header: {
        signature: string;
        unk0x02: number;
    };
    entryCommandIndexes: number[];
    allCommands: CommandJSON[];
}

export interface CommandJSON {
    commandBase: number; // hex
    commandModifier: number; // hex
    nextCommandIndex: number;
    args: number[]; // corresponds to the commandBase
}

export default class CommandsSection {
    public header?: CommandsSectionHeader;
    public commandCategoriesSection: CommandsCategoryEntry[] = new Array(15).fill({ category: 0, count: 0 });
    public commandEntryPointsOffsets: number[];
    public commandEntryPoints: Command[];
    public commands: Command[];
    public offsetMap: { [offset: number]: Command };
    public relativeOffsetMap: { [relativeOffset: number]: Command }; // offset relative to the start of the section
    public commandEntryPointsRelativeOffsets: { [relativeOffset: number]: Command } // offset from start of section to the entry point array element
    // public commandChains: Command[]; // just the first command since they're linked

    public constructor() {
        this.commands = [];
        this.offsetMap = {};
        this.relativeOffsetMap = {};
        // this.commandChains = [];
        this.commandEntryPointsOffsets = [];
        this.commandEntryPoints = [];
        this.commandEntryPointsRelativeOffsets = {};
    }

    public static toJSON(map: MapParser): CommandsSectionJSON {
        const section = map.commandsSection;
        if (!section.header) {
            throw new Error("No commands header found!");
        }

        return {
            header: {
                signature: section.header.signature,
                unk0x02: section.header.unk0x02,
            },
            entryCommandIndexes: section.commandEntryPoints.map((command: Command) => command.adjustedIndexInFile || NaN),
            allCommands: section.commands.map((command: Command) => ({
                commandBase: command.typeA,
                commandModifier: command.typeB,
                nextCommandIndex: command.nextCommandIndex,
                args: command.remainingArgs,
            })),
        };
    }
}

export class Command {
    public selfOffset?: number;
    public nextCommand?: Command;
    public commandsThatCallThis: Command[];
    public adjustedIndexInFile?: number; // adjusted so 0 would mean no command

    public constructor(
        public rawCommand: string,
        public size: number, // 0x0000
        public typeA: number, // 0x00
        public typeB: number, // 0x00
        public nextCommandIndex: number, // 0x0000
        public remainingArgs: number[], // 0x0000 sized
    ) {
        this.commandsThatCallThis = [];
    }

    public toString(): string {
        return `
            self offset: 0x${this.selfOffset?.toString(16).padStart(4, '0')}

            raw command: ${this.rawCommand}
            size: 0x${this.size.toString(16).padStart(4, '0')}
            typeA: 0x${this.typeA.toString(16).padStart(2, '0')}
            typeB: 0x${this.typeB.toString(16).padStart(2, '0')}
            nextCommandIndex: 0x${this.nextCommandIndex.toString(16).padStart(4, '0')}
            args: ${this.remainingArgs.map((value: number) => value.toString(16).padStart(4, '0')).join(' ')}
        `
    }
}
