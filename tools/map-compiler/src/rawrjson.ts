export interface RAWRJSON {
    sectorsSection: {
        sectors: {
            ceilingHeight: number;
            floorHeight: number;
            unk0x04: number;
            ceilingTextureIndex: number;
            floorTextureIndex: number;
            textureFit: number;
            lighting: number;
            textureMapOverride: number;
            facesCount: number;
            firstFaceIndex: number;
            ceilingTextureShiftX: number;
            ceilingTextureShiftY: number;
            floorTextureShiftX: number;
            floorTextureShiftY: number;
            floorTriggerID: number;
            unk0x16: number;
            intermediateFloorIndex: number | undefined;
            objectInformation: {
                posX: number;
                posY: number;
                textureIndex: number;
                textureSource: number;
                rotation: number;
                unk0x07: number;
                lighting: number;
                renderType: number;
                posZ: number;
                unk0x0C: number;
                unk0x0E: number;
            }[];
        }[];
    };
    facesSection: {
        faces: {
            vertexIndex01: number;
            vertexIndex02: number;
            textureMappingIndex: number;
            sectorIndex: number;
            sisterFaceIndex?: number;
            addCollision: number;
        }[];
    };
    faceTextureMappingSection: {
        mappings: {
            unk0x00: number;
            type: number;
            midTextureIndex: number;
            upperTextureIndex: number;
            lowerTextureIndex: number;
            unk0x08: number;
            additionalMetadata: {
                shiftTextureX: number;
                shiftTextureY: number;
                unk0x0C: number;
            } | undefined;
        }[];
    };
    midPlatformsSection?: {
        platforms: {
            ceilingTextureIndex: number;
            ceilingHeight: number;
            unk0x04: number;
            floorTextureIndex: number;
            floorHeight: number;
            unk0x0A: number;
            unk0x0C: number;
        }[];
    };
    mapMetadataSection: {
        initPosX: number;
        initPosZ: number;
        initPosY: number;
        rotation: number;
        moveSpeed: number;
        playerHeight: number;
        maxClimb: number;
        minFit: number;
        unk0x10: number;
        candleGlow: number;
        lightAmbience: number;
        unk0x16: number;
        skyTexture: number;
        unk0x1A: number;
    };
    verticesSection: {
        vertices: {
            x: number;
            y: number;
        }[];
    };
    commandsSection: {
        header: {
            signature: string;
            unk0x02: number;
        };
        entryCommandIndexes: number[];
        allCommands: {
            commandBase: number;
            commandModifier: number;
            nextCommandIndex: number;
            args: number[];
        }[];
    };
    section7?: {
        unkArray01: {
            unk0x00: number;
            unk0x02: number;
            unk0x04: number;
            unk0x06: number;
            unk0x08: number;
            unk0x0A: number;
            unk0x0C: number;
            unk0x0E: number;
            unk0x10: number;
        }[];
        unkArray02?: {
            unk0x00: number;
            unk0x02: number;
            unk0x04: number;
            unk0x06: number;
            unk0x08: number;
            unk0x0A: number;
            unk0x0C: number;
            unk0x0E: number;
            unk0x10: number;
            unk0x12: number;
            unk0x14: number;
            unk0x16: number;
            unk0x18: number;
            unk0x1A: number;
            unk0x1C: number;
            unk0x1E: number;
        }[];
    };
}