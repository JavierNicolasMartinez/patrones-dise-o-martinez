export {};

type TipoEquipo = "Notebook" | "Desktop" | "Servidor";

abstract class Equipo {
  constructor(
    protected nombre: string,
    protected ram: string,
    protected procesador: string
  ) {}

  public abstract detalles(): string;

  protected descripcion(): string {
    return `Nombre: ${this.nombre}, RAM: ${this.ram}, Procesador: ${this.procesador}`;
  }
}

class Notebook extends Equipo {
  public detalles(): string {
    return `Tipo: Notebook, ${this.descripcion()}`;
  }
}

class Desktop extends Equipo {
  public detalles(): string {
    return `Tipo: Desktop, ${this.descripcion()}`;
  }
}

class Servidor extends Equipo {
  public detalles(): string {
    return `Tipo: Servidor, ${this.descripcion()}`;
  }
}

class EquipoFactory {
  public crearEquipo(
    tipo: TipoEquipo,
    nombre: string,
    ram: string,
    procesador: string
  ): Equipo {
    switch (tipo) {
      case "Notebook":
        return new Notebook(nombre, ram, procesador);
      case "Desktop":
        return new Desktop(nombre, ram, procesador);
      case "Servidor":
        return new Servidor(nombre, ram, procesador);
      default:
        throw new Error(`Tipo de equipo desconocido: ${tipo}`);
    }
  }
}

const factory = new EquipoFactory();
const notebook = factory.crearEquipo("Notebook", "Dell XPS", "16GB", "i7");
console.log(notebook.detalles());
// Tipo: Notebook, Nombre: Dell XPS, RAM: 16GB, Procesador: i7
