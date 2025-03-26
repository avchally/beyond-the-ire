import FacesSection, { Face } from "./file_classes/FacesSection";
import Header from "./file_classes/Header";
import SectorsSection, { Sector } from './file_classes/SectorsSection';
import FaceTextureMappingSection, { ExtraFaceTextureMappingData, FaceTextureMapping } from "./file_classes/FaceTextureMappingSection";
import MidPlatformsSection, { MidPlatform } from "./file_classes/MidPlatformsSection";
import MapMetadataSection from "./file_classes/MapMetadataSection";
import VerticesSection, { Vertex, VerticesHeader } from "./file_classes/VerticesSection";
import CommandsSection, { Command, CommandsCategoryEntry } from "./file_classes/CommandsSection";
import Section7, { UnkObject01, UnkObject02 } from "./file_classes/Section7";
import ObjectsSection, { GameObject, ObjectContainer } from "./file_classes/ObjectsSection";

export default class MapAssembler {
    public fileBuffer: Buffer<ArrayBufferLike>;
    public mapName: string;
    public header: Header;
    public sectorsSection: SectorsSection;
    public facesSection: FacesSection;
    public faceTextureMappingSection: FaceTextureMappingSection;
    public midPlatformsSection?: MidPlatformsSection; // may not exist in the map
    public mapMetadataSection: MapMetadataSection;
    public verticesSection: VerticesSection;
    public commandsSection: CommandsSection;
    public section7: Section7;
    public objectsSection: ObjectsSection;
    public footer: bigint;

    public constructor(fileBuffer: Buffer<ArrayBufferLike>, mapName: string) {
        this.fileBuffer = fileBuffer;
        this.mapName = mapName;

        this.header = new Header();
        this.sectorsSection = new SectorsSection();
        this.facesSection = new FacesSection();
        this.faceTextureMappingSection = new FaceTextureMappingSection();
        this.mapMetadataSection = new MapMetadataSection();
        this.verticesSection = new VerticesSection();
        this.commandsSection = new CommandsSection();
        this.section7 = new Section7();
        this.objectsSection = new ObjectsSection();
        this.footer = 0n;

        this.parseFile();
        this.applyRemainingRelations();

        // this.commandAnalysis();
    }


    private commandAnalysis() {
        console.log(`public command chains:\n`);
        for (let entryCommand of this.commandsSection.commandEntryPoints) {
            let currentCommand: Command | undefined = entryCommand;
            let fallbackCount = 0;
            while (currentCommand) {
                console.log(currentCommand.rawCommand);
                currentCommand = currentCommand.nextCommand;
                fallbackCount++;
                if (fallbackCount > 10000) {
                    console.log('INFINITE LOOP');
                    break;
                }
            }
            console.log();
            // console.log('---------------------------------------------');
        }
    }

    private applyRemainingRelations() {
        for (const sector of this.sectorsSection.sectors) {
            if (sector.intermediateFloorOffset > 0x0000) {
                const midPlatform = this.midPlatformsSection?.offsetMap[sector.intermediateFloorOffset];
                if (midPlatform) {
                    sector.intermediateFloor = midPlatform;
                    midPlatform.associatedSectors.push(sector);
                } else {
                    console.log(`Could not find midPlatform on sector (${sector.selfOffset?.toString(16).padStart(4, '0')})`);
                }
            }
            sector.faces = [];
            for (let i = 0; i < sector.facesCount; i++) {
                const face = this.facesSection.offsetMap[sector.firstFaceOffset + 0x0C * i];
                if (!face) {
                    console.log(`Could not find face on sector (${sector.selfOffset?.toString(16).padStart(4, '0')})`);
                } else {
                    face.sector = sector;
                    sector.faces.push(face);
                }
            }
        }

        for (const face of this.facesSection.faces) {
            const vertex1 = this.verticesSection.relativeOffsetMap[face.vertexOffset01];
            if (!vertex1) {
                console.log(`Could not find vertex1 on face (${face.selfOffset?.toString(16).padStart(4, '0')})`);
            } else {
                face.vertex1 = vertex1;
            }

            const vertex2 = this.verticesSection.relativeOffsetMap[face.vertexOffset01];
            if (!vertex2) {
                console.log(`Could not find vertex2 on face (${face.selfOffset?.toString(16).padStart(4, '0')})`);
            } else {
                face.vertex2 = vertex2;
            }

            const faceTextureMapping = this.faceTextureMappingSection.offsetMap[face.textureMappingOffset];
            if (!faceTextureMapping) {
                console.log(`Could not find faceTextureMapping on face (${face.selfOffset?.toString(16).padStart(4, '0')})`);
            } else {
                face.faceTextureMapping = faceTextureMapping;
            }

            if (face.sisterFaceOffset !== 0xFFFF) {
                if (face.sisterFaceOffset === 0x0000) {
                    console.log('Found a sister face offset of 0x00. Skipping.');
                    continue;
                }
                const sisterFace = this.facesSection.offsetMap[face.sisterFaceOffset];
                if (!sisterFace) {
                    console.log(`Could not find sisterFace on face (${face.selfOffset?.toString(16).padStart(4, '0')})`);
                } else {
                    face.sisterFace = face;
                }
            }
        }
    }

