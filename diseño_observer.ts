export {};
class Soporte implements Observador {
  notificar(nombre: string, estado: string) {
    console.log(
      `Soporte notificado: ${nombre} ha cambiado su estado a ${estado} `,
    );
  }
}

class Equipo {
  nombre: string;
  tipo: string;
  estado: string;
  soporte: Soporte[] = [];

  constructor(nombre: string, tipo: string, estado: string) {
    this.nombre = nombre;
    this.tipo = tipo;
    this.estado = estado;
  }

  cambiarEstado(estado: string) {
    this.estado = estado;

    this.notificar();
  }

  notificar(): void {
    //no me dejo ponerlo en privado, intente de todas las formas.
    this.soporte.forEach((sup) => sup.notificar(this.nombre, this.estado));
  }

  agregarObservador(soporte: Soporte) {
    this.soporte.push(soporte);
  }
}

interface Observador {
  notificar(nombre: string, estado: string): void;
}

const soporte = new Soporte();
const equipo = new Equipo("Notebook HP", "Portátil", "disponible");
equipo.agregarObservador(soporte);
equipo.cambiarEstado("en reparación");
// Soporte notificado: Notebook HP ha cambiado su estado a en reparación.
