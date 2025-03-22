# .RAW Map File

## Header:

| Offset | Size (bytes) | Description |
| ----------- | ----------- | ----------- |
| 0x00  | 2 | Section 5 offset |
| 0x02  | 2 | Version |
| 0x04  | 2 | Offset to sectors section |
| 0x06  | 2 | Section 2 offset |
| 0x08  | 2 | Section 3 offset |
| 0x0A  | 2 | Section 4 offset |
| 0x0C  | 2 | Section 5 offset (again) |
| 0x0E  | 2 | Signature "WR" |
| 0x10  | 2 | Offset to intermediate platforms (if there are any, otherwise 0x00) |
| 0x12  | 2 | Section 7 size |
| 0x14  | 2 | Section 5 size |
| 0x16  | 2 | Section 8 size |
| 0x18  | 2 | Footer size (I guess. always seems to be 0x08)
| 0x1A  | 2 | Section 6 size |
| 0x1C  | 2 | Section 1 element count |


## Sectors Section
This section contains sector data. A sector is a collection of faces that form a closed 2D shape. A sector contains data such as floor height, ceiling height, texture mapping, and lighting.

The section is laid out like this:
| Offset | Size (bytes) | Description |
| ----------- | ----------- | ----------- |
| 0x00  | variable | Sector array |
| variable  | 2 | Next section element count |



| Offset | Size (bytes) | Description |
| ----------- | ----------- | ----------- |
| 0x00  | 2 | |
| 0x02  | 2 | |
| 0x04  | 2 | |
| 0x06  | 2 | |
| 0x08  | 2 | |
| 0x0A  | 2 | |
| 0x0C  | 2 | |
| 0x0E  | 2 | |
| 0x10  | 2 | |
| 0x12  | 2 | |
| 0x14  | 2 | |
| 0x16  | 2 | |
| 0x18  | 2 | |