    ///////////////////
    // PARSE METHODS //
    ///////////////////

    private parseFile(): void {
        this.parseHeader();
        this.confirmFileSize();
        this.parseSectorsSection();
        this.parseFacesSection();
        this.parseFaceTextureMappingSection();
        this.parseMidPlatformSection();
        this.parseMapMetadata();
        this.parseVerticesSection();
        this.parseCommandsSection();
        this.parseSection7();
        this.parseObjectsSection();
        this.parseFooter();
    }

    private parseHeader() {
        if (this.fileBuffer.length < 0x1E) {
            throw new Error(`File is too small: ${this.fileBuffer.length} bytes. Header requires at least 30 bytes.`);
        }

        this.header.verticesOffset = this.fileBuffer.readUInt16LE(0x00);
        this.header.version = this.fileBuffer.readUInt16LE(0x02);
        this.header.sectorsOffset = this.fileBuffer.readUInt16LE(0x04);
        this.header.facesOffset = this.fileBuffer.readUInt16LE(0x06);
        this.header.faceTextureMapsOffset = this.fileBuffer.readUInt16LE(0x08);
        this.header.mapMetadataOffset = this.fileBuffer.readUInt16LE(0x0A);
        this.header.verticesOffsetRepeat = this.fileBuffer.readUInt16LE(0x0C);
        this.header.signature = this.fileBuffer.toString('ascii', 0x0E, 0x10);
        this.header.midPlatformsSection = this.fileBuffer.readUInt16LE(0x10);
        this.header.section7Size = this.fileBuffer.readUInt16LE(0x12);
        this.header.verticesSectionSize = this.fileBuffer.readUInt16LE(0x14);
        this.header.objectsSectionSize = this.fileBuffer.readUInt16LE(0x16);
        this.header.footerSize = this.fileBuffer.readUInt16LE(0x18);
        this.header.commandsSectionSize = this.fileBuffer.readUInt16LE(0x1A);
        this.header.sectorCount = this.fileBuffer.readUInt16LE(0x1C);
    }

    private confirmFileSize(): void {
        const expectedFileSize = this.header.verticesOffset + this.header.verticesSectionSize + this.header.commandsSectionSize + this.header.section7Size + this.header.objectsSectionSize + this.header.footerSize;
        
        // console.log(this.header.toString());
        // console.log(`Expected size: ${expectedFileSize}. Actual size: ${this.fileBuffer.length}`);

        if (expectedFileSize !== this.fileBuffer.length) {
            throw new Error(`Section sizes in header do not correlate to actual file size. Expected size: ${expectedFileSize}. Actual size: ${this.fileBuffer.length}`);
        }
    }

