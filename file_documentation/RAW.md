# .RAW Map File

## Header

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | VERTICES_OFFSET | Offset to vertices section |
| 0x02  | 2 | VERSION | Version |
| 0x04  | 2 | SECTORS_OFFSET | Offset to sectors section |
| 0x06  | 2 | FACES_OFFSET | Offset to faces section |
| 0x08  | 2 | FACE_TEXTURE_MAPS_OFFSET | Offset to the face texture mapping section |
| 0x0A  | 2 | MAP_METADATA_OFFSET | Offset to the map metadata section |
| 0x0C  | 2 | VERTICES_OFFSET_REPEAT | Offset to vertices section (again, not sure why) |
| 0x0E  | 2 | SIGNATURE | Signature is ASCII chars "WR" |
| 0x10  | 2 | MID_PLATFORMS_SECTION | Offset to intermediate platforms (if there are any, otherwise 0x00) |
| 0x12  | 2 | SECTION_7_SIZE | Section 7 size TODO unknown section |
| 0x14  | 2 | VERTICES_SECTION_SIZE | Size of the vertices section |
| 0x16  | 2 | OBJECTS_SECTION_SIZE | Size of the objects section |
| 0x18  | 2 | FOOTER_SIZE | Footer size (I guess. always seems to be 0x08) |
| 0x1A  | 2 | COMMANDS_SECTION_SIZE | Size of the commands section |
| 0x1C  | 2 | SECTOR_COUNT | Number of objects in the sector section |

The file size can be calculated with:  
`FILE_SIZE = VERTICES_OFFSET + VERTICES_SECTION_SIZE + COMMANDS_SECTION_SIZE + SECTION_7_SIZE + OBJECTS_SECTION_SIZE + FOOTER_SIZE`;

**Quick note on textures**

Most of the time, when a texture index is specified, 0xFFXX can also be used to map a single color from the palette, where XX is the index in the palette.

## Sectors Section

**Starts at `HEADER.SECTORS_OFFSET`**

This section contains sector data. A sector is a collection of faces that form a closed 2D shape. A sector contains data such as floor height, ceiling height, texture mapping, and lighting. The very end of the section is a 2 byte value that represents the total number of faces in the file.

The section is laid out like this:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 0x1A * HEADER.SECTOR_COUNT | SECTORS | Array of sector objects |
| 0x1A * HEADER.SECTOR_COUNT  | 2 | FACE_COUNT | Number of faces |

The sector object:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 (signed) | CEIL_HEIGHT | Z-coordinate of the ceiling |
| 0x02  | 2 (signed) | FLOOR_HEIGHT | Z-coordinate of the floor |
| 0x04  | 2 | UNK_0x04 | TODO |
| 0x06  | 2 | CEIL_TEXTURE_INDEX | Index of the *.DAS texture for the ceiling |
| 0x08  | 2 | FLOOR_TEXTURE_INDEX | Index of the *.DAS texture for the ceiling |
| 0x0A  | 1 | TEXTURE_FIT | scaling/fitting texture to area |
| 0x0B  | 1 | LIGHTING | Sets lighting in the sector (from a distance?) |
| 0x0C  | 1 | UNK_0C | TODO (have only seen 0) |
| 0x0D  | 1 | FACES_COUNT | Number of faces that make up this segment |
| 0x0E  | 2 | FIRST_FACE_OFFSET | Offset to the first face of this segment (the engine then uses this + FACES_COUNT to gather all faces) |
| 0x10  | 1 (signed) | CEIL_TEXTURE_SHIFT_X | Shifts the ceiling texture along the x-axis |
| 0x11  | 1 (signed) | CEIL_TEXTURE_SHIFT_Y | Shifts the ceiling texture along the y-axis |
| 0x12  | 1 (signed) | FLOOR_TEXTURE_SHIFT_X | Shifts the floor texture along the x-axis |
| 0x13  | 1 (signed) | FLOOR_TEXTURE_SHIFT_Y | Shifts the floor texture along the y-axis |
| 0x14  | 2 | UNK_0x14 | TODO |
| 0x16  | 2 | UNK_0x16 | TODO (have only seen 0) |
| 0x18  | 2 | INT_FLOOR_OFFSET | Offset to an intermediate platform that should be added to this sector |

## Faces Section

**Starts at `HEADER.FACES_OFFSET`**

This section contains face data. A face is a line between two vertices that can have texture mapping applied to it. A set of faces connect to make a sector. A face can be one-sided or two-sided. A face is considered two-sided if it has an associated "sister face", which is a face that is part of a different sector, but shares the same two vertices, making the two faces essentially overlap.

