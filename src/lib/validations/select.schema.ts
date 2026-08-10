import { z } from "zod";

/**
 * UUID requerido proveniente de un `<select>` controlado en el cliente.
 *
 * Por qué existe: los formularios usan `noValidate` (validamos nosotros, no
 * el navegador) y los selects usan una opción placeholder `disabled`
 * ("Selecciona una cuenta..."). Si el usuario envía el formulario sin elegir
 * nada, el HTML spec excluye esa opción disabled de `FormData` — la clave ni
 * siquiera llega como `""`, llega como `undefined`. `z.string().uuid(msg)`
 * sólo personaliza el mensaje del formato UUID, no el de "no es un string"
 * (`undefined`), así que ese caso mostraba el texto interno de Zod en inglés.
 * `z.string(message)` cubre ambos casos con el mismo mensaje.
 */
export function requiredUuidSchema(message: string) {
  return z.string(message).uuid(message);
}