    private parseSectorsSection(): void {
        let currentPosition = this.header.sectorsOffset;;
        this.sectorsSection.sectors = [];
        this.sectorsSection.offsetMap = {};
        for (let i = 0; i < this.header.sectorCount; i++) {
            const sector = new Sector(
                this.fileBuffer.readInt16LE(currentPosition),          // ceilingHeight
                this.fileBuffer.readInt16LE(currentPosition + 0x02),   // floorHeight
                this.fileBuffer.readUInt16LE(currentPosition + 0x04),  // unk0x04
                this.fileBuffer.readUInt16LE(currentPosition + 0x06),  // ceilingTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x08),  // floorTextureIndex
                this.fileBuffer.readUInt8(currentPosition + 0x0A),  // textureFit
                this.fileBuffer.readUInt8(currentPosition + 0x0B),  // lighting
                this.fileBuffer.readUInt8(currentPosition + 0x0C),  // unk0x0C
                this.fileBuffer.readUInt8(currentPosition + 0x0D),  // facesCount
                this.fileBuffer.readUInt16LE(currentPosition + 0x0E),  // firstFaceOffset
                this.fileBuffer.readInt8(currentPosition + 0x10),  // ceilingTextureShiftX
                this.fileBuffer.readInt8(currentPosition + 0x11),  // ceilingTextureShiftY
                this.fileBuffer.readInt8(currentPosition + 0x12),  // floorTextureShiftX
                this.fileBuffer.readInt8(currentPosition + 0x13),  // floorTextureShiftY
                this.fileBuffer.readUInt16LE(currentPosition + 0x14),  // unk0x14
                this.fileBuffer.readUInt16LE(currentPosition + 0x16),  // unk0x16
                this.fileBuffer.readUInt16LE(currentPosition + 0x18),  // intermediateFloorOffset
            );

            sector.selfOffset = currentPosition;
            this.sectorsSection.sectors.push(sector);
            this.sectorsSection.offsetMap[currentPosition] = sector;

            currentPosition += 0x1A;
        }
        this.sectorsSection.faceCount = this.fileBuffer.readUInt16LE(currentPosition);

        // console.log(`Sector section results:\n`
        //     + `First sector: ${this.sectorsSection.sectors[0]?.toString()}\n`
        //     + `Second sector: ${this.sectorsSection.sectors[1]?.toString()}\n`
        //     + `Face count ${this.sectorsSection.faceCount}`
        // );
    }

    private parseFacesSection() {
        let currentPosition = this.header.facesOffset;
        this.facesSection.faces = [];
        this.facesSection.offsetMap = {};
        for (let i = 0; i < this.sectorsSection.faceCount; i++) {
            const face = new Face(
                this.fileBuffer.readUInt16LE(currentPosition), // vertexOffset01
                this.fileBuffer.readUInt16LE(currentPosition + 0x02), // vertexOffset02
                this.fileBuffer.readUInt16LE(currentPosition + 0x04), // textureMappingOffset
                this.fileBuffer.readUInt16LE(currentPosition + 0x06), // sectorOffset
                this.fileBuffer.readUInt16LE(currentPosition + 0x08), // sisterFaceOffset
                this.fileBuffer.readUInt16LE(currentPosition + 0x0A), // unk0x0A
            );

            face.selfOffset = currentPosition;
            this.facesSection.faces.push(face);
            this.facesSection.offsetMap[currentPosition] = face;

            currentPosition += 0x0C;
        }
        this.facesSection.faceTextureMappingCount = this.fileBuffer.readUInt16LE(currentPosition);

        // console.log(`Face section results:\n`
        //     + `First face: ${this.facesSection.faces[0]?.toString()}\n`
        //     + `Second face: ${this.facesSection.faces[1]?.toString()}\n`
        //     + `Face count ${this.facesSection.faceTextureMappingCount}`
        // );
    }