The section is laid out similar to the sectors section:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 0x0C * FACE_COUNT | FACES | Array of face objects (count taken from end of sectors section) |
| 0x0C * FACE_COUNT  | 2 | TEXTURE_MAPPING_COUNT | Number of texture mappings |

The face object:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | VERTEX_01_OFFSET | First vertex's offset from the start of the vertices section |
| 0x02  | 2 | VERTEX_02_OFFSET | Second vertex's offset from the start of the vertices section |
| 0x04  | 2 | TEXTURE_MAP_OFFSET | Offset to the texture mapping definition (in face texture mapping section) |
| 0x06  | 2 | SECTOR_OFFSET | Offset to the associated sector |
| 0x08  | 2 | SISTER_FACE_OFFSET | Offset to a sister face, making this two-sided. When one-sided, this value is 0xFFFF. |
| 0x0A  | 2 | UNK_0x0A | TODO |

## Face Texture Mapping Section

**Starts at `HEADER.FACE_TEXTURE_MAPS_OFFSET`**

This section contains data for associating textures to faces.

The section is laid out as follows:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | (0x0A \| 0x0E) * TEXTURE_MAPPING_COUNT | TEXTURE_MAPPINGS | Array of texture mapping objects (count taken from end of faces section) |

The texture mapping object has a base size of 0x0A, but may contain two additional bytes of data.
See the object data below:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 1 | UNK_0x00 | TODO |
| 0x01  | 1 | TYPE | When this value is 0x8X, additional scaling/shifting metadata is included. X also specifies how many times to repeat the texture while fitting to face |
| 0x02  | 2 | MID_TEXTURE_INDEX | Primary face texture. The index of the *.DAS texture |
| 0x04  | 2 | UPPER_TEXTURE_INDEX | Texture for the upper portion (ie, when the ceiling on an adjacent sector is lower) |
| 0x06  | 2 | LOWER_TEXTURE_INDEX | Texture for the lower portion (ie, when the floor on an adjacent sector is higher) |
| 0x08  | 2 | UNK_0x08 | TODO: not fully figured out. 0xAE fits to size |
| 0x0A? | 1 \| 0 (signed) | SHIFT_TEXTURE_X | Shifts the texture along the x-axis (optional, see TYPE field) |
| 0x0B? | 1 \| 0 (signed) | SHIFT_TEXTURE_Y | Shifts the texture along the y-axis (optional, see TYPE field) |
| 0x0C? | 2 \| 0 | UNK_0x0C | TODO |

**On texture shifting:** if a texture is shifted even a pixel too far (where empty texture would be rendered), the whole face will have messed up rendering

## Intermediate Platforms Section (WIP)

**Starts at `HEADER.MID_PLATFORMS_SECTION` (or `HEADER.MID_PLATFORMS_SECTION - 0x02` if you include the count. See below for details.)**

This is an optional section and contains data about intermediate (or middle) platforms.

Unlike the DOOM engine, ROTH can create additional platforms within a sector. An intermediate platform contains a ceiling and a floor, where the ceiling is the underside of the platform and the floor is the topside.

If `HEADER.MID_PLATFORMS_SECTION` is 0x00, this section is not present. It's also important to note that, like the other first few sections, the count is contained in the 2 bytes preceding the offset in the header.

The section is laid out as follows:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| -0x02  | 2 | COUNT | Number of intermediate platforms |
| 0x00  | 0x0E * COUNT | MID_PLATFORMS | Array of intermediate platforms |

The intermediate platform object:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | CEIL_TEXTURE_INDEX | Texture index for the ceiling (underside) |
| 0x02  | 2 (signed) | CEIL_HEIGHT | Z-coordinate of the ceiling (underside) |
| 0x04  | 2 | UNK_0x04 | TODO |
| 0x06  | 2 | FLOOR_TEXTURE_INDEX | Texture index for the floor (topside) |
| 0x08  | 2 (signed) | FLOOR_HEIGHT | Z-coordinate of the floor (topside) |
| 0x0A  | 2 | UNK_0x0A | TODO |
| 0x0C  | 2 | UNK_0x0C | TODO |

## Map Metadata Section

**Starts at `HEADER.MAP_METADATA_OFFSET`**

