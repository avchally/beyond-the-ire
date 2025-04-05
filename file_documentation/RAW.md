# .RAW Map File

The .RAW file format is used to store map data in Realms of the Haunting. The file is made up of geometry data (vertices, faces, sectors), map and game settings, object/entity placement, and commands (scripting game logic).

For the first few sections in the file the count of elements in that section is found in the last 2-byte value of the previous section.

Most of the time, when a texture index is specified, 0xFFXX can also be used to map a single color from the palette, where XX is the index in the palette.

## Header

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | VERTICES_OFFSET | Offset to [vertices section](#vertices-section) |
| 0x02  | 2 | VERSION | Version probably? |
| 0x04  | 2 | SECTORS_OFFSET | Offset to [sectors section](#sectors-section) |
| 0x06  | 2 | FACES_OFFSET | Offset to [faces section](#faces-section) |
| 0x08  | 2 | FACE_TEXTURE_MAPS_OFFSET | Offset to the [face texture mapping section](#face-texture-mapping-section) |
| 0x0A  | 2 | MAP_METADATA_OFFSET | Offset to the [map metadata section](#map-metadata-section) |
| 0x0C  | 2 | VERTICES_OFFSET_REPEAT | Offset to [vertices section](#vertices-section) (again, not sure why) |
| 0x0E  | 2 | SIGNATURE | Signature is ASCII chars "WR" |
| 0x10  | 2 | MID_PLATFORMS_SECTION | Offset to [intermediate platforms](#intermediate-platforms-section-wip) (if there are any, otherwise 0x00) |
| 0x12  | 2 | SECTION_7_SIZE | Section 7 size TODO unknown section |
| 0x14  | 2 | VERTICES_SECTION_SIZE | Size of the [vertices section](#vertices-section) |
| 0x16  | 2 | OBJECTS_SECTION_SIZE | Size of the [objects section](#objects-section) |
| 0x18  | 2 | FOOTER_SIZE | [Footer](#footer) size |
| 0x1A  | 2 | COMMANDS_SECTION_SIZE | Size of the [commands section](#commands-section-wip) |
| 0x1C  | 2 | SECTOR_COUNT | Number of objects in the [sectors section](#sectors-section) |

The file size can be calculated with:  
`FILE_SIZE = VERTICES_OFFSET + VERTICES_SECTION_SIZE + COMMANDS_SECTION_SIZE + SECTION_7_SIZE + OBJECTS_SECTION_SIZE + FOOTER_SIZE`;

## Sectors Section

**Starts at `HEADER.SECTORS_OFFSET`**

This section contains sector data. A sector is a collection of faces that form a closed 2D shape. A sector contains data such as floor height, ceiling height, texture mapping, and lighting. The very end of the section is a 2 byte value that represents the total number of faces in the file.

Since ROTH uses binary space partitioning (like DOOM), sectors must be convex, otherwise they will not render properly.

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
| 0x0C  | 1 (signed) | TEXTURE_MAP_OVERRIDE | Overrides the default position and size of the MID_TEXTURE in the [face texture mapping](#face-texture-mapping-section) for each face in the sector. The value is the size. Zero is default (fit to size). Negative values anchor the texture to the floor, positive values anchor the texture to the ceiling. |
| 0x0D  | 1 | FACES_COUNT | Number of faces that make up this segment |
| 0x0E  | 2 | FIRST_FACE_OFFSET | Offset to the first [face](#faces-section) of this segment (the engine then uses this + FACES_COUNT to gather all faces) |
| 0x10  | 1 (signed) | CEIL_TEXTURE_SHIFT_X | Shifts the ceiling texture along the x-axis |
| 0x11  | 1 (signed) | CEIL_TEXTURE_SHIFT_Y | Shifts the ceiling texture along the y-axis |
| 0x12  | 1 (signed) | FLOOR_TEXTURE_SHIFT_X | Shifts the floor texture along the x-axis |
| 0x13  | 1 (signed) | FLOOR_TEXTURE_SHIFT_Y | Shifts the floor texture along the y-axis |
| 0x14  | 2 | FLOOR_TRIGGER_ID | The ID of an established floor trigger command. When the player walks over the sector, this floor trigger command is executed. |
| 0x16  | 2 | UNK_0x16 | TODO (have only seen 0) |
| 0x18  | 2 | INT_FLOOR_OFFSET | Offset to an [intermediate platform](#intermediate-platforms-section-wip) that should be added to this sector |

## Faces Section

**Starts at `HEADER.FACES_OFFSET`**

This section contains face data. A face is a line between two vertices that can have texture mapping applied to it. A set of faces connect to make a sector. A face can be one-sided or two-sided. A face is considered two-sided if it has an associated "sister face", which is a face that is part of a different sector, but shares the same two vertices, making the two faces essentially overlap.

When a face is one-sided, it will automatically have collision applied to it.

The section is laid out similar to the sectors section:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 0x0C * FACE_COUNT | FACES | Array of face objects (count taken from end of sectors section) |
| 0x0C * FACE_COUNT  | 2 | TEXTURE_MAPPING_COUNT | Number of texture mappings |

The face object:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | VERTEX_01_OFFSET | First [vertex](#vertices-section)'s offset from the start of the vertices section |
| 0x02  | 2 | VERTEX_02_OFFSET | Second [vertex](#vertices-section)'s offset from the start of the vertices section |
| 0x04  | 2 | TEXTURE_MAP_OFFSET | Offset to the [texture mapping definition](#face-texture-mapping-section) |
| 0x06  | 2 | SECTOR_OFFSET | Offset to the associated [sector](#sectors-section) |
| 0x08  | 2 | SISTER_FACE_OFFSET | Offset to a sister face, making this two-sided. When one-sided, this value is 0xFFFF. |
| 0x0A  | 2 | ADD_COLLISION | This field adds collision to two-sided faces (and probably more). |

#### ADD_COLLISION

The ADD_COLLISION field applies (additional?) collision information to the face. Since two-sided faces are inherently collision-free, this field can add collision to it. If two-way collision is desired, it must be applied on both side faces.

The most common values for ADD_COLLISION are below:

| Value | Description |
| ----------- | ----------- |
| 0x00  | No collision at all |
| 0x01  | Has collision for player, enemies, and projectiles |
| 0x02  | Has collision for enemies, but not for player and projectiles |
| 0x03  | Has collision for player and enemies, but not for projectiles |

Some less common values include: `0x80, 0x81, 0x83, 0x89, 0x08, 0x09, 0x0A, 0x0B`.  
These values may provide additional characteristics that are not yet clear.

There are many one-sided faces that use this field, but it's currently not clear what purpose that serves.

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
| 0x01  | 1 | TYPE | When this value >= 0x80, additional scaling/shifting metadata is included. With 0x8X, X also specifies how many times to repeat the texture while fitting to face |
| 0x02  | 2 | MID_TEXTURE_INDEX | Primary face texture. The index of the *.DAS texture |
| 0x04  | 2 | UPPER_TEXTURE_INDEX | Texture for the upper portion (ie, when the ceiling on an adjacent sector is lower) |
| 0x06  | 2 | LOWER_TEXTURE_INDEX | Texture for the lower portion (ie, when the floor on an adjacent sector is higher) |
| 0x08  | 2 | UNK_0x08 | TODO: not fully figured out. 0xAE fits to size |
| 0x0A? | 1 \| 0 (signed) | SHIFT_TEXTURE_X | Shifts the texture along the x-axis (optional, see TYPE field) |
| 0x0B? | 1 \| 0 (signed) | SHIFT_TEXTURE_Y | Shifts the texture along the y-axis (optional, see TYPE field) |
| 0x0C? | 2 \| 0 | UNK_0x0C | WIP Notes: affects interactions with doors and other types of faces. Since one face texture mapping can be applied to any number of faces, maybe this allows assigning some generic command chain. |

**On texture shifting:** if a texture is shifted even a pixel too far (where empty texture would be rendered), the whole face will have messed up rendering

## Intermediate Platforms Section (WIP)

**Starts at `HEADER.MID_PLATFORMS_SECTION` (or `HEADER.MID_PLATFORMS_SECTION - 0x02` if you include the count. See below for details.)**

This is an optional section and contains data about intermediate (or middle) platforms.

Unlike the DOOM engine, ROTH can create additional platforms within a sector. An intermediate platform contains a ceiling and a floor, where the ceiling is the underside of the platform and the floor is the topside.

If `HEADER.MID_PLATFORMS_SECTION` is 0x00, this section is not present. It's also important to note that, like the other first few sections, the count is contained in the 2 bytes preceding the offset in the header. When this section is not present, the count (at -0x02) is also not present, which is why I  included it in this section and not at the end of the previous section.

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

### Overview
This section contains all of the commands that are defined for this map.

ROTH utilizes two different scripting engines: one is defined in the DBASE100.DAT file and the other is defined within each map file. The map-based commands can perform any variety of actions on the map, such as placing/removing items, spawning enemies, switching to a different map, calling DBASE100 commands, and more.

Each command can optionally choose to call another command, resulting in a command chain. Additionally, a command chain always (seemingly) starts with an "entry command". Entry commands are special commands that assist in initializing the command chain and ultimately determines how the command chain is executed in the map. For example, an entry command where `COMMAND_BASE == 0x13` sets up the command chain to execute when walking over a sector.

The commands section contains a simple header, a table of entry command counts, an array of entry command references, and an array of all commands. See the breakdown of the commands section below.

The table of entry command counts declares how many entry commands of each category there are in the map. The section always contains 15 4 byte entries. Each entry corresponds to a given type of entry command. For example, the first entry will ALWAYS correspond to entry commands where `COMMAND_BASE == 0x08 or 0x02`. The first two bytes of the entry is a relative offset from section start to the first command in the array of entry command references. The last two bytes of the entry is a count of how many commands of that type there are. See the [Entry Command Counts](#entry-command-counts-categories) section below for more information.

The array of entry command references is an array of 2 byte elements. Each element is a relative offset from section start to the associated command in the array of all commands. 

The array of all commands defines every command in the map. See the command object below for the full breakdown.

Here is the breakdown of the commands section:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SIGNATURE | Always seems to be ASCII "3u". Could represent version of scripting engine? |
| 0x02  | 2 | UNK_0x02 | TODO |
| 0x04  | 2 | COMMANDS_OFFSET | Offset from section start to the all commands array |
| 0x06  | 2 | COMMAND_COUNT | Total number of defined commands |
| 0x08  | 60 (0x3C) | ENTRY_COMMAND_COUNTS | Fixed size representing a breakdown of the counts of commands based on type/category. The category relates to how a command chain is initialized and eventually executed. (i.e., if a command is triggered by walking over a sector floor or a click interaction) |
| 0x44  | 2 * COMMAND_COUNT | ENTRY_COMMAND_REFERENCES | An array of 2 byte values, that are relative offsets from section start to a command in the all commands array, indicating the start of a command chain. The number of elements in the array is COMMAND_COUNT, but since this array only contains entry commands, most elements will be 0x0000. |
| COMMANDS_OFFSET  | HEADER.COMMANDS_SECTION_SIZE - COMMANDS_OFFSET | ALL_COMMANDS | An array of the actual command objects |

The command object is as follows:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SIZE | Size in bytes of the command |
| 0x02  | 1 | COMMAND_MODIFIER | Additional command identifier information. Most of the time 0x00, but other values include 0x08, 0x80, 0x88 |
| 0x03  | 1 | COMMAND_BASE | Also referred to as "command type". The actual command to run. (e.g., 0x29 is add item to inventory, 0x13 is the entry command type for setting up a floor trigger) |
| 0x04  | 2 | NEXT_COMMAND | Index (1-based) within the ALL_COMMANDS array of the next command to run in the chain. 0x00 ends the chain |
| 0x06  | SIZE - 0x06 | ARGS | Array of 2 byte values that represent all required arguments for the given TYPE, e.g., for the 0x29 (add item to inventory) command, the first argument is _UNKNOWN_ and the second argument is the item ID to add to inventory |

### Entry Command Counts (Categories)

The table of entry command counts is a breakdown of the counts of entry commands used on the map. This helps the map to determine how each command chain should be executed (via floor/sector trigger, right clicking an object, left clicking an object, etc.).

The section is a fixed 0x3C length of 15 4 byte entries. Each entry corresponds to a single entry command type/category (except for the first, which corresponds to two). Each entry will always correspond to the same category. For example, the first entry in the section will always correspond to the first category, the second to the second, and so on. The actual breakdown of the categories is found further below.

Here is the category entry:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | OFFSET_TO_FIRST_COMMAND_REFERENCE | Relative offset from the start of the commands section to the first command reference in the entry command references array. If there are no entry commands of this type, this will just be 0x0000 |
| 0x02  | 2 | COUNT | The number of commands of this type |

The game would go through each category entry and find the OFFSET_TO_FIRST_COMMAND_REFERENCE and then increment through the entry command references array until it has found the number of commands equal to COUNT. It would then go to the next category entry and repeat.

Here is the breakdown of which category corresponds to which command type (COMMAND_BASE):

| Offset within ENTRY_COMMAND_COUNTS | Category Number | Associated command type (COMMAND_BASE) | Additional Notes |
| ----------- | ----------- | ----------- | ----------- |
| 0x00 | 01 | 0x08 & 0x02 | The only category where two COMMAND_BASE's are associated with it |
| 0x04 | 02 | UNUSED | Across all 44 map files, there are no command types that are associated with this category |
| 0x08 | 03 | 0x03 | |
| 0x0C | 04 | 0x13 | 0x13 is the command type to set up a floor trigger |
| 0x10 | 05 | 0x18 | |
| 0x14 | 06 | 0x19 | |
| 0x18 | 07 | 0x1A | |
| 0x1C | 08 | 0x1B | |
| 0x20 | 09 | 0x25 | |
| 0x24 | 10 | UNUSED | Across all 44 map files, there are no command types that are associated with this category |
| 0x28 | 11 | 0x32 | |
| 0x2C | 12 | 0x31 | |
| 0x30 | 13 | 0x30 | |
| 0x34 | 14 | 0x37 | |
| 0x38 | 15 | 0x39 | |

### All Command Types

This section will be in an ongoing WIP state, but it will serve to define and document all possible commands.

The COMMAND_BASE is the actual command type and determines what the command does.  
Each command has anywhere from 0 to 8 arguments that it is called/executed with.  
Each command can also have a COMMAND_MODIFIER. Most of the time this is 0x00, but it could also be 0x08, 0x80, 0x88, or more depending on the command. What these modifiers do is still undetermined.

| COMMAND_BASE | Possible COMMAND_MODIFIER's | Size | Used as Entry Command? | Description | Arg 1 | Arg 2 | Arg 3 | Arg 4 | Arg 5 | Arg 6 | Arg 7 | Arg 8 |
| ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| 0x01 | 00 | 0x06 |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x02 | 00 | 0x10 | TRUE |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x03 | 00 | 0x16 | TRUE | Used more often not as entry point |  |  |  |  |  |  |  |  |
| 0x07 | 00 | 0x14 |  |  |  |  |  |  |  |  |  | XXXXXXXXXXX |
| 0x08 | 00 | 0x0C | TRUE |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x09 | 00 | 0x12 |  |  |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x0A | 00 | 0x10 |  |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x0C | 00 | 0x16 |  |  |  |  |  |  |  |  |  |  |
| 0x0D | 00 | 0x0E |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x0E | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x0F | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x10 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x11 | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x12 | 00 | 0x08 |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x13 | 00 | 0x0C | TRUE | Establishes a floor trigger. A sector specifies if it's associated with a floor trigger via the "self-assigned" ID (argument 2). Starts many CC's. Precedes a change map command (0x3B00). Is used in GRAVE as NON-ENTRY point |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x15 | 00 | 0x0E |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x16 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x17 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x18 | 00 | 0x14 | TRUE |  |  |  |  |  |  |  |  | XXXXXXXXXXX |
| 0x19 | 00 | 0x14 | TRUE |  |  |  |  |  |  |  |  | XXXXXXXXXXX |
| 0x1A | 00 | 0x0C | TRUE |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x1B | 00 | 0x0C | TRUE |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x1C | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x1D | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x1E | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x1F | 00 | 0x12 |  |  |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x20 | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x22 | 00 | 0x12 |  |  |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x23 | 00 | 0x10 or 0x14 |  |  |  |  |  |  |  |  |  | XXXXXXXXXXX |
| 0x24 | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x25 | 00 | 0x0E | TRUE |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x26 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x27 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x28 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x29 | 00 | 0x0A |  | Add item to inventory |  | Item ID to add | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x2A | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x2B | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x2D | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x2E | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x2F | 00 | 0x12 |  |  |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x30 | 00 | 0x0C | TRUE |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x31 | 00 | 0x14 | TRUE |  |  |  |  |  |  |  |  | XXXXXXXXXXX |
| 0x32 | 00 | 0x14 | TRUE |  |  |  |  |  |  |  |  | XXXXXXXXXXX |
| 0x33 | 00 | 0x0C |  | Applies damage. | Damage amount (00=dead) | Always 0 |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x34 | 00 | 0x0C |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x35 | 00 | 0x0E |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x36 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x37 | 00 | 0x0C | TRUE |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x38 | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x39 | 00 | 0x0C | TRUE |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x3A | 00 | 0x08 |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x3B | 00 | 0x12 |  | Change map (requires preceding 0x1300 command) |  |  |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x3C | 00 | 0x10 |  | Spawn entities using index id from DBASE100 (not texture relation index in ADEMO). |  |  | Entity ID |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x3D | 00 | 0x0A |  |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x3E | 00 | 0x06 |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x3F | 00 | 0x08 |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x40 | 00 | 0x08 |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x41 | 00 | 0x08 |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |
| 0x42 | 00 | 0x08 |  |  |  | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX | XXXXXXXXXXX |




## Section 7 (WIP)

**Starts at `HEADER.VERTICES_OFFSET + HEADER.VERTICES_SECTION_SIZE + HEADER.COMMANDS_SECTION_SIZE`**

Little is known about this section, but it tends to be pretty small. In my testing, modifying this resulted in no apparent changes. Even completely zeroing out the section showed no signs of altered gameplay. Will need to do more testing.

There could be an additional optional section that contains 0x20-sized elements. The size of this sub-section is NOT included in the size of the overall section's header. It IS, however, included in the section size of the file's header.

The section is as follows:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SIZE_A | Size in bytes of the section's first sub-section |
| 0x02  | 2 | COUNT | Count of elements in section's first array |
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
| 0x0A | 2 (signed) | POS_Z | Z-coordinate of the object's position (height) |
| 0x0C | 2 | UNK_0x0C | TODO |
| 0x0E | 2 | UNK_0x0E | An ID that connects to commands. A basic interact command could have an index and it should match this. A spawn entity command could use this ID to spawn the entity at this object's location. |

## Footer

Unsure of the purpose it serves.

Seems to pretty consistently be the following value:

`08 00 08 00 00 00 00 00`

**Note:**
The map `MAUSO1EA` is the only map with a different footer. Its value is below:

```
Address   00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
        -------------------------------------------------
+0x00   | 30 00 08 00 03 00 08 00 38 01 08 22 01 00 01 00
+0x10   | 14 00 4D FE 60 FF 5C 23 00 00 02 00 08 00 4D FF
+0x20   | 24 00 3F FE 48 FE 78 24 00 00 01 00 14 00 3F FF
```
