# Patrones de Diseño — Sistema de Inventario de Equipos Informáticos

Actividad de **TLP4 (2.º año)**. El objetivo no es construir una app completa, sino aislar
**cuatro patrones de diseño clásicos (GoF)** en un mismo dominio —un inventario de equipos
informáticos— para poder compararlos entre sí y entender **qué problema resuelve cada uno**.

Todos los ejemplos comparten el mismo tipo de dato base:

```ts
interface Equipo {
  nombre: string; // "Notebook HP"
  tipo: string;   // "Portátil"
  estado: string; // "disponible" | "en reparación"
}
```

Un archivo por patrón, cada uno autocontenido y ejecutable:

| # | Patrón | Categoría | Archivo | Pregunta que responde |
|---|--------|-----------|---------|------------------------|
| 1 | Singleton | Creacional | [diseño_singleton.ts](diseño_singleton.ts) | ¿Cómo garantizo que exista **una sola** instancia? |
| 2 | Factory Method | Creacional | [diseño_factory_method.ts](diseño_factory_method.ts) | ¿Cómo creo objetos **sin acoplarme** a la clase concreta? |
| 3 | Observer | Comportamiento | [diseño_observer.ts](diseño_observer.ts) | ¿Cómo aviso a otros de un cambio **sin conocerlos**? |
| 4 | Adapter | Estructural | [diseño_adapter.ts](diseño_adapter.ts) | ¿Cómo uso código viejo con una **interfaz nueva**? |

La consigna original está en [tarea-patrones.md](tarea-patrones.md).

---

## Cómo ejecutar

Cada archivo termina con un bloque de prueba y un `console.log` cuyo resultado esperado está
comentado abajo. Para correrlos:

```bash
npm install -D typescript ts-node   # una sola vez
npx ts-node "diseño_singleton.ts"
```

---

## Nota transversal: por qué todos empiezan con `export {}`

```ts
export {};
```

En TypeScript, un archivo **sin `import` ni `export` es un script global**: sus declaraciones viven
en el mismo espacio de nombres que las de todos los demás archivos del proyecto. Como los cuatro
archivos declaran `Equipo`, sin esta línea los nombres colisionarían entre sí.

`export {}` es un export vacío que **convierte el archivo en un módulo**. A partir de ahí cada
archivo tiene su propio ámbito y los nombres dejan de colisionar. Es el recurso estándar para
archivos de práctica que no exportan nada real.

---

## 1. Singleton

📄 [diseño_singleton.ts](diseño_singleton.ts)

### Qué problema resuelve

Hay recursos de los que **debe existir una sola instancia** en toda la aplicación: una conexión a
base de datos, un archivo de configuración, un logger… o, acá, el inventario. Si cada módulo hiciera
`new Inventario()`, cada uno tendría **su propia lista de equipos** y los datos quedarían
desparramados en objetos distintos que no se ven entre sí.

El Singleton garantiza dos cosas: **una única instancia** y un **punto de acceso global** a ella.

### Estructura del patrón

| Rol | En este código |
|-----|----------------|
| Constructor privado | `private constructor() {}` |
| Referencia estática a la instancia | `private static instancia: Inventario` |
| Método de acceso | `public static obtenerInstancia()` |

### Cómo está aplicado

```ts
class Inventario {
  private static instancia: Inventario;   // 1. guarda la única instancia
  private equipos: Equipo[] = [];

  private constructor() {}                // 2. nadie puede hacer new Inventario()

  public static obtenerInstancia(): Inventario {
    if (!Inventario.instancia) {                // 3. ¿ya existe?
      Inventario.instancia = new Inventario();  //    no → la creo (lazy)
    }
    return Inventario.instancia;                // 4. sí → devuelvo siempre la misma
  }

  public agregarEquipo(nombre: string, tipo: string, estado: string): void {
    this.equipos.push({ nombre, tipo, estado });
  }

  public listarEquipos(): Equipo[] {
    return this.equipos;
  }
}
```

Las tres piezas que hacen que funcione:

