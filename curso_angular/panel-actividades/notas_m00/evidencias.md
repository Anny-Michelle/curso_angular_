
## Ejercicio Incremento 6 - Caso B (Módulo 0)

Capa: compilación

Acción que reproduce: cambiar la etiqueta de apertura <main> por <section> sin modificar la etiqueta de cierre </main>

Mensaje o resultado:  NG5002: Unexpected closing tag "main". It may happen when the tag has already been closed by another tag (src/app/app.html:4:0). Error occurs in the template of component App.

Hipótesis: las etiquetas de apertura y cierre deben coincidir; Angular no puede compilar un template con HTML mal formado

Corrección mínima: cambiar </main> de vuelta a </section> para que ambas etiquetas coincidan

Caso original después de corregir: la aplicación compila y se muestra correctamente en http://localhost:4200/

Caso vecino: el <h1>Panel de actividades</h1> sigue visible en pantalla y en el DOM tras la corrección