    private parseFaceTextureMappingSection() {
        let currentPosition = this.header.faceTextureMapsOffset;
        this.faceTextureMappingSection.mappings = [];
        this.faceTextureMappingSection.offsetMap = {};
        for (let i = 0; i < this.facesSection.faceTextureMappingCount; i++) {
            const type = this.fileBuffer.readUInt8(currentPosition + 0x01);
            let extraData: undefined | ExtraFaceTextureMappingData;
            if (type >= 0x80 /* && type <= 0x8F */) {
                extraData = {
                    shiftTextureX: this.fileBuffer.readInt8(currentPosition + 0x0A),
                    shiftTextureY: this.fileBuffer.readInt8(currentPosition + 0x0B),
                    unk0x0C: this.fileBuffer.readUInt16LE(currentPosition + 0x0C),
                }
            }
            
            const faceTexturingMapping = new FaceTextureMapping(
                this.fileBuffer.readUInt8(currentPosition),             // unk0x00
                type,      // type
                this.fileBuffer.readUInt16LE(currentPosition + 0x02),   // midTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x04),   // upperTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x06),   // lowerTextureIndex
                this.fileBuffer.readUInt16LE(currentPosition + 0x08),   // unk0x08
                extraData,
            );

            faceTexturingMapping.selfOffset = currentPosition;
            this.faceTextureMappingSection.mappings.push(faceTexturingMapping);
            this.faceTextureMappingSection.offsetMap[currentPosition] = faceTexturingMapping;

            currentPosition += 0x0A;
            if (extraData) {
                currentPosition += 0x04;
            }
        }

        // console.log(`Face texture mapping section results:\n`
        //     + `First face texture mapping: ${this.faceTextureMappingSection.mappings[0]?.toString()}\n`
        //     + `Second face texture mapping: ${this.faceTextureMappingSection.mappings[1]?.toString()}\n`
        // );
    }

    private parseMidPlatformSection() {
        if (this.header.midPlatformsSection === 0x0000) {
            return;
        }

        let currentPosition = this.header.midPlatformsSection - 0x02;
        this.midPlatformsSection = new MidPlatformsSection();
        this.midPlatformsSection.count = this.fileBuffer.readUInt16LE(currentPosition);
        currentPosition += 0x02;

        for (let i = 0; i < this.midPlatformsSection.count; i++) {
            const midPlatform = new MidPlatform(
                this.fileBuffer.readUInt16LE(currentPosition),        // ceilingTextureIndex
                this.fileBuffer.readInt16LE(currentPosition + 0x02), // ceilingHeight
                this.fileBuffer.readUInt16LE(currentPosition + 0x04), // unk0x04
                this.fileBuffer.readUInt16LE(currentPosition + 0x06), // floorTextureIndex
                this.fileBuffer.readInt16LE(currentPosition + 0x08), // floorHeight
                this.fileBuffer.readUInt16LE(currentPosition + 0x0A), // unk0x0A
                this.fileBuffer.readUInt16LE(currentPosition + 0x0C), // unk0x0C
            );

            midPlatform.selfOffset = currentPosition;
            this.midPlatformsSection.platforms.push(midPlatform);
            this.midPlatformsSection.offsetMap[currentPosition] = midPlatform;

            currentPosition += 0x0E;
        }

        // console.log(`Mid platform section results:\n`
        //     + `Mid platform count ${this.midPlatformsSection.count}\n`
        //     + `First mid platform: ${this.midPlatformsSection.platforms[0]?.toString()}\n`
        //     + `Second mid platform: ${this.midPlatformsSection.platforms[1]?.toString()}\n`
        // );
    }

    private parseMapMetadata() {
        const currentPosition = this.header.mapMetadataOffset;
        this.mapMetadataSection = new MapMetadataSection(
            this.fileBuffer.readInt16LE(currentPosition),           // initPosX
            this.fileBuffer.readInt16LE(currentPosition + 0x02),    // initPosZ
            this.fileBuffer.readInt16LE(currentPosition + 0x04),    // initPosY
            this.fileBuffer.readInt16LE(currentPosition + 0x06),    // rotation
            this.fileBuffer.readUInt16LE(currentPosition + 0x08),   // moveSpeed
            this.fileBuffer.readUInt16LE(currentPosition + 0x0A),   // playerHeight
            this.fileBuffer.readUInt16LE(currentPosition + 0x0C),   // maxClimb
            this.fileBuffer.readUInt16LE(currentPosition + 0x0E),   // minFit
            this.fileBuffer.readUInt16LE(currentPosition + 0x10),   // unk0x10
            this.fileBuffer.readInt16LE(currentPosition + 0x12),    // candleGlow
            this.fileBuffer.readUInt16LE(currentPosition + 0x14),   // lightAmbience
            this.fileBuffer.readUInt16LE(currentPosition + 0x16),   // unk0x16
            this.fileBuffer.readUInt16LE(currentPosition + 0x18),   // skyTexture
            this.fileBuffer.readUInt16LE(currentPosition + 0x1A),   // unk0x1A
        );

        // console.log(this.mapMetadataSection.toString());
    }

