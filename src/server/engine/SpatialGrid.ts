export interface GridEntity {
  id: number | string;
  x: number;
  y: number;
  radius: number;
}

export class SpatialGrid<T extends GridEntity> {
  private cellSize: number;
  private cells: Map<string, T[]> = new Map();

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }

  private getKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  public clear(): void {
    this.cells.clear();
  }

  public insert(entity: T): void {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const key = this.getKey(cx, cy);

    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
  }

  /**
   * Fast query for all entities within radius of (x, y)
   */
  public queryRadius(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const searchDist = radius + 32; // Include entity radii to ensure boundary entities are checked
    const minCx = Math.floor((x - searchDist) / this.cellSize);
    const maxCx = Math.floor((x + searchDist) / this.cellSize);
    const minCy = Math.floor((y - searchDist) / this.cellSize);
    const maxCy = Math.floor((y + searchDist) / this.cellSize);
    const rSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(this.getKey(cx, cy));
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const ent = cell[i];
            const dx = ent.x - x;
            const dy = ent.y - y;
            const combinedRadius = radius + ent.radius;
            if (dx * dx + dy * dy <= combinedRadius * combinedRadius) {
              results.push(ent);
            }
          }
        }
      }
    }

    return results;
  }
}