1. **`private constructor()`** — es el candado. Sin esto el patrón sería solo una sugerencia:
   cualquiera podría saltarse `obtenerInstancia()` y hacer `new Inventario()` por su cuenta.
2. **`private static instancia`** — `static` significa que la propiedad pertenece a la **clase**, no
   a cada objeto. Es el lugar donde se guarda "la" instancia y sobrevive entre llamadas.
3. **La guarda `if (!Inventario.instancia)`** — implementa la *inicialización perezosa* (*lazy
   initialization*): la instancia no se crea al cargar el archivo, sino la primera vez que
   realmente se la pide.

### Paso a paso de la ejecución

```ts
const inventario = Inventario.obtenerInstancia();
```
1. `Inventario.instancia` es `undefined` → entra al `if` → ejecuta `new Inventario()` (puede,
   porque está **dentro** de la clase) y lo guarda en la propiedad estática.
2. Devuelve esa instancia.
3. Si más adelante otro módulo llama de nuevo a `obtenerInstancia()`, `Inventario.instancia` ya
   existe → **no** crea nada y devuelve exactamente el mismo objeto, con los equipos ya cargados.

```ts
inventario.agregarEquipo("Notebook HP", "Portátil", "disponible");
console.log(inventario.listarEquipos());
// [{ nombre: "Notebook HP", tipo: "Portátil", estado: "disponible" }]
```

### Cuándo usarlo

✅ Configuración global, caché, pool de conexiones, logger, un registro central como este inventario:
cualquier recurso compartido que deba ser **único** y accesible desde cualquier parte.

⚠️ Conviene saber que es el patrón **más discutido** de los cuatro, porque introduce estado global:
dificulta los tests (no se puede partir de un inventario limpio en cada uno) y esconde dependencias
(una clase que llama a `Inventario.obtenerInstancia()` por dentro no declara que depende de él).
Cuando se puede pasar la instancia por constructor (inyección de dependencias), suele preferirse eso.

---

## 2. Factory Method

📄 [diseño_factory_method.ts](diseño_factory_method.ts)

### Qué problema resuelve

Cuando el código cliente hace `new Notebook(...)`, `new Desktop(...)`, `new Servidor(...)` según el
caso, queda **acoplado a cada clase concreta**: si mañana se agrega `Tablet`, hay que tocar todos los
lugares donde se decide qué crear.

El patrón **centraliza la decisión de qué instanciar en un solo lugar** y devuelve siempre un **tipo
común**, para que el cliente trabaje contra la abstracción y no le importe qué clase concreta le tocó.

### Estructura del patrón

| Rol | En este código |
|-----|----------------|
| Producto abstracto | `abstract class Equipo` |
| Productos concretos | `Notebook`, `Desktop`, `Servidor` |
| Creador / fábrica | `class EquipoFactory` |
| Método fábrica | `crearEquipo(...)` |

### Cómo está aplicado

**a) Un producto abstracto que define el contrato común**

```ts
abstract class Equipo {
  tipoEquipo: TipoEquipo;
  nombre: string;
  ram: string;
  procesador: string;

  constructor(tipoEquipo: TipoEquipo, nombre: string, ram: string, procesador: string) {
    this.tipoEquipo = tipoEquipo;
    this.nombre = nombre;
    this.ram = ram;
    this.procesador = procesador;
  }

  detalles() {
    console.log(`Tipo: ${this.tipoEquipo}, Nombre: ${this.nombre}, RAM: ${this.ram}, Procesador: ${this.procesador}`);
  }
}
```

`abstract` significa que la clase **no se puede instanciar directamente** (`new Equipo(...)` es
error): solo sirve como base. Ahí está la clave del patrón — es el **tipo uniforme** que la fábrica
devuelve, y el que permite que el cliente llame a `detalles()` sin saber qué equipo concreto recibió.

Las subclases no agregan comportamiento propio: heredan las cuatro propiedades y el método
`detalles()` del padre. Cuando una subclase no define constructor, JavaScript le genera uno implícito
que reenvía los argumentos al del padre.

