export interface CommandsSectionHeader {
    signature: string;
    unk0x02: number;
    relativeOffsetToCommands: number;
    commandCount: number;
}

export interface CommandsCategoryEntry {
    category: number; // 0x0000
    count: number; // 0x0000
}

export default class CommandsSection {
    public header?: CommandsSectionHeader;
    public commandCategoriesSection: CommandsCategoryEntry[] = new Array(15).fill({ category: 0, count: 0 });
    public commands: Command[];
    public offsetMap: { [offset: number]: Command };
    public relativeOffsetMap: { [relativeOffset: number]: Command }; // offset relative to the start of the section
    public commandChains: Command[]; // just the first command since they're linked

    public constructor() {
        this.commands = [];
        this.offsetMap = {};
        this.relativeOffsetMap = {};
        this.commandChains = [];
    }
}

export class Command {
    public nextCommand?: Command;
    public commandsThatCallThis: Command[];

    constructor(
        public rawCommand: Buffer,
        public size: number, // 0x0000
        public typeA: number, // 0x00
        public typeB: number, // 0x00
        public nextCommandIndex: number, // 0x0000
        public remainingArgs: number[], // 0x0000 sized
    ) {
        this.commandsThatCallThis = [];
    }
}