    private parseVerticesSection() {
        let currentPosition = this.header.verticesOffset;
        this.verticesSection.header = {
            sectionSize: this.fileBuffer.readUInt16LE(currentPosition),
            sectionHeaderSize: this.fileBuffer.readUInt16LE(currentPosition + 0x02),
            unk0x04: this.fileBuffer.readUInt16LE(currentPosition + 0x04),
            verticesCount: this.fileBuffer.readUInt16LE(currentPosition + 0x06),
        }
        currentPosition += 0x08;

        for (let i = 0; i < this.verticesSection.header.verticesCount; i++) {
            const vertex = new Vertex(
                this.fileBuffer.readInt16LE(currentPosition),           // unk0x00
                this.fileBuffer.readInt16LE(currentPosition + 0x02),    // unk0x02
                this.fileBuffer.readInt16LE(currentPosition + 0x04),    // unk0x04
                this.fileBuffer.readInt16LE(currentPosition + 0x06),    // unk0x06
                this.fileBuffer.readInt16LE(currentPosition + 0x08),   // posX
                this.fileBuffer.readInt16LE(currentPosition + 0x0A),   // posY
            );

            vertex.selfOffset = currentPosition;
            vertex.selfRelativeOffset = currentPosition - this.header.verticesOffset;
            this.verticesSection.vertices.push(vertex);
            this.verticesSection.offsetMap[vertex.selfOffset] = vertex;
            this.verticesSection.relativeOffsetMap[vertex.selfRelativeOffset] = vertex;

            if ((vertex.unk0x00 + vertex.unk0x02 + vertex.unk0x04 + vertex.unk0x06) !== 0x0000) {
                console.log(`Found additional vertex data! ${vertex.selfOffset}`);
            }

            currentPosition += 0x0C;
        }

        // console.log(`Vertices section results:\n`
        //     + `Vertices header: 
        //         sectionSize: ${this.verticesSection.header.sectionSize}
        //         sectionHeaderSize: ${this.verticesSection.header.sectionHeaderSize}
        //         unk0x04: ${this.verticesSection.header.unk0x04}
        //         verticesCount: ${this.verticesSection.header.verticesCount}\n`
        //     + `First vertex: ${this.verticesSection.vertices[0]?.toString()}\n`
        //     + `Second vertex: ${this.verticesSection.vertices[1]?.toString()}\n`
        // );
    }