```ts
class Notebook extends Equipo {}
class Desktop extends Equipo {}
class Servidor extends Equipo {}
```

**b) Un union type para restringir los tipos válidos**

```ts
type TipoEquipo = "Notebook" | "Desktop" | "Servidor";
```

Esto es TypeScript puro y aporta mucho: `crearEquipo("Tablet", ...)` ni siquiera compila. El error se
detecta al escribir el código, no en ejecución.

**c) La fábrica con el `switch` que decide**

```ts
class EquipoFactory {
  crearEquipo(tipoEquipo: TipoEquipo, nombre: string, ram: string, procesador: string) {
    switch (tipoEquipo) {
      case "Notebook":  return new Notebook(tipoEquipo, nombre, ram, procesador);
      case "Desktop":   return new Desktop(tipoEquipo, nombre, ram, procesador);
      case "Servidor":  return new Servidor(tipoEquipo, nombre, ram, procesador);
      default:          throw new Error();
    }
  }
}
```

Los `new` están **todos acá adentro**. Es el único punto del sistema que conoce las clases concretas:
agregar un tipo nuevo significa tocar **un solo archivo, un solo `switch`**.

En el archivo quedó comentada una versión previa con `if/else`, reemplazada por `switch` porque con
tres o más casos escala mejor y se lee más claro.

### Paso a paso de la ejecución

```ts
const factory = new EquipoFactory();
const notebook = factory.crearEquipo("Notebook", "Dell XPS", "16GB", "i7");
console.log(notebook.detalles());
// Tipo: Notebook, Nombre: Dell XPS, RAM: 16GB, Procesador: i7
```
1. TypeScript valida en compilación que `"Notebook"` sea un `TipoEquipo` válido.
2. El `switch` entra en `case "Notebook"` y ejecuta `new Notebook(...)`.
3. `Notebook` hereda el constructor de `Equipo`, que asigna las cuatro propiedades.
4. La variable `notebook` queda tipada como la unión de los productos, todos compatibles con
   `Equipo`: el cliente puede llamar a `detalles()` sin saber cuál le tocó.

### Sobre `super`

`super(...)` se escribe **dentro de un `constructor`**, y sirve para inicializar la parte del padre
antes de agregar lo propio. Solo hace falta cuando la subclase suma algo:

```ts
class Notebook extends Equipo {
  bateria: string;
  constructor(tipoEquipo: TipoEquipo, nombre: string, ram: string, procesador: string, bateria: string) {
    super(tipoEquipo, nombre, ram, procesador);  // ← primero inicializo al padre
    this.bateria = bateria;                      // ← después lo mío
  }
}
```

Si la subclase no agrega nada, no hace falta escribir constructor: el implícito ya reenvía todo.

### Las dos variantes del patrón

Vale la pena conocer las dos formas que circulan con este nombre:

- **Fábrica centralizada** (la de este archivo): **una** clase con un `switch` que decide qué
  producto construir. Es la más usada en la práctica y la más directa de leer. También se la llama
  *Simple Factory*.
- **Factory Method estricto (GoF)**: el creador declara un método abstracto y **cada subclase del
  creador** decide qué producto construir.

  ```ts
  abstract class Creador {
    abstract crearEquipo(): Equipo;   // ← el "factory method"
  }
  class CreadorNotebook extends Creador {
    crearEquipo(): Equipo { return new Notebook(...); }
  }
  ```

Ambas persiguen lo mismo —sacar los `new` del cliente y devolver un tipo común—; cambia dónde vive
la decisión.

### Cuándo usarlo

✅ Cuando la clase concreta a instanciar **se decide en tiempo de ejecución** (según un string de la
base de datos, una config, la respuesta de una API) y se quiere que esa decisión viva en un solo lugar.

---

## 3. Observer

📄 [diseño_observer.ts](diseño_observer.ts)

### Qué problema resuelve

Cuando un equipo pasa a "en reparación", hay que avisarle a Soporte. La solución ingenua es que
`Equipo` llame directo a `soporte.notificar(...)`. El problema aparece cuando mañana también hay que
mandar un mail, escribir un log y actualizar un dashboard: habría que **modificar la clase `Equipo`**
cada vez, violando el principio Abierto/Cerrado (*abierta a extensión, cerrada a modificación*).

