import { RawrJson } from "../MapParser";

// definitely not done yet
export function mirrorMapY(rawr: RawrJson) {
    const scale = -1;
    // rawr.mapMetadataSection.initPosX *= scale;
    rawr.mapMetadataSection.initPosY *= scale;
    // rawr.mapMetadataSection.initPosZ *= scale
    rawr.mapMetadataSection.rotation = (128 - rawr.mapMetadataSection.rotation + 256) % 256

    for (const vertex of rawr.verticesSection.vertices) {
        // vertex.x *= scale;
        vertex.y *= scale;
    }

    rawr.facesSection.faces.reverse();

    for (const sector of rawr.sectorsSection.sectors) {
        // sector.floorHeight *= scale;
        // sector.ceilingHeight *= scale;
        if (sector.objectInformation) {
            for (const obj of sector.objectInformation) {
                // obj.posX *= scale;
                obj.posY *= scale;
                // obj.posZ *= scale;

                obj.rotation = (128 - obj.rotation + 256) % 256;
            }
        }

        // sector.floorTextureShiftX = (sector.floorTextureShiftX * scale) << 24 >> 24;
        sector.floorTextureShiftY = (sector.floorTextureShiftY * scale) << 24 >> 24;
        sector.ceilingTextureShiftY = (sector.ceilingTextureShiftY * scale) << 24 >> 24;


        sector.firstFaceIndex = rawr.facesSection.faces.length - sector.firstFaceIndex - sector.facesCount;
    }

    // rawr.verticesSection.vertices.reverse();

    for (const face of rawr.facesSection.faces) {
        // const temp1 = face.vertexIndex01;
        // face.vertexIndex01 = face.vertexIndex02;
        // face.vertexIndex02 = temp1;

        // face.vertexIndex01 = rawr.verticesSection.vertices.length - face.vertexIndex01;
        // face.vertexIndex02 = rawr.verticesSection.vertices.length - face.vertexIndex02;

        if (face.sisterFaceIndex !== undefined) {
            face.sisterFaceIndex = rawr.facesSection.faces.length - face.sisterFaceIndex - 1;
        }

        [face.vertexIndex01, face.vertexIndex02] = [face.vertexIndex02, face.vertexIndex01];
    }

    for (const textureMapping of rawr.faceTextureMappingSection.mappings) {
        if (textureMapping.additionalMetadata && Object.keys(textureMapping.additionalMetadata).length > 0) {
            textureMapping.additionalMetadata.shiftTextureX = (textureMapping.additionalMetadata.shiftTextureX * scale) << 24 >> 24;
            // textureMapping.additionalMetadata.shiftTextureY *= scale;
            // if (textureMapping.additionalMetadata.shiftTextureY === 128) {
            //     textureMapping.additionalMetadata.shiftTextureY -= 1;
            // }
        }
    }
}

// export function scaleMap(rawr: RawrJson) {

// }

export function setMapMetadata(rawr: RawrJson) {
    rawr.mapMetadataSection.candleGlow = 1800;
    rawr.mapMetadataSection.moveSpeed = 7;
    // rawr.mapMetadataSection.unk0x10 *= 1.5;
}

export function stripUnkFields(rawr: RawrJson) {
    console.log(`Setting unknown fields to 0 for ${rawr.rawrMetadata.mapName}`);
    
    for (const sector of rawr.sectorsSection.sectors) {
        // sector.unk0x04 = 0;
        // sector.textureMapOverride = 0; // no longer unknowwn
        // sector.unk0x16 = 0;

        if (!sector.objectInformation) {
            continue;
        }
        for (const obj of sector.objectInformation) {
            // obj.unk0x07 = 0;
            // obj.unk0x0C = 0;
            // obj.unk0x0E = 0;
        }
    }

    // for (const face of rawr.facesSection.faces) {
    //     face.unk0x0A = 0;
    // }

    for (const faceTextureMapping of rawr.faceTextureMappingSection.mappings) {
        // faceTextureMapping.unk0x00 = 0;
        // faceTextureMapping.unk0x08 = 0;
        // if (faceTextureMapping.additionalMetadata && Object.keys(faceTextureMapping.additionalMetadata).length > 0) {
        //     faceTextureMapping.additionalMetadata.unk0x0C = 0;
        // }
    }


    if (rawr.midPlatformsSection) {
        for (const midPlatform of rawr.midPlatformsSection.platforms) {
            midPlatform.unk0x04 = 0;
            midPlatform.unk0x0A = 0;
            midPlatform.unk0x0C = 0;
        }
    }

    // skipping map metadata (not relevant) and vertices (all unk are already 0)
    
    if (rawr.section7) {
        for (const unk1 of rawr.section7.unkArray01) {
            unk1.unk0x00 = 0;
            unk1.unk0x02 = 0;
            unk1.unk0x04 = 0;
            unk1.unk0x06 = 0;
            unk1.unk0x08 = 0;
            unk1.unk0x0A = 0;
            unk1.unk0x0C = 0;
            unk1.unk0x0E = 0;
            unk1.unk0x10 = 0;
        }

        if (rawr.section7.unkArray02) {
            for (const unk2 of rawr.section7.unkArray02) {
                unk2.unk0x00 = 0;
                unk2.unk0x02 = 0;
                unk2.unk0x04 = 0;
                unk2.unk0x06 = 0;
                unk2.unk0x08 = 0;
                unk2.unk0x0A = 0;
                unk2.unk0x0C = 0;
                unk2.unk0x0E = 0;
                unk2.unk0x10 = 0;
                unk2.unk0x12 = 0;
                unk2.unk0x14 = 0;
                unk2.unk0x16 = 0;
                unk2.unk0x18 = 0;
                unk2.unk0x1A = 0;
                unk2.unk0x1C = 0;
                unk2.unk0x1E = 0;
            }
        }


    }

}