    private parseCommandsSection() {
        const commandSectionStart = this.header.verticesOffset + this.header.verticesSectionSize;
        let currentPosition = commandSectionStart;
        this.commandsSection.header = {
            signature: this.fileBuffer.toString('ascii', currentPosition, currentPosition + 0x02),
            unk0x02: this.fileBuffer.readUInt16LE(currentPosition + 0x02),
            relativeOffsetToCommands: this.fileBuffer.readUInt16LE(currentPosition + 0x04),
            commandCount: this.fileBuffer.readUInt16LE(currentPosition + 0x06),
        }
        currentPosition += 0x08;

        for (let i = 0; i < 15; i++) {
            this.commandsSection.commandCategoriesSection[i] = {
                category: this.fileBuffer.readUInt16LE(currentPosition),
                count: this.fileBuffer.readUInt16LE(currentPosition + 0x02)
            }
            currentPosition += 0x04;
        }

        for (let i = 0; i < this.commandsSection.header.commandCount; i++) {
            this.commandsSection.commandEntryPointsOffsets.push(this.fileBuffer.readUInt16LE(currentPosition));
            currentPosition += 0x02;
        }

        if (currentPosition !== commandSectionStart + this.commandsSection.header.relativeOffsetToCommands) {
            console.log(`Command start offset mismatch: ` 
                + `expected relative offset: 0x${this.commandsSection.header.relativeOffsetToCommands.toString(16).padStart(4, '0')} `
                + `ended relative offset: 0x${(currentPosition - commandSectionStart).toString(16).padStart(4, '0')}`
            );
        }

        currentPosition = commandSectionStart + this.commandsSection.header.relativeOffsetToCommands;
        let positionInCommand = 0x00;
        let commandSize = 0x00;
        for (let i = 0; i < this.commandsSection.header.commandCount; i++) {
            positionInCommand = 0x00;
            commandSize = 0x00;
            let typeA: number = 0;
            let typeB: number = 0;
            let nextCommand: number = 0;
            const args: number[] = [];
            let rawCommand = '';
            commandSize = this.fileBuffer.readUInt16LE(currentPosition + positionInCommand);
            rawCommand += commandSize.toString(16).padStart(4, '0');
            positionInCommand += 0x02;
            while (positionInCommand < commandSize) {
                switch (positionInCommand) {
                    case 0x00:
                        // this shouldn't happen
                        positionInCommand += 0x02;
                        break;
                    case 0x02: 
                        typeB = this.fileBuffer.readUInt8(currentPosition + positionInCommand);
                        rawCommand += ' ' + typeB.toString(16).padStart(2, '0');
                        positionInCommand += 0x01;
                        break;
                    case 0x03:
                        typeA = this.fileBuffer.readUInt8(currentPosition + positionInCommand);
                        rawCommand += ' ' + typeA.toString(16).padStart(2, '0');
                        positionInCommand += 0x01;
                        break;
                    case 0x04:
                        nextCommand = this.fileBuffer.readUInt16LE(currentPosition + positionInCommand);
                        rawCommand += ' ' + nextCommand.toString(16).padStart(4, '0');
                        positionInCommand += 0x02;
                    default:
                        const arg = this.fileBuffer.readUInt16LE(currentPosition + positionInCommand);
                        args.push(arg);
                        rawCommand += ' ' + arg.toString(16).padStart(4, '0');
                        positionInCommand += 0x02;
                        break;
                }
            }
            const command = new Command(rawCommand, commandSize, typeA, typeB, nextCommand, args);
            command.adjustedIndexInFile = i + 1;
            command.selfOffset = currentPosition;
            this.commandsSection.commands.push(command);
            this.commandsSection.offsetMap[currentPosition] = command;
            this.commandsSection.relativeOffsetMap[currentPosition - commandSectionStart] = command;
            currentPosition += commandSize;
        }

        for (const commandOffset of this.commandsSection.commandEntryPointsOffsets) {
            if (commandOffset === 0x0000) {
                continue;
            }

            this.commandsSection.commandEntryPoints.push(this.commandsSection.relativeOffsetMap[commandOffset]);
        }

        for (const command of this.commandsSection.commands) {
            if (!command.nextCommandIndex) {
                continue;
            }

            const nextCommand = this.commandsSection.commands[command.nextCommandIndex - 1];
            command.nextCommand = nextCommand;
            nextCommand.commandsThatCallThis.push(command);
        }


        // console.log(`Vertices section results:\n`
        //     + `Commands section header: 
        //         signature: ${this.commandsSection.header.signature}
        //         unk0x02: ${this.commandsSection.header.unk0x02.toString(16).padStart(4, '0')}
        //         relativeOffsetToCommands: ${this.commandsSection.header.relativeOffsetToCommands.toString(16).padStart(4, '0')}
        //         commandCount: ${this.commandsSection.header.commandCount.toString(16).padStart(4, '0')}\n`
        //     + `counts: ${this.commandsSection.commandCategoriesSection.map((value: CommandsCategoryEntry, index: number) => {
        //         return `\n\t(${index}) cat: ${value.category.toString(16).padStart(4, '0')} count: ${value.count.toString(16).padStart(4, '0')}`
        //     })}\n\n`
        //     + `First command: ${this.commandsSection.commands[0]?.toString()}\n`
        //     + `Second command: ${this.commandsSection.commands[1]?.toString()}\n`
        //     + `Third command: ${this.commandsSection.commands[2]?.toString()}\n`
        // );

    }

