export {};
interface ItemViejo {
  nombre: string;
  tipo: string;
  estado: string;
}
class InventarioViejo {
  private items: ItemViejo[] = [];

  public agregarItem(item: ItemViejo): void {
    this.items.push(item);
  }

  public getItems(): ItemViejo[] {
    return this.items;
  }
}

interface Equipo {
  nombre: string;
  tipo: string;
  estado: string;
}

interface Inventario {
  agregarEquipo(nombre: string, tipo: string, estado: string): void;

  listarEquipos(): Equipo[];
}

class AdaptadorInventario implements Inventario {
  private inventarioViejo: InventarioViejo;

  constructor(inventarioViejo: InventarioViejo) {
    this.inventarioViejo = inventarioViejo;
  }

  public agregarEquipo(nombre: string, tipo: string, estado: string): void {
    this.inventarioViejo.agregarItem({
      nombre,
      tipo,
      estado,
    });
  }
  public listarEquipos(): Equipo[] {
    return this.inventarioViejo.getItems();
  }
}

const inventarioViejo = new InventarioViejo();
const adaptador = new AdaptadorInventario(inventarioViejo);
adaptador.agregarEquipo("Servidor Dell", "Servidor", "disponible");
console.log(adaptador.listarEquipos());
// [{ nombre: "Servidor Dell", tipo: "Servidor", estado: "disponible" }]