El Observer invierte la relación: el **sujeto** mantiene una lista de **suscriptores** y les avisa a
todos cuando algo cambia, **sin saber quiénes son ni qué hacen con el aviso**.

### Estructura del patrón

| Rol | En este código |
|-----|----------------|
| Sujeto (*Subject / Observable*) | `class Equipo` |
| Interfaz de observador | `interface Observador` |
| Observador concreto | `class Soporte` |
| Suscripción | `agregarObservador()` |
| Notificación | `notificar()` (el del `Equipo`) |

### Cómo está aplicado

**a) El contrato que todo observador debe cumplir**

```ts
interface Observador {
  notificar(nombre: string, estado: string): void;
}
```

Esta interfaz **es el corazón del patrón**: es lo que permite que `Equipo` avise "a alguien" sin
saber a quién. Cualquier clase que la implemente puede suscribirse.

> Detalle de TypeScript: la interfaz está declarada al final del archivo pero se usa arriba. Funciona
> porque los **tipos se hoistean** (se procesan antes de la ejecución), a diferencia de las variables.

**b) El observador concreto**

```ts
class Soporte implements Observador {
  notificar(nombre: string, estado: string) {
    console.log(`Soporte notificado: ${nombre} ha cambiado su estado a ${estado}`);
  }
}
```

`implements Observador` hace que el compilador verifique que `Soporte` cumpla el contrato: si le
faltara el método o tuviera otra firma, no compila.

**c) El sujeto: guarda observadores y les avisa**

```ts
class Equipo {
  nombre: string;
  tipo: string;
  estado: string;
  soporte: Soporte[] = [];        // ← la lista de suscriptores

  cambiarEstado(estado: string) {
    this.estado = estado;         // 1. cambio el estado
    this.notificar();             // 2. aviso a todos
  }

  notificar(): void {
    this.soporte.forEach((sup) => sup.notificar(this.nombre, this.estado));
  }

  agregarObservador(soporte: Soporte) {
    this.soporte.push(soporte);
  }
}
```

El punto clave está en `cambiarEstado`: **el cambio de estado y la notificación quedan atados**. Es
imposible cambiar el estado "por la puerta de atrás" y olvidarse de avisar, porque el único camino
para modificarlo pasa por ese método.

### Paso a paso de la ejecución

```ts
const soporte = new Soporte();
const equipo = new Equipo("Notebook HP", "Portátil", "disponible");
equipo.agregarObservador(soporte);        // 1. suscripción
equipo.cambiarEstado("en reparación");    // 2. disparador
// Soporte notificado: Notebook HP ha cambiado su estado a en reparación.
```
1. `agregarObservador(soporte)` mete la instancia de `Soporte` en el array del equipo.
2. `cambiarEstado("en reparación")` asigna `this.estado` y llama a `this.notificar()`.
3. `notificar()` recorre el array y llama al `notificar(nombre, estado)` de cada suscriptor.
4. `Soporte.notificar` imprime el mensaje.

### La pieza que da la extensibilidad

Para que el sujeto acepte **cualquier** observador nuevo sin tocar su código, la lista y el parámetro
de suscripción se tipan contra la **interfaz** en vez de contra una clase concreta:

```ts
class Equipo {
  private observadores: Observador[] = [];

  public agregarObservador(observador: Observador): void {
    this.observadores.push(observador);
  }

  private notificarObservadores(): void {
    this.observadores.forEach((o) => o.notificar(this.nombre, this.estado));
  }
}
```

Con eso, agregar `class NotificadorMail implements Observador` alcanza para hacer
`equipo.agregarObservador(new NotificadorMail())`: **`Equipo` no se toca**. Esto se llama
**Principio de Inversión de Dependencias** — depender de abstracciones, no de implementaciones.