    private parseSection7() {
        const section7Start = this.header.verticesOffset + this.header.verticesSectionSize + this.header.commandsSectionSize;
        let currentPosition = section7Start;
        this.section7.header = {
            size_a: this.fileBuffer.readUInt16LE(currentPosition),
            count: this.fileBuffer.readUInt16LE(currentPosition + 0x02),
        }
        currentPosition += 0x04;

        for (let i = 0; i < this.section7.header.count; i++) {
            const unkObject01 = new UnkObject01(
                this.fileBuffer.readInt16LE(currentPosition),
                this.fileBuffer.readInt16LE(currentPosition + 0x02),
                this.fileBuffer.readUInt16LE(currentPosition + 0x04),
                this.fileBuffer.readUInt16LE(currentPosition + 0x06),
                this.fileBuffer.readUInt16LE(currentPosition + 0x08),
                this.fileBuffer.readUInt16LE(currentPosition + 0x0A),
                this.fileBuffer.readUInt16LE(currentPosition + 0x0C),
                this.fileBuffer.readUInt16LE(currentPosition + 0x0E),
                this.fileBuffer.readUInt16LE(currentPosition + 0x10),
            );
            unkObject01.selfOffset = currentPosition;
            this.section7.unkArray01.push(unkObject01);
            currentPosition += 0x12;
        }

        if (this.section7.header.size_a === this.header.section7Size) {
            return;
        }

        this.section7.unkArray02 = [];
        currentPosition = section7Start + this.section7.header.size_a;
        while (currentPosition < section7Start + this.header.section7Size) {
            const unkObject02 = new UnkObject02(
                this.fileBuffer.readUInt16LE(currentPosition),
                this.fileBuffer.readUInt16LE(currentPosition + 0x02),
                this.fileBuffer.readUInt16LE(currentPosition + 0x04),
                this.fileBuffer.readUInt16LE(currentPosition + 0x06),
                this.fileBuffer.readUInt16LE(currentPosition + 0x08),
                this.fileBuffer.readUInt16LE(currentPosition + 0x0A),
                this.fileBuffer.readUInt16LE(currentPosition + 0x0C),
                this.fileBuffer.readUInt16LE(currentPosition + 0x0E),
                this.fileBuffer.readUInt16LE(currentPosition + 0x10),
                this.fileBuffer.readUInt16LE(currentPosition + 0x12),
                this.fileBuffer.readUInt16LE(currentPosition + 0x14),
                this.fileBuffer.readUInt16LE(currentPosition + 0x16),
                this.fileBuffer.readUInt16LE(currentPosition + 0x18),
                this.fileBuffer.readUInt16LE(currentPosition + 0x1A),
                this.fileBuffer.readUInt16LE(currentPosition + 0x1C),
                this.fileBuffer.readUInt16LE(currentPosition + 0x1E),
            );
            unkObject02.selfOffset = currentPosition;
            this.section7.unkArray02.push(unkObject02);
            currentPosition += 0x20;
        }

        // console.log(`Vertices section results:\n`
        //     + `Vertices header: 
        //         size_a: ${this.section7.header.size_a}
        //         count: ${this.section7.header.count}\n`
        //     + `UnkArray01:\n`
        //     + `First element: ${this.section7.unkArray01[0]?.toString()}\n`
        //     + `Second element: ${this.section7.unkArray01[1]?.toString()}\n\n`
        //     + `UnkArray02:\n`
        //     + `First element: ${this.section7.unkArray02[0]?.toString()}\n`
        //     + `Second element: ${this.section7.unkArray02[1]?.toString()}\n`
        // );
    }