This section contains various metadata about the map and even contains fields that initializes some base game settings when the game starts with this map.

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 (signed) | INIT_X_POS | The starting position's x-coordinate |
| 0x02  | 2 (signed) | INIT_Z_POS | The starting position's z-coordinate or height |
| 0x04  | 2 (signed) | INIT_Y_POS | The starting position's y-coordinate |
| 0x06  | 2 (signed) | INIT_ROTATION | The starting rotation (facing angle) |
| 0x08  | 2 | MOVE_SPEED | The default move speed. Default is 0x05. Values after 0x09 start to mess with collision (while sprinting). This value persists throughout the whole game. |
| 0x0A  | 2 | PLAYER_HEIGHT | The player height. Default is 0x48. This value persists throughout the whole game. |
| 0x0C  | 2 | MAX_CLIMB | The max height that the player can climb before needing to jump. Default is 0x20. This value persists throughout the whole game. |
| 0x0E  | 2 | MIN_FIT | The minimum size that the player can still fit through openings. Default is 0x30. This value persists throughout the whole game. |
| 0x10  | 2 | UNK_0x10 | TODO |
| 0x12  | 2 (signed) | CANDLE_GLOW | Sets how much light that light sources produce. Recommended values 0x00 - 0x20. Can be set to a really large value to overpower the LIGHT_AMBIENCE setting. |
| 0x14  | 2 | LIGHT_AMBIENCE | The general brightness of the map. Only values 0x00 - 0x02. (To make the map brighter, use CANDLE_GLOW) | 
| 0x16  | 2 | UNK_0x16 | TODO. Adds blueish shadows with any non-0 value. Maybe related to gamma fix? |
| 0x18  | 2 | SKY_TEXTURE | Texture index for the skybox |
| 0x1A  | 2 | UNK_0x1A | TODO |

## Vertices Section

**Starts at `HEADER.VERTICES_OFFSET` or `HEADER.VERTICES_OFFSET_REPEAT`**

This section contains all of the vertices used in the map. A vertex is a single 2-dimensional point.

The section has a small header containing a few metadata fields and then the array of vertices:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SECTION_SIZE | Total size (in bytes) of the section (including metadata fields) |
| 0x02  | 2 | SECTION_HEADER_SIZE | ? always seems to be 0x08, which is the size of this sections header |
| 0x04  | 2 | BLANK | TODO. determine if always blank or could represent something else |
| 0x06  | 2 | VERTICES_COUNT | Total number of vertices in the section |
| 0x08  | 0x0C * VERTICES_COUNT | VERTICES | Array of vertex objects |

The vertex object:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | UNK_0x00 | Seems to always be zero |
| 0x02  | 2 | UNK_0x02 | Seems to always be zero |
| 0x04  | 2 | UNK_0x04 | Seems to always be zero |
| 0x06  | 2 | UNK_0x06 | Seems to always be zero |
| 0x08  | 2 (signed) | POS_X | X-coordinate of the vertex |
| 0x0A  | 2 (signed) | POS_Y | Y-coordinate of the vertex |

## Commands Section (WIP)

**Starts at `HEADER.VERTICES_OFFSET + HEADER.VERTICES_SECTION_SIZE`**

This section contains all of the commands that are defined for this map. 

ROTH utilizes two different scripting engines. One is defined in the DBASE100.DAT file and the other is defined within each map file. The map-based commands can perform any variety of actions on the map, such as placing/removing items, spawning enemies, switching to a different map, calling DBASE100 commands, and more.

Each command can optionally choose to call another command, resulting in a command chain. WIP: It seems the only way to run a command chain from the game is through an array of entry points, which objects in the map have access to. If the command (and therefore its resulting command chain) is not listed in the entry points array, an object cannot run it.

Here is the breakdown of the commands section:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SIGNATURE | Always seems to be ASCII "3u". Could represent version of scripting engine? |
| 0x02  | 2 | UNK_0x02 | TODO |
| 0x04  | 2 | COMMANDS_OFFSET | Offset from section start to the commands array |
| 0x06  | 2 | COMMAND_COUNT | Total number of defined commands |
| 0x08  | 60 (0x3C) | COUNTS_SECTION | Seems to be a fixed size representing a breakdown of the counts of commands. Seems to relate to how a command can be called. (i.e., if a command is triggered by walking over a sector floor or a click interaction) |
| 0x44  | 2 * COMMAND_COUNT | COMMAND_ENTRY_POINTS | An array of 2 byte values, that are offsets (from section start) to a command, indicating the start of a command chain. The elements here are commands that can be called by objects placed in the map. The array is the size of the total number of commands (in the case that all commands should be accessible and callable by an object), otherwise the remaining elements are just 0x0000. |
| COMMANDS_OFFSET  | ~~ | COMMANDS | An array of command objects |

The command object is as follows:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SIZE | Size in bytes of the command |
| 0x02  | 1 | TYPE_B | Additional command identifier information. Most of the time 0x00 |
| 0x03  | 1 | TYPE_A | The actual command to run. (e.g., 0x29 is add item to inventory) |
| 0x04  | 2 | NEXT_COMMAND | Index (1-based) of the next command to run in the chain. 0x00 ends the chain |
| 0x06  | SIZE - 0x06 | ARGS | Array of 2 byte values that represent all required arguments for the given TYPE, e.g., for the 0x29 (add item to inventory) command, the first argument is _UNKNOWN_ and the second argument is the item ID to add to inventory |

