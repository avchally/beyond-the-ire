## DBASE100 Commands

| Code | Total Count | Description                       | Value |
|------|-------------|-----------------------------------|-------|
| 1    | 360         | If value is set then continue     | Flag
| 2    | 16          | If has item then continue         | Item index
| 4    | 239         | Set value                         | Flag 
| 5    | 1088        | Play Audio Dialog                 | DBASE400 offset
| 7    | 183         | Play Video                        | Cutscene index from DBASE100
| 8    | 102         | Choice String                     | DBASE400 offset
| 9    | 102         | Start Choice                      | Always 16777215 (0xFFFFFF)
| 10   | 102         | End Choice                        | Always 16777215 (0xFFFFFF)
| 11   | 31          | Start Random                      | Always 16777215 (0xFFFFFF)
| 12   | 31          | End Random                        | Always 16777215 (0xFFFFFF) 
| 13   | 147         | If value is set then next command | Flag
| 14   | 1           | Displays Texture                  | DBase300 Offset / 8
| 17   | 52          | Give item                         | Item index
| 25   | 7           | Play SFX                          | Index from FXSCRIPT.SFX
| 26   | 23          | ?                                 | ?Looks like an offset
| 28   | 2           | ?                                 | Always 16777215 (0xFFFFFF)
| 29   | 127         | Jump to different command         | DBASE100 command index
| 35   | 5           | Map Command Index Callback        | Map Command Index
| 38   | 10          | Heal                              | Amount
| 45   | 55          | ?                                 | Only 1,4, or 7
| 54   | 39          | Map Command ID Callback           | Map Command ID
| 129  | 82          | If not value then continue        | Flag
| 130  | 20          | If not item then continue         | Item index
| 132  | 50          | Unset value                       | Flag
| 141  | 175         | If not value then next command    | Flag
| 145  | 19          | Remove item                       | Item index
| 156  | 2           | ?                                 | Always 16777215 (0xFFFFFF)