Dos detalles de esa versión: la lista y la notificación van en `private` porque son detalles internos
que nadie de afuera debería manipular, y el método del sujeto se renombra a `notificarObservadores`
para no confundirlo con el `notificar(nombre, estado)` del observador, que es otra cosa.

### Cuándo usarlo

✅ Eventos de UI (un botón no sabe quién lo escucha), sistemas de notificaciones, el
`addEventListener` del navegador, los *stores* reactivos de React/Vue/Angular. Es el patrón que
sostiene toda la programación orientada a eventos.

---

## 4. Adapter (Adaptador)

📄 [diseño_adapter.ts](diseño_adapter.ts)

### Qué problema resuelve

Hay un sistema viejo que funciona pero cuya interfaz **no coincide** con la que espera el sistema
nuevo. No se lo puede (o no se lo quiere) modificar: es código legacy, de terceros, o lo usan otros
módulos que romperían.

El Adapter es un **traductor**: una clase intermedia que ofrece la interfaz nueva por fuera y por
dentro reenvía las llamadas al objeto viejo, convirtiendo los datos en el camino. Es el mismo
concepto que un adaptador de enchufe: no cambia el aparato ni cambia la pared, se pone en el medio.

### Estructura del patrón

| Rol | En este código |
|-----|----------------|
| *Target* (interfaz esperada) | `interface Inventario` |
| *Adaptee* (lo que ya existe) | `class InventarioViejo` |
| *Adapter* (el traductor) | `class AdaptadorInventario` |
| *Client* | el código que usa `Inventario` |

### Cómo está aplicado

**a) El adaptee — el sistema viejo, intocable**

```ts
interface ItemViejo { nombre: string; tipo: string; estado: string; }

class InventarioViejo {
  private items: ItemViejo[] = [];
  public agregarItem(item: ItemViejo): void { this.items.push(item); }
  public getItems(): ItemViejo[] { return this.items; }
}
```

Recibe **un objeto** (`agregarItem({...})`) y su método de lectura se llama `getItems`.

**b) El target — el contrato que espera el sistema nuevo**

```ts
interface Inventario {
  agregarEquipo(nombre: string, tipo: string, estado: string): void;
  listarEquipos(): Equipo[];
}
```

Recibe **tres parámetros sueltos** y su método de lectura se llama `listarEquipos`. Las dos
interfaces son **incompatibles**: distintos nombres de método y distinta forma de pasar los datos.

**c) El adapter — implementa el target y envuelve al adaptee**

```ts
class AdaptadorInventario implements Inventario {
  private inventarioViejo: InventarioViejo;          // 1. guarda al adaptee

  constructor(inventarioViejo: InventarioViejo) {    // 2. lo recibe por constructor
    this.inventarioViejo = inventarioViejo;
  }

  public agregarEquipo(nombre: string, tipo: string, estado: string): void {
    this.inventarioViejo.agregarItem({ nombre, tipo, estado });  // 3. traduce la llamada
  }

  public listarEquipos(): Equipo[] {
    return this.inventarioViejo.getItems();          // 4. renombra el método
  }
}
```

Las dos piezas del patrón:

1. **`implements Inventario`** — por fuera, el adaptador *es* un `Inventario`. El cliente nunca se
   entera de que hay un `InventarioViejo` adentro.
2. **La composición** — se guarda el adaptee como propiedad privada: se lo **envuelve**, no se lo
   hereda ni se lo modifica. Por eso el patrón sirve con código que no se puede tocar.

La traducción concreta ocurre en dos puntos: `agregarEquipo` **empaqueta** los tres parámetros
sueltos en el objeto que espera `agregarItem`, y `listarEquipos` **renombra** la llamada a `getItems`.

### Paso a paso de la ejecución

```ts
const inventarioViejo = new InventarioViejo();
const adaptador = new AdaptadorInventario(inventarioViejo);
adaptador.agregarEquipo("Servidor Dell", "Servidor", "disponible");
console.log(adaptador.listarEquipos());
// [{ nombre: "Servidor Dell", tipo: "Servidor", estado: "disponible" }]
```
1. Se crea el objeto legacy.
2. Se lo envuelve en el adaptador. El adaptador **no lo crea, lo recibe**: así puede adaptar
   instancias que ya existen y que ya tienen datos cargados.