    private parseObjectsSection() {
        const objectsSectionStart = this.header.verticesOffset + this.header.verticesSectionSize + this.header.commandsSectionSize + this.header.section7Size;
        let currentPosition = objectsSectionStart;
        this.objectsSection.size = this.fileBuffer.readUInt16LE(currentPosition);
        currentPosition += 0x02;
        for (let i = 0; i < this.header.sectorCount; i++) {
            const objectContainerRelativeOffset = this.fileBuffer.readUInt16LE(currentPosition)
            this.objectsSection.sectorObjectMapping.push(objectContainerRelativeOffset);
            if (objectContainerRelativeOffset === 0x0000) {
                currentPosition += 0x02;
                continue;
            }
            
            const objectContainer = new ObjectContainer();
            objectContainer.associatedSector = this.sectorsSection.sectors[i];
            this.sectorsSection.sectors[i].associatedObjectContainer = objectContainer;
            this.objectsSection.objectContainers.push(objectContainer);

            const objectContainerOffset = objectsSectionStart + objectContainerRelativeOffset;
            objectContainer.count = this.fileBuffer.readUint8(objectContainerOffset);
            objectContainer.countRepeat = this.fileBuffer.readUint8(objectContainerOffset + 0x01);
            objectContainer.selfRelativeOffset = objectContainerRelativeOffset;
            objectContainer.selfOffset = objectContainerOffset;

            let gameObjectPosition = objectContainerOffset + 0x02;
            for (let j = 0; j < objectContainer.count; j++) {
                const gameObject = new GameObject(
                    this.fileBuffer.readInt16LE(gameObjectPosition), // posX
                    this.fileBuffer.readInt16LE(gameObjectPosition + 0x02), // posY
                    this.fileBuffer.readUInt8(gameObjectPosition + 0x04), // textureIndex
                    this.fileBuffer.readUInt8(gameObjectPosition + 0x05), // textureSource
                    this.fileBuffer.readUInt8(gameObjectPosition + 0x06), // rotation
                    this.fileBuffer.readUInt8(gameObjectPosition + 0x07), // unk0x07
                    this.fileBuffer.readUInt8(gameObjectPosition + 0x08), // lighting
                    this.fileBuffer.readUInt8(gameObjectPosition + 0x09), // renderType
                    this.fileBuffer.readUInt16LE(gameObjectPosition + 0x0A), // posZ
                    this.fileBuffer.readUInt16LE(gameObjectPosition + 0x0C), // unk0x0C
                    this.fileBuffer.readUInt16LE(gameObjectPosition + 0x0E), // unk0x0E
                );
                gameObject.container = objectContainer;
                gameObject.selfOffset = gameObjectPosition;
                objectContainer.objects.push(gameObject);

                gameObjectPosition += 0x10;
            }
            currentPosition += 0x02;
        }

        // console.log(`Objects section results:\n`
        //     + `
        //         size: ${this.objectsSection.size}
        //         sectorMappingCount: ${this.objectsSection.sectorObjectMapping.length}
        //         sectorMapping: ${this.objectsSection.sectorObjectMapping.map((offset: number) => '0x' + offset.toString(16).padStart(4, '0')).join(' ')}\n`
        //     + `First object container: ${this.objectsSection.objectContainers[0]?.toString()}\n`
        //     + `Second object container: ${this.objectsSection.objectContainers[1]?.toString()}\n`
        // );

    }

    private parseFooter() {
        const footerStart = this.header.verticesOffset + this.header.verticesSectionSize + this.header.commandsSectionSize + this.header.section7Size + this.header.objectsSectionSize;
        if (this.fileBuffer.length - this.header.footerSize !== footerStart) {
            console.log('Found a footer discrepancy. Inconsistent size.');
        }

        if (this.fileBuffer.length - footerStart !== 0x08) {
            console.log('Found a footer discrepancy. Not 0x08 in size. WILL AFFECT FOOTER VALUE READ.');
        }

        this.footer = this.fileBuffer.readBigUInt64LE(footerStart);

        if (this.footer !== 524296n) {
            console.log('FOUND A DIFFERENT FOOTER.');
        }

        // console.log(this.footer.toString(16).padStart(16, '0'));
        // console.log(this.footer);
    }
}
