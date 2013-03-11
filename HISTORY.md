# HISTORY

March 5, 2013

- Tiles Class
- HexTiles Class
- Tile Class
- Game Class
- GameEntity Class
- Stat Class
- Stats Class
- Path-finding
- Range-finding
- hex tile mapper

March 8, 2013

- Restructured code to reactional callbacks.
- Game and Client are now separated entities
- Removed `wol` namespace and folder

March 9, 2013

- Struggling with a bug in the path-finding algorithm

March 10, 2013

- Realized the problem of my path-finding algorithm. Seems I was occupying the tile first before performing a path-finding function.
- `walkDuration` condition when moving diagonally is reduced to 75%.


March 12, 2013

- Bind entity events to the unit sprite counterpart.
- create a createTiles method to produce a faster way of generating hexes.