3. El cliente llama a `agregarEquipo(3 params)`; el adaptador lo convierte en `agregarItem({obj})`.
4. El cliente llama a `listarEquipos()`; el adaptador reenvía a `getItems()`.

### Cuando las estructuras de datos también difieren

En el ejemplo la traducción es de forma de llamada. En un caso real el sistema viejo suele tener
además **otros nombres de campo y otros tipos de dato**, y ahí el adaptador traduce en los dos
sentidos:

```ts
interface ItemViejo {
  nombre_item: string;   // otro nombre de campo
  categoria: string;     // otro nombre de campo
  disponible: boolean;   // ¡otro tipo de dato!
}

public agregarEquipo(nombre: string, tipo: string, estado: string): void {
  this.inventarioViejo.agregarItem({
    nombre_item: nombre,
    categoria: tipo,
    disponible: estado === "disponible",     // string → boolean
  });
}

public listarEquipos(): Equipo[] {
  return this.inventarioViejo.getItems().map((item) => ({
    nombre: item.nombre_item,
    tipo: item.categoria,
    estado: item.disponible ? "disponible" : "en reparación",   // boolean → string
  }));
}
```

Ese `.map()` es el Adapter en su forma más pura: el cliente recibe **siempre** `Equipo`, sin importar
cómo guarde las cosas el sistema de abajo.

### Cuándo usarlo

✅ Migraciones (convivencia de sistema viejo y nuevo), envolver librerías de terceros para poder
cambiarlas después sin tocar el resto del código, unificar varias APIs externas bajo una interfaz
propia.

---

## Resumen comparativo

| Patrón | Categoría | Intención en una línea | Pieza clave | Analogía |
|--------|-----------|------------------------|-------------|----------|
| **Singleton** | Creacional | Una sola instancia, acceso global | `private constructor` + `static instancia` | El presidente de un país |
| **Factory Method** | Creacional | Delegar la creación, devolver un tipo común | `switch` centralizado + clase `abstract` | Un mozo: pedís "pizza", no cocinás |
| **Observer** | Comportamiento | Avisar a N interesados sin conocerlos | `interface Observador` + lista de suscriptores | Suscribirse a un canal |
| **Adapter** | Estructural | Traducir entre dos interfaces incompatibles | `implements Target` + composición del adaptee | Adaptador de enchufe |

### Lo que conecta a los cuatro

Los cuatro atacan la misma enfermedad desde ángulos distintos: **el acoplamiento**.

- **Singleton** controla *cuántas* instancias hay.
- **Factory Method** desacopla al cliente de las *clases concretas* que instancia.
- **Observer** desacopla al que *emite* un evento del que lo *consume*.
- **Adapter** desacopla al cliente de la *interfaz* concreta de una dependencia.

Y tres de ellos (Factory, Observer, Adapter) descansan sobre la misma idea: **programar contra una
abstracción** (`abstract class Equipo`, `interface Observador`, `interface Inventario`) en lugar de
contra una implementación concreta. Si hay una sola conclusión para llevarse de esta actividad, es esa.

### Conceptos de TypeScript que aparecen en el camino

| Concepto | Dónde aparece | Para qué sirve |
|----------|---------------|----------------|
| `export {}` | los cuatro archivos | Convierte el script en módulo y le da ámbito propio |
| `static` | Singleton | La propiedad pertenece a la clase, no a cada instancia |
| `private` | Singleton, Adapter | Restringe el acceso a lo interno de la clase |
| `abstract class` | Factory Method | Clase base que no se instancia, solo se hereda |
| Union types (`"A" \| "B"`) | Factory Method | Restringe los valores válidos en tiempo de compilación |
| `extends` / `super()` | Factory Method | Herencia e inicialización del padre |
| `interface` + `implements` | Observer, Adapter | Define un contrato y obliga a cumplirlo |
| Hoisting de tipos | Observer | Los tipos se pueden usar antes de declararlos |
