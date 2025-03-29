# .RAW Map File

## RAW Commands

RAW Commands are used in the .RAW map files to perform any variety of game logic. Each command can optionally choose to call another command, resulting in a command chain.

Each command has the following format:

| Offset | Size (bytes) | Field | Description |
| ----------- | ----------- | ----------- | ----------- |
| 0x00  | 2 | SIZE | Size in bytes of the command |
| 0x02  | 2 | COMMAND_TYPE | The actual command to run. (e.g., 0x2900 is add item to inventory) |
| 0x04  | 2 | NEXT_COMMAND | Index (1-based) of the next command to run in the chain. 0x00 ends the chain |
| 0x06  | SIZE - 0x06 | ARGS | Array of 2 byte values that represent all required arguments for the given TYPE, e.g., for the 0x29 (add item to inventory) command, the first argument is _UNKNOWN_ and the second argument is the item ID to add to inventory |

There are 5,531 individual commands defined across all 44 map files.

There are 1,937 command chains across all 44 map files.




Here are all of the command types found in files:


