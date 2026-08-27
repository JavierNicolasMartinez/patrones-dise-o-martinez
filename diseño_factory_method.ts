export {};

type TipoEquipo = "Notebook" | "Desktop" | "Servidor";

class EquipoFactory {
  crearEquipo(
    tipoEquipo: TipoEquipo,
    nombre: string,
    ram: string,
    procesador: string,
  ) {
    switch (tipoEquipo) {
      case "Notebook":
        return new Notebook(tipoEquipo, nombre, ram, procesador);
      case "Desktop":
        return new Desktop(tipoEquipo, nombre, ram, procesador);
      case "Servidor":
        return new Servidor(tipoEquipo, nombre, ram, procesador);
      default:
        throw new Error();
    }
    // if (tipoEquipo == "Notebook") {
    //   return new Notebook(tipoEquipo, nombre, ram, procesador);
    // } else {
    //   throw new Error();
    // }
    // return new Desktop(nombre, ram, procesador, tipoEquipo)
  }
}

abstract class Equipo {
  tipoEquipo: TipoEquipo;
  nombre: string;
  ram: string;
  procesador: string;

  constructor(
    tipoEquipo: TipoEquipo,
    nombre: string,
    ram: string,
    procesador: string,
  ) {
    this.tipoEquipo = tipoEquipo;
    this.nombre = nombre;
    this.ram = ram;
    this.procesador = procesador;
  }

  detalles() {
    console.log(
      `Tipo: ${this.tipoEquipo}, Nombre: ${this.nombre}, RAM: ${this.ram}, Procesador: ${this.procesador}`,
    );
  }
}

class Notebook extends Equipo {
  super() {}
}
class Desktop extends Equipo {
  super() {}
}
class Servidor extends Equipo {
  super() {}
}

const factory = new EquipoFactory();
const notebook = factory.crearEquipo("Notebook", "Dell XPS", "16GB", "i7");
console.log(notebook.detalles());
// Tipo: Notebook, Nombre: Dell XPS, RAM: 16GB, Procesador: i7
