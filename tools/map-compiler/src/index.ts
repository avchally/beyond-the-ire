import * as fs from 'fs';
import * as path from 'path';
import { RAWRJSON } from "./rawrjson";

function main() {
    const rawrDirectory = `../../output/RAWR/`;
    const outputDirectory = `../../output/RAW_reprocessed/`;

    const mapNames: string[] = getRAWRMapFileNames(rawrDirectory);

    console.log(mapNames);
    for (const mapName of mapNames) {
        try {
            const rawrJson: RAWRJSON = JSON.parse(fs.readFileSync(path.join(rawrDirectory, `${mapName}.RAWR`), 'utf-8'));
            console.log(`Processing ${mapName}`);
            const rawBuffer = createRawFileBuffer(rawrJson);
            writeRawBufferToFile(outputDirectory, rawBuffer, mapName);
        } catch (error) {
            console.log(`Map failed: ${mapName}. ${error}`);
        }
    }
}
main();

function writeRawBufferToFile(outputDir: string, rawBuffer: Buffer, mapName: string) {
    console.log(`Writing map ${mapName} to .RAW file.`);
    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `${mapName}.RAW`);
    fs.writeFileSync(filePath, rawBuffer);
}

function getRAWRMapFileNames(directoryPath: string): string[] {
    try {
      const files = fs.readdirSync(directoryPath);
      const mapFiles = files.filter(file => path.extname(file).toLowerCase() === '.rawr').map(file => file.toLowerCase().split('.rawr')[0]);
      return mapFiles;
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  };

/////////////////////////////////////////////////////////////////////

interface SectionSizeData {
    startsAt: number;
    size: number;
}

interface SectionSizes {
    header: SectionSizeData;
    sectorsSection: SectionSizeData;
    facesSection: SectionSizeData;
    textureMappingSection: SectionSizeData;
    midPlatformSection: SectionSizeData;
    mapMetadataSection: SectionSizeData;
    verticesSection: SectionSizeData;
    commandsSection: SectionSizeData;
    section7A: SectionSizeData;
    section7B: SectionSizeData;
    objectsSection: SectionSizeData;
    footer: SectionSizeData;
}

interface CommandCategoryHelperObject {
    [categoryNumber: string]: {
        count: number;
        firstCommandIndex: number;
    }
}

interface CommandHelperObject {
    relativeOffset: number;
    commandIndex: number;
}

function createRawFileBuffer(rawr: RAWRJSON): Buffer {
    const sectionSizes: SectionSizes = calculateSectionSizesAndOffsets(rawr);
    const buffer = Buffer.alloc(sectionSizes.footer.startsAt + sectionSizes.footer.size);
    
    writeHeader(buffer, rawr, sectionSizes);
    writeSectors(buffer, rawr, sectionSizes);
    const textureMappingOffsets = writeTextureMappingSection(buffer, rawr, sectionSizes);
    writeFaces(buffer, rawr, sectionSizes, textureMappingOffsets);
    writeMidPlatformSection(buffer, rawr, sectionSizes);
    writeMapMetadata(buffer, rawr, sectionSizes);
    writeVerticesSection(buffer, rawr, sectionSizes);
    writeCommandsSection(buffer, rawr, sectionSizes);
    writeSection7(buffer, rawr, sectionSizes);
    writeObjectsSection(buffer, rawr, sectionSizes);
    writeFooter(buffer, rawr, sectionSizes);

    // printBuffer(buffer);
    return buffer;
}

function printBuffer(buffer: Buffer) {
    let rowString = '';
    for (const [index, byte] of buffer.entries()) {
        rowString += byte.toString(16).padStart(2, '0').toUpperCase() + ' ';
        if ((index + 1) % 16 === 0) {
            console.log(rowString);
            rowString = '';
        }
    }
    console.log(rowString);
}

function writeHeader(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    buffer.writeUInt16LE(sectionSizes.verticesSection.startsAt, 0x00);  // VERTICES_OFFSET
    buffer.writeUInt16LE(0x0070, 0x02);  // VERSION 
    buffer.writeUInt16LE(sectionSizes.sectorsSection.startsAt, 0x04);  // SECTORS_OFFSET
    buffer.writeUInt16LE(sectionSizes.facesSection.startsAt, 0x06);  // FACES_OFFSET
    buffer.writeUInt16LE(sectionSizes.textureMappingSection.startsAt, 0x08);  // FACE_TEXTURE_MAPS_OFFSET
    buffer.writeUInt16LE(sectionSizes.mapMetadataSection.startsAt, 0x0A);  // MAP_METADATA_OFFSET
    buffer.writeUInt16LE(sectionSizes.verticesSection.startsAt, 0x0C);  // VERTICES_OFFSET_REPEAT
    buffer.write('WR', 0x0E);  // SIGNATURE
    buffer.writeUInt16LE(sectionSizes.midPlatformSection.startsAt, 0x10);  // MID_PLATFORMS_SECTION
    buffer.writeUInt16LE(sectionSizes.section7A.size + sectionSizes.section7B.size, 0x12);  // SECTION_7_SIZE
    buffer.writeUInt16LE(sectionSizes.verticesSection.size, 0x14);  // VERTICES_SECTION_SIZE
    buffer.writeUInt16LE(sectionSizes.objectsSection.size, 0x16);  // OBJECTS_SECTION_SIZE
    buffer.writeUInt16LE(sectionSizes.footer.size, 0x18);  // FOOTER_SIZE
    buffer.writeUInt16LE(sectionSizes.commandsSection.size, 0x1A);  // COMMANDS_SECTION_SIZE
    buffer.writeUInt16LE(rawr.sectorsSection.sectors.length, 0x1C);  // SECTOR_COUNT
}

function writeSectors(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    const sectionStart = sectionSizes.sectorsSection.startsAt;
    let position = sectionStart;
    for (const sector of rawr.sectorsSection.sectors) {
        const firstFaceOffset = sectionSizes.facesSection.startsAt + sector.firstFaceIndex * 0x0C;
        const midPlatformOffset = sectionSizes.midPlatformSection.size > 0x00 && sector.intermediateFloorIndex !== undefined 
            ? sectionSizes.midPlatformSection.startsAt + sector.intermediateFloorIndex * 0x0E
            : 0x00;
        
        buffer.writeInt16LE(sector.ceilingHeight, position);
        buffer.writeInt16LE(sector.floorHeight, position + 0x02);
        buffer.writeUInt16LE(sector.unk0x04, position + 0x04);
        buffer.writeUInt16LE(sector.ceilingTextureIndex, position + 0x06);
        buffer.writeUInt16LE(sector.floorTextureIndex, position + 0x08);
        buffer.writeUInt8(sector.textureFit, position + 0x0A);
        buffer.writeUInt8(sector.lighting, position + 0x0B);
        buffer.writeInt8(sector.textureMapOverride, position + 0x0C);
        buffer.writeUInt8(sector.facesCount, position + 0x0D);
        buffer.writeUInt16LE(firstFaceOffset, position + 0x0E);
        buffer.writeInt8(sector.ceilingTextureShiftX, position + 0x10);
        buffer.writeInt8(sector.ceilingTextureShiftY, position + 0x11);
        buffer.writeInt8(sector.floorTextureShiftX, position + 0x12);
        buffer.writeInt8(sector.floorTextureShiftY, position + 0x13);
        buffer.writeUInt16LE(sector.floorTriggerID, position + 0x14);
        buffer.writeUInt16LE(sector.unk0x16, position + 0x16);
        buffer.writeUInt16LE(midPlatformOffset, position + 0x18);
        position += 0x1A;
    }
    buffer.writeUInt16LE(rawr.facesSection.faces.length, position);
}

function writeFaces(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes, textureMappingOffsets: number[]) {
    let position = sectionSizes.facesSection.startsAt;
    for (const face of rawr.facesSection.faces) {
        const vertex01Offset: number = 0x08 + face.vertexIndex01 * 0x0C;
        const vertex02Offset: number = 0x08 + face.vertexIndex02 * 0x0C;
        const textureMappingOffset: number = textureMappingOffsets[face.textureMappingIndex];
        const sectorOffset: number = sectionSizes.sectorsSection.startsAt + face.sectorIndex * 0x1A;
        const sisterFaceOffset: number = face.sisterFaceIndex !== undefined
            ? sectionSizes.facesSection.startsAt + face.sisterFaceIndex * 0x0C
            : 0xFFFF;

        buffer.writeUInt16LE(vertex01Offset, position);
        buffer.writeUInt16LE(vertex02Offset, position + 0x02);
        buffer.writeUInt16LE(textureMappingOffset, position + 0x04);
        buffer.writeUInt16LE(sectorOffset, position + 0x06);
        buffer.writeUInt16LE(sisterFaceOffset, position + 0x08);
        buffer.writeUInt16LE(face.addCollision, position + 0x0A);
        position += 0x0C;
    }
    buffer.writeUInt16LE(rawr.faceTextureMappingSection.mappings.length, position);
}

function writeTextureMappingSection(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes): number[] {
    const sectionStart = sectionSizes.textureMappingSection.startsAt;
    let position = sectionStart;
    const offsets: number[] = [];
    for (const mapping of rawr.faceTextureMappingSection.mappings) {
        offsets.push(position);
        buffer.writeUInt8(mapping.unk0x00, position);
        buffer.writeUInt8(mapping.type, position + 0x01);
        buffer.writeUInt16LE(mapping.midTextureIndex, position + 0x02);
        buffer.writeUInt16LE(mapping.upperTextureIndex, position + 0x04);
        buffer.writeUInt16LE(mapping.lowerTextureIndex, position + 0x06);
        buffer.writeUInt16LE(mapping.unk0x08, position + 0x08);
        position += 0x0A;
        if (mapping.additionalMetadata && Object.keys(mapping.additionalMetadata).length > 0) {
            buffer.writeInt8(mapping.additionalMetadata.shiftTextureX, position);
            buffer.writeInt8(mapping.additionalMetadata.shiftTextureY, position + 0x01);
            buffer.writeUInt16LE(mapping.additionalMetadata.unk0x0C, position + 0x02);
            position += 0x04;
        }
    }

    return offsets;
}

function writeMidPlatformSection(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    let position = sectionSizes.midPlatformSection.startsAt - 0x02;
    if (!rawr.midPlatformsSection) {
        return;
    }
    buffer.writeUInt16LE(rawr.midPlatformsSection.platforms.length, position);
    position += 0x02;
    for (const midPlatform of rawr.midPlatformsSection.platforms) {
        buffer.writeUInt16LE(midPlatform.ceilingTextureIndex, position);
        buffer.writeInt16LE(midPlatform.ceilingHeight, position + 0x02);
        buffer.writeUInt16LE(midPlatform.unk0x04, position + 0x04);
        buffer.writeUInt16LE(midPlatform.floorTextureIndex, position + 0x06);
        buffer.writeInt16LE(midPlatform.floorHeight, position + 0x08);
        buffer.writeUInt16LE(midPlatform.unk0x0A, position + 0x0A);
        buffer.writeUInt16LE(midPlatform.unk0x0C, position + 0x0C);
        position += 0x0E;
    }
}

function writeMapMetadata(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    const position = sectionSizes.mapMetadataSection.startsAt;
    buffer.writeInt16LE(rawr.mapMetadataSection.initPosX, position);
    buffer.writeInt16LE(rawr.mapMetadataSection.initPosZ, position + 0x02);
    buffer.writeInt16LE(rawr.mapMetadataSection.initPosY, position + 0x04);
    buffer.writeInt16LE(rawr.mapMetadataSection.rotation, position + 0x06);
    buffer.writeUInt16LE(rawr.mapMetadataSection.moveSpeed, position + 0x08);
    buffer.writeUInt16LE(rawr.mapMetadataSection.playerHeight, position + 0x0A);
    buffer.writeUInt16LE(rawr.mapMetadataSection.maxClimb, position + 0x0C);
    buffer.writeUInt16LE(rawr.mapMetadataSection.minFit, position + 0x0E);
    buffer.writeUInt16LE(rawr.mapMetadataSection.unk0x10, position + 0x10);
    buffer.writeInt16LE(rawr.mapMetadataSection.candleGlow, position + 0x12);
    buffer.writeUInt16LE(rawr.mapMetadataSection.lightAmbience, position + 0x14);
    buffer.writeUInt16LE(rawr.mapMetadataSection.unk0x16, position + 0x16);
    buffer.writeUInt16LE(rawr.mapMetadataSection.skyTexture, position + 0x18);
    buffer.writeUInt16LE(rawr.mapMetadataSection.unk0x1A, position + 0x1A);
}

function writeVerticesSection(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    let start = sectionSizes.verticesSection.startsAt;
    buffer.writeUInt16LE(sectionSizes.verticesSection.size, start);
    buffer.writeUInt16LE(0x08, start + 0x02);
    buffer.writeUInt16LE(0x00, start + 0x04);
    if (rawr.verticesSection.vertices.length > 0xFFFF) {
        throw new Error("Vertex count exceeds maximum (0xFFFF)");
    }
    buffer.writeUInt16LE(rawr.verticesSection.vertices.length, start + 0x06);

    start += 0x08;
    for (const vertex of rawr.verticesSection.vertices) {
        buffer.writeUInt16LE(0x00, start);
        buffer.writeUInt16LE(0x00, start + 0x02);
        buffer.writeUInt16LE(0x00, start + 0x04);
        buffer.writeUInt16LE(0x00, start + 0x06);
        buffer.writeInt16LE(vertex.x, start + 0x08);
        buffer.writeInt16LE(vertex.y, start + 0x0A);
        start += 0x0C;
    }
}

function writeCommandsSection(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    const commandBaseToCategory: { [key: number]: number } = {
        0x08: 1,
        0x02: 1,
        0x03: 3,
        0x13: 4,
        0x18: 5,
        0x19: 6,
        0x1A: 7,
        0x1B: 8,
        0x25: 9,
        0x32: 11,
        0x31: 12,
        0x30: 13,
        0x37: 14,
        0x39: 15
    };
    
    const sectionStart = sectionSizes.commandsSection.startsAt
    const allCommandsRelativeOffset = 0x44 + rawr.commandsSection.allCommands.length * 0x02;
    const allCommandsOffset = sectionStart + allCommandsRelativeOffset;
    const entryCommandReferencesOffset = sectionStart + 0x44;
    let start: number;

    // commands header
    start = sectionStart;
    buffer.write(rawr.commandsSection.header.signature || "3u", start); //SIGNATURE
    buffer.writeUInt16LE(rawr.commandsSection.header.unk0x02 || 0x00, start + 0x02);
    buffer.writeUInt16LE(allCommandsRelativeOffset, start + 0x04); // COMMANDS OFFSET
    buffer.writeUInt16LE(rawr.commandsSection.allCommands.length, start + 0x06); // COMMANDS COUNT

    // all commands
    start = allCommandsOffset;
    const allCommandOffset: number[] = [];
    for (const command of rawr.commandsSection.allCommands) {
        allCommandOffset.push(start - sectionStart);
        const size = 0x06 + command.args.length * 0x02;
        buffer.writeUInt16LE(size, start);
        buffer.writeUInt8(command.commandModifier, start + 0x02);
        buffer.writeUInt8(command.commandBase, start + 0x03);
        buffer.writeUInt16LE(command.nextCommandIndex, start + 0x04);
        start += 0x06;
        for (const arg of command.args) {
            buffer.writeUInt16LE(arg, start);
            start += 0x02;
        }
    }
    
    // entry command categories
    const categories: CommandCategoryHelperObject = {};
    let i = 0;
    for (const entryCommandIndex of rawr.commandsSection.entryCommandIndexes) {
        const commandType = rawr.commandsSection.allCommands[entryCommandIndex - 1].commandBase // since all command related indexes are 1 based
        const mappedCategory = commandBaseToCategory[commandType];
        if (!categories[mappedCategory]) {
            categories[mappedCategory] = {
                count: 0,
                firstCommandIndex: i,
            };
        }
        categories[mappedCategory].count += 1;
        buffer.writeUInt16LE(allCommandOffset[entryCommandIndex - 1], entryCommandReferencesOffset + i * 0x02);
        i++;
    }
    
    start = sectionStart + 0x08;
    for (let i = 1; i < 16; i++) {
        const category = categories[i];
        if (category && category.count > 0) {
            buffer.writeUInt16LE(category.firstCommandIndex * 0x02 + 0x44, start);
            buffer.writeUInt16LE(category.count, start + 0x02);
        }
        start += 0x04;
    }

    // console.log(JSON.stringify(categories, null, 2));
}

function writeSection7(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    const sectionStart = sectionSizes.section7A.startsAt;
    let start = sectionStart;
    const array1 = rawr.section7?.unkArray01 || [{
        "unk0x00": 0,
        "unk0x02": 0,
        "unk0x04": 0,
        "unk0x06": 0,
        "unk0x08": 0,
        "unk0x0A": 0,
        "unk0x0C": 0,
        "unk0x0E": 0,
        "unk0x10": 0,
    }];
    buffer.writeUInt16LE(sectionSizes.section7A.size, start);
    buffer.writeUInt16LE(array1.length, start + 0x02);
    start += 0x04;
    for (const array1Obj of array1) {
        buffer.writeInt16LE(array1Obj.unk0x00, start);
        buffer.writeInt16LE(array1Obj.unk0x02, start + 0x02);
        buffer.writeUint16LE(array1Obj.unk0x04, start + 0x04);
        buffer.writeUint16LE(array1Obj.unk0x06, start + 0x06);
        buffer.writeUint16LE(array1Obj.unk0x08, start + 0x08);
        buffer.writeUint16LE(array1Obj.unk0x0A, start + 0x0A);
        buffer.writeUint16LE(array1Obj.unk0x0C, start + 0x0C);
        buffer.writeUint16LE(array1Obj.unk0x0E, start + 0x0E);
        buffer.writeUint16LE(array1Obj.unk0x10, start + 0x10);
        start += 0x12;
    }
    if (!rawr.section7?.unkArray02) {
        return;
    }
    for (const array2Obj of rawr.section7.unkArray02) {
        buffer.writeUInt16LE(array2Obj.unk0x00, start + 0x00);
        buffer.writeUInt16LE(array2Obj.unk0x02, start + 0x02);
        buffer.writeUInt16LE(array2Obj.unk0x04, start + 0x04);
        buffer.writeUInt16LE(array2Obj.unk0x06, start + 0x06);
        buffer.writeUInt16LE(array2Obj.unk0x08, start + 0x08);
        buffer.writeUInt16LE(array2Obj.unk0x0A, start + 0x0A);
        buffer.writeUInt16LE(array2Obj.unk0x0C, start + 0x0C);
        buffer.writeUInt16LE(array2Obj.unk0x0E, start + 0x0E);
        buffer.writeUInt16LE(array2Obj.unk0x10, start + 0x10);
        buffer.writeUInt16LE(array2Obj.unk0x12, start + 0x12);
        buffer.writeUInt16LE(array2Obj.unk0x14, start + 0x14);
        buffer.writeUInt16LE(array2Obj.unk0x16, start + 0x16);
        buffer.writeUInt16LE(array2Obj.unk0x18, start + 0x18);
        buffer.writeUInt16LE(array2Obj.unk0x1A, start + 0x1A);
        buffer.writeUInt16LE(array2Obj.unk0x1C, start + 0x1C);
        buffer.writeUInt16LE(array2Obj.unk0x1E, start + 0x1E);
        start += 0x20;
    }
}

function writeObjectsSection(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    const sectionStart = sectionSizes.objectsSection.startsAt;

    buffer.writeUInt16LE(sectionSizes.objectsSection.size, sectionStart);

    let sectorObjectMappingPos = sectionStart + 0x02;
    let objectContainersPos = sectionStart + 0x02 + rawr.sectorsSection.sectors.length * 0x02;
    for (const sector of rawr.sectorsSection.sectors) {
        if (sector.objectInformation && sector.objectInformation.length > 0) {
            // write to sector object mapping
            buffer.writeUInt16LE(objectContainersPos - sectionStart, sectorObjectMappingPos);
            
            // write the actual object containers
            buffer.writeUInt8(sector.objectInformation.length, objectContainersPos);
            buffer.writeUInt8(sector.objectInformation.length, objectContainersPos + 0x01);
            objectContainersPos += 0x02;
            for (const object of sector.objectInformation) {
                buffer.writeInt16LE(object.posX, objectContainersPos);
                buffer.writeInt16LE(object.posY, objectContainersPos + 0x02);
                buffer.writeUInt8(object.textureIndex, objectContainersPos + 0x04);
                buffer.writeUInt8(object.textureSource, objectContainersPos + 0x05);
                buffer.writeUInt8(object.rotation, objectContainersPos + 0x06);
                buffer.writeUInt8(object.unk0x07, objectContainersPos + 0x07);
                buffer.writeUInt8(object.lighting, objectContainersPos + 0x08);
                buffer.writeUInt8(object.renderType, objectContainersPos + 0x09);
                buffer.writeInt16LE(object.posZ, objectContainersPos + 0x0A);
                buffer.writeUInt16LE(object.unk0x0C, objectContainersPos + 0x0C);
                buffer.writeUInt16LE(object.unk0x0E, objectContainersPos + 0x0E);
                objectContainersPos += 0x10;
            }
        }
        sectorObjectMappingPos += 0x02;
    }
}

function writeFooter(buffer: Buffer, rawr: RAWRJSON, sectionSizes: SectionSizes) {
    // buffer.writeUInt16LE(0x0008, sectionSizes.footer.startsAt);
    // buffer.writeUInt16LE(0x0008, sectionSizes.footer.startsAt + 0x02);
    // buffer.writeUInt32LE(0x00000000, sectionSizes.footer.startsAt + 0x04);

                        // 08    00    08    00    00    00    00    00
    const footerArray = [0x08, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00];
    let position = sectionSizes.footer.startsAt
    for (const byte of footerArray) {
        buffer.writeUInt8(byte, position);
        position += 0x01;
    }
}

function calculateSectionSizesAndOffsets(rawr: RAWRJSON): SectionSizes {
    const header: SectionSizeData = {
        startsAt: 0x00,
        size: 0x1E,
    };
    
    const sectorsSection: SectionSizeData = {
        startsAt: header.size,
        size: rawr.sectorsSection.sectors.length * 0x1A + 0x02,
    };
    
    const facesSection: SectionSizeData = {
        startsAt: sectorsSection.startsAt + sectorsSection.size,
        size: rawr.facesSection.faces.length * 0x0C + 0x02,
    };

    let textureMappingSectionSize = 0x00;
    for (const mapping of rawr.faceTextureMappingSection.mappings) {
        textureMappingSectionSize += 0x0A;
        if (mapping.additionalMetadata && Object.keys(mapping.additionalMetadata).length) {
            textureMappingSectionSize += 0x04;
        }
    }
    const textureMappingSection: SectionSizeData = {
        startsAt: facesSection.startsAt + facesSection.size,
        size: textureMappingSectionSize,
    };

    const midPlatformSection: SectionSizeData = {
        startsAt: rawr.midPlatformsSection ? textureMappingSection.startsAt + textureMappingSection.size + 0x02 : 0x00,
        size: rawr.midPlatformsSection ? rawr.midPlatformsSection.platforms.length * 0x0E : 0x00,
    };

    const mapMetadataSection: SectionSizeData = {
        startsAt: midPlatformSection.startsAt === 0x00 
            ? textureMappingSection.startsAt + textureMappingSection.size
            : midPlatformSection.startsAt + midPlatformSection.size,
        size: 0x1C,
    };

    const verticesSection: SectionSizeData = {
        startsAt: mapMetadataSection.startsAt + mapMetadataSection.size,
        size: 0x08 + rawr.verticesSection.vertices.length * 0x0C,
    };

    let commandSectionSize = 0x44 + rawr.commandsSection.allCommands.length * 0x02;
    for (const command of rawr.commandsSection.allCommands) {
        commandSectionSize += 0x06 + command.args.length * 0x02;
    }
    const commandsSection: SectionSizeData = {
        startsAt: verticesSection.startsAt + verticesSection.size,
        size: commandSectionSize,
    };

    const section7A: SectionSizeData = {
        startsAt: commandsSection.startsAt + commandsSection.size,
        size: rawr.section7 && rawr.section7.unkArray01 ? 0x04 + rawr.section7.unkArray01.length * 0x12 : 0x04 + 0x12,
    };
    const section7B: SectionSizeData = {
        startsAt: section7A.startsAt + section7A.size,
        size: rawr.section7 && rawr.section7.unkArray02 ? rawr.section7.unkArray02.length * 0x20: 0x00,
    }

    let objectsSectionSize = 0x02 + 0x02 * rawr.sectorsSection.sectors.length;
    for (const sector of rawr.sectorsSection.sectors) {
        if (sector.objectInformation.length > 0) {
            objectsSectionSize += 0x02 + sector.objectInformation.length * 0x10;
        }
    }
    const objectsSection: SectionSizeData = {
        startsAt: section7B.startsAt + section7B.size,
        size: objectsSectionSize, 
    }

    const footer: SectionSizeData = {
        startsAt: objectsSection.startsAt + objectsSection.size,
        size: 0x08,
    }

    return {
        header,
        sectorsSection,
        facesSection,
        textureMappingSection,
        midPlatformSection,
        mapMetadataSection,
        verticesSection,
        commandsSection,
        section7A,
        section7B,
        objectsSection,
        footer,
    }
}