## Section 7 (WIP)

**Starts at `HEADER.VERTICES_OFFSET + HEADER.VERTICES_SECTION_SIZE + HEADER.COMMANDS_SECTION_SIZE`**

Little is known about this section, but it tends to be pretty small. In my testing, modifying this resulted in no apparent changes. Will need to do more testing.

There could be an additional optional section that contains 0x20-sized elements. The size of this sub-section is NOT included in the size of the overall section's header. It IS, however, included in the section size of the file's header.

The section is as follows:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SIZE_A | Size in bytes of the section's first sub-section |
| 0x02  | 2 | COUNT | Count of elements in section's array |
| 0x04  | 0x12 * COUNT | UNKNOWN_ARRAY_01 | Array of section elements TODO |
| SIZE_A | HEADER.SECTION_7_SIZE - SIZE_A | UNKNOWN_ARRAY_02 | Optionally, there may be an additional ending sub-section of 0x20-sized elements |

The element object for UNKNOWN_ARRAY_01:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00 | 2 (signed) | UNK_0x00 | TODO |
| 0x02 | 2 (signed) | UNK_0x02 | TODO |
| 0x04 | 2 | UNK_0x04 | TODO |
| 0x06 | 2 | UNK_0x06 | TODO |
| 0x08 | 2 | UNK_0x08 | TODO |
| 0x0A | 2 | UNK_0x0A | TODO |
| 0x0C | 2 | UNK_0x0C | TODO |
| 0x0E | 2 | UNK_0x0E | TODO |
| 0x10 | 2 | UNK_0x10 | TODO |

The element object for UNKNOWN_ARRAY_02:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00 | 32 (0x20) | UNK_0x00 | TODO |

## Objects Section

**Starts at `HEADER.VERTICES_OFFSET + HEADER.VERTICES_SECTION_SIZE + HEADER.COMMANDS_SECTION_SIZE +` TODO**

This section contains data related to in-game objects. An object, similar to a **thing** in DOOM, can represent an item, projectile, enemy, interactable object, floor trigger, etc.

The first main part of the section is an array that maps objects to sectors. Every sector can have objects mapped to it or not. Since a sector can only point to one reference, a container structure is used to allow it to be associated with multiple objects.

Here is the breakdown of the section:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00 | 2 | SIZE | Size in bytes of the whole section |
| 0x02 | 0x02 * HEADER.SECTOR_COUNT | SECTOR_OBJECT_MAPPING | This is an array of 2 byte values whose size is the same as the number of sectors. This maps objects to a given sector. The element value is an offset from section start to the object container. If the sector contains no objects, the value is simply 0x00. Objects themselves are placed at absolute x and y values, but this section is likely necessary for proper rendering order. |
| 0x02 + HEADER.SECTOR_COUNT * 0x02 | SIZE - (0x02 + HEADER.SECTOR_COUNT * 0x02) | OBJECT_CONTAINERS | An array of object container objects. An object container contains at least one object object. |

Here is the object container:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00 | 1 | COUNT | Number of objects in the object container |
| 0x01 | 1 | COUNT_REPEAT | Seems to just be a repeat of the first byte |
| 0x02 | 0x10 * COUNT | OBJECTS | Array of objects |

And here is the object itself:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00 | 2 (signed) | POS_X | X-coordinate of the object's position |
| 0x02 | 2 (signed) | POS_Y | Y-coordinate of the object's position |
| 0x04 | 1 | TEXTURE_INDEX | Index of the object texture to use |
| 0x05 | 1 | TEXTURE_SOURCE | Value used to indicate where to look for the texture. 0x00 is the associated .DAS file for the map. 0x02 is ADEMO.DAS **TODO likely more** |
| 0x06 | 1 | ROTATION | The facing angle of the object |
| 0x07 | 1 | UNK_0x07 | TODO Seems to be related to flags |
| 0x08 | 1 | LIGHTING | Applies ambient lighting/shading to object. Default is 0x00 or 0x80. Lower is darker. |
| 0x09 | 1 | RENDER_TYPE | Determines whether to apply billboarding to the texture, i.e., whether the sprite is always facing the player or not. 0x00 applies billboarding. 0x80 makes it static. TODO see what other values do |
| 0x0A | 2 | POS_Z | Z-coordinate of the object's position (height) |
| 0x0C | 2 | UNK_0x0C | TODO |
| 0x0E | 2 | UNK_0x0E | Determines interactability and ultimately what command is run when interacted with. Influences both right and left click options. TODO it somehow runs a command from the command entry point array in the commands section, but this value is not the index in or offset to the command entry point array. |

## Footer

Seems to pretty consistently be the following value:

`08 00 08 00 00 00 00 00`
