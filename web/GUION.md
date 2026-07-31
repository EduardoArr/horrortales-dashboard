# GUION.md — Biblia de guiones de HorrorTales

> **Este documento se lee ENTERO antes de escribir cualquier guion, y se sigue al pie de la letra.**
> Es la única fuente de verdad del proceso y del estilo del canal. Si algo de aquí choca con una
> costumbre previa, manda este documento.

HorrorTales es un canal de **true crime / misterio con documentación seria detrás**. La credibilidad
del canal se juega en la precisión de los datos y en la capacidad de sostener la atención sin mentir.
Todo lo que sigue existe para conseguir esas dos cosas a la vez.

---

## 0. Cómo usar este documento

- El proceso tiene **una Fase 0 de insumos** y **8 Etapas**. No se salta ninguna y no se avanza a la
  siguiente sin que el usuario apruebe o corrija la actual.
- **Entregable por etapa:** en cada etapa se entrega SOLO el contenido de esa etapa. **Nunca se
  muestra el guion completo hasta que todas las etapas están aprobadas.**
- Hoy este documento guía el trabajo manual (Claude escribiendo con el usuario). Está escrito además
  como **especificación** para que la web (`/guiones`) lo implemente después: por eso la terminología
  coincide con el código y el Anexo mapea cada etapa a su archivo.
- Cuando aquí se dice "preguntá" o `needs_input`, significa: **parar esa etapa, hacer la pregunta
  puntual y esperar la respuesta** antes de continuar. No se rellena el hueco con algo plausible.

---

## 1. Regla de veracidad (manda sobre todo)

Esta es la regla que **pesa más que el ritmo, la fluidez o el impacto**. Ante cualquier conflicto,
gana la veracidad.

> **Nunca inventes, completes de memoria ni "redondees" un dato — fecha, nombre, cifra, edad, hora,
> lugar, declaración o hecho — que no esté explícito en la investigación aportada, aunque el caso te
> resulte reconocible.** Si para completar una sección te falta un dato concreto, no lo completes con
> algo verosímil: **respondé con `needs_input` y una pregunta puntual sobre exactamente qué dato
> falta y para qué lo necesitás.** Es preferible una sección incompleta señalada que un dato
> incorrecto en pantalla.

Consecuencias prácticas:

- La **investigación de la Fase 0.1 es la ÚNICA fuente de verdad.** No la completes con lo que "ya
  sabés" del caso, aunque te suene familiar: el usuario puede tener una versión con matices o
  correcciones sobre la historia pública.
- **La especulación se marca como especulación.** Si el guion razona una hipótesis ("todo apunta a…",
  "solo podemos imaginar…"), tiene que quedar explícito que es una lectura, no un hecho. Nunca
  presentes una inferencia como dato documentado.
- Un dato que aparece en la **transcripción viral** (Fase 0.2) pero **no** en la investigación **no es
  un hecho verificado** — ver la regla de reconciliación en 2.2.

---

## 2. Fase 0 — Insumos (pedirlos DE A UNO)

Antes de tocar la Etapa 1 hacen falta los insumos de abajo. **Pedilos en orden y esperá cada uno
antes de pedir el siguiente** — si los pedís los cuatro de golpe, el usuario tiende a responder solo
el primero y el resto se pierde. Si el usuario ya pegó alguno en el mismo mensaje, confirmá que lo
tenés y seguí sin volver a pedirlo.

### 2.1 — Investigación del caso (0.1) · OBLIGATORIA

Hechos, fechas, nombres, cronología, edades, lugares, declaraciones y fuentes del caso. Es la única
fuente de verdad (ver sección 1). Suele venir como un documento; cuanto más completa, menos
interrupciones por `needs_input` habrá después.

**Dónde vive:** todas las investigaciones se guardan juntas en **`web/investigaciones/`**, un archivo
por caso, en kebab-case (`ricardo-lopez.txt`). No se dejan sueltas por el repositorio. Si el usuario
pega la investigación en el chat en vez de aportar el archivo, **guardala ahí** antes de empezar: así
queda disponible para las etapas siguientes y para futuras sesiones (una conversación larga se
compacta y el documento se pierde del contexto; el archivo no).

### 2.2 — Transcripción de un video viral de referencia (0.2) · DOBLE FUNCIÓN

Se pide la transcripción de **uno o dos videos de otros canales sobre el mismo caso (o uno muy
similar) que hayan funcionado** (del orden de 1-2M+ visitas). Tiene **dos usos, y solo dos**:

1. **Termómetro de estructura y ritmo.** Ver cómo un video ya validado por la audiencia reparte la
   información: qué outline sostiene la atención, dónde pone los giros, cómo escala. Es referencia de
   *forma narrativa*, **nunca** de frases ni del ángulo propio de ese canal (eso no se copia).
2. **Superficie de cruce factual.** Leer la transcripción para **detectar** hechos que quizá valga la
   pena tener en el guion.

**Regla de reconciliación (la investigación manda):**

- Un hecho de la transcripción que **también** está en la investigación → se puede usar (la fuente es
  la investigación).
- Un hecho que está en la transcripción **pero no** en la investigación → **NO entra solo.** Se anota
  como "dato a verificar" y se **pregunta al usuario** si quiere añadirlo a la investigación (idealmente
  con fuente). Hasta que lo confirme, no aparece en el guion.
- Si la transcripción **contradice** la investigación → **gana la investigación.** Se le puede señalar
  la discrepancia al usuario, pero el guion usa el dato de la investigación.

Si el usuario no tiene transcripción a mano, preguntale si prefiere buscar una antes de seguir o
avanzar sin ella (dejando claro que en ese caso se trabaja solo con criterio de estructura, sin
benchmark, y sin esa segunda red de cruce factual).

### 2.3 — Título y miniatura (0.3)

El título (o las opciones que se barajan) y una descripción de la miniatura: qué imagen, qué texto,
qué expresión o elemento visual. **Título y miniatura son la promesa psicológica del video** — el
guion entero tiene que sostener exactamente ese ángulo, ni más flojo ni desviado. Esto alimenta la
Etapa 1.

### 2.4 — Brain dump del usuario (0.4)

Todo lo que el usuario sabe o le importa del tema, sin orden. **No reemplaza a la investigación** y no
agrega hechos nuevos por sí solo: sirve para **priorizar** qué le importa más al usuario. Los hechos
salen de la investigación; el brain dump dice dónde poner el foco.

> Con los insumos en mano (o con la decisión explícita de avanzar sin alguno), se pasa a la Etapa 1.

---

## 3. La voz de HorrorTales

La voz del canal es **omnisciente y dramática**. Es la voz del guion de *Los Galindos*. Es el estándar
y no se cambia sin que el usuario lo pida.

**Cómo suena:**

- **Presente.** Se reconstruye la escena como si pasara ahora. *"Antonio vuelve a casa en moto. Ve
  humo. Acelera. Llega al portón. Lo abre."*
- **Sin "yo".** El narrador no es un investigador en primera persona ("encontré", "me llamó la
  atención"). Es una voz que ya sabe adónde va la historia y la cuenta.
- **Frases cortas y contundentes, pero con continuidad.** El ritmo es oral. Alterná longitudes: una
  frase corta golpea cuando surge de un pasaje más fluido, no cuando se amontona con otras dos o tres
  iguales. La prosa avanza y conecta; no se trocea en telegramas ni en anáforas de énfasis (ver la
  regla destacada en «Prohibido»).
- **El silencio y el detalle sensorial antes que la explicación.** Primero la imagen ("Y por debajo,
  colándose bajo la puerta cerrada con candado, un reguero de sangre"), después el dato.
- **La contundencia va en la frase, no en adjetivos.** No "algo increíblemente perturbador"; se
  muestra el hecho y el hecho perturba solo.

**Contar la vida, no resumirla desde fuera (dale vida a la historia):**

El fallo más común es narrar *sobre* el personaje en tercera persona analítica —interpretando y
sacando conclusiones— en vez de meter al espectador en su vida. Suena a ensayo, no a historia.

- **Contá el día a día.** Cómo era una jornada suya, qué hacía al levantarse, a qué volvía por la
  noche, qué rutina repetía. Lo concreto y cotidiano es lo que hace que la gente entienda al
  personaje.
- **Contá el contenido de lo que dejó.** Si hay cintas, diarios, cartas, llamadas o declaraciones:
  **de qué hablan**, qué tono tienen, cómo cambian con el tiempo. El material es la historia, no un
  dato de contexto que se menciona de pasada.
- **Mostrá, no interpretes.** En vez de *"esa fue la verdadera función de la cámara"*, mostrá qué
  hacía delante de la cámara y dejá que el espectador saque la conclusión.
- **Subordinado a la regla de veracidad.** Si la investigación no documenta el día a día, **no se
  inventa**: se dramatizan los temas y la rutina que **sí** constan. Antes de dar granularidad
  (entradas fechadas, frases concretas), revisá si existe de verdad en la investigación o en la
  transcripción; si no existe, decilo o pedila (`needs_input`). Nunca se rellena la textura con
  invención verosímil.

**Primera persona y dramatización (monólogo interior y diálogo):**

El canal mete al espectador *dentro* de la escena dándole voz a los personajes. En los momentos
cargados —cuando alguien decide, planea, se derrumba o se enfrenta a otro— se abre el monólogo
interior o el diálogo, en primera persona y entre comillas, intercalado con la narración omnisciente.
Sirve para que la gente "se meta en el papel".

- **Formato.** El pensamiento o la frase del personaje va **entre comillas y en su propia línea**. En
  una conversación entre dos personajes, cada intervención en su línea (podés usar guion de diálogo).
  El narrador de alrededor sigue siendo omnisciente; la primera persona vive solo dentro de las
  comillas.
- **Cuándo.** En los picos dramáticos: pensar un plan, tomar una decisión, un cara a cara, el punto de
  quiebre. **Puntúa, no sustituye** a la narración; si todo es monólogo, se descafeína.
- **Ejemplo:**
  > Ricardo se queda mirando la cámara y le da vueltas a una sola idea:
  > *"¿Cómo hago para que no me olvide nunca?"*
  > Y entonces, en esa cabeza enferma, algo encaja:
  > *"Ya lo tengo. ¿Y si le mando un paquete que, al abrirlo, le clave unas jeringas con sangre
  > infectada?"*
  > En 1996, el VIH no tenía cura.
- **Salvaguarda de veracidad (INNEGOCIABLE).** Estas voces solo pueden **dramatizar lo que la
  investigación documenta**: el razonamiento, el motivo o las palabras que la persona realmente tuvo o
  dejó registradas (diario, cintas, declaraciones). Una cita textual documentada se usa como real; una
  reconstrucción dramatizada **no puede introducir hechos nuevos** (fechas, nombres, sucesos) que no
  estén en la investigación. Es un recurso de dramatización, no una licencia para poner en boca del
  personaje algo que no consta. Ante la duda: no lo hagás hablar → `needs_input` o córtalo.

**Prohibido (relleno y muletillas que matan el ritmo):**

- **La pausa dramática de IA: rotundamente NO.** No machaques una idea troceándola en dos o tres frases-fragmento paralelas y seguidas para forzar un golpe de efecto — del tipo *"No hubo relación. No hubo rechazo. Ni una sola conversación."* o *"Sin un juicio. Sin un condenado. Sin una respuesta."* Es el tic que más delata a una IA y el usuario lo detecta al instante. La tensión sale del contenido y de la continuidad, no de la anáfora. (Distinto es narrar una acción rápida — *"Ve humo. Acelera. Abre el portón."* —, que sí es ritmo de escena legítimo.) Si en un punto concreto hace falta una pausa marcada, la decide y la coloca el usuario a mano; no se genera por defecto.
- Frases genéricas de apertura tipo *"en este video te voy a mostrar"*, *"hoy vamos a hablar de"*.
- Muletillas de transición vacías: *"básicamente"*, *"como dijimos"*, *"en resumen"*, *"cabe destacar"*.
- Contexto de relleno: *"en el mundo actual"*, *"desde el principio de los tiempos"*.
- Conclusiones y moralejas huecas. El cierre eleva el caso (ver 4 y Etapa 8), no da lecciones de vida.
- Repetir con otras palabras algo que ya se dijo. Si ya se entregó un dato, no se re-explica.

---

## 4. Densidad de datos (mandato)

El guion de *Los Galindos* es un buen ejemplo de estructura, pero se quedó **escueto**: un guion de
HorrorTales debe tener **más datos concretos**. La especificidad es lo que separa "true crime serio
con documentación detrás" de un resumen genérico.

- **Cada fecha, edad, nombre, cifra, hora, distancia y lugar que ESTÉ en la investigación tiene que
  aparecer.** No se resume "un hombre murió"; se dice quién, de qué edad, qué hacía, a qué hora,
  dónde. Los datos anclan la credibilidad y hacen el relato inolvidable.
- **Los detalles concretos son también los mejores ganchos.** "Un policía se paró a orinar junto a la
  paja donde estaba el cuerpo" retiene más que "hubo negligencia policial".
- Este mandato **está subordinado a la regla de veracidad**: se exprime al máximo lo que la
  investigación aporta, pero **no se inventa** densidad. Si el usuario quiere más datos de los que la
  investigación contiene, eso es un `needs_input` (pedir más investigación), no una licencia para
  rellenar.

---

## 5. Framework psicológico de 6 pasos (por sección del cuerpo)

Cada sección del cuerpo del guion aplica este orden **estricto**:

1. **GANCHO NARRATIVO** — la imagen, escena o dato más perturbador de ESA sección, lanzado sin
   contexto. No se explica nada todavía. Que el viewer no entienda del todo qué pasa pero no pueda
   mirar hacia otro lado. La pregunta que debe quedar flotando no es *"¿me pasará a mí?"* sino
   ***"¿cómo demonios llegó a pasar esto?"***
2. **PREGUNTA SIN RESPUESTA** — cerrá el bloque del gancho con una pregunta que el viewer no puede
   responder todavía. No la contestes. Dejala abierta.
3. **IRONÍA (si aplica)** — el giro inesperado o la contradicción que hace el tema más interesante de
   lo que parecía. Solo si el caso lo tiene; no se fuerza.
4. **INFORMACIÓN / SOLUCIÓN** — ahora sí, se desarrolla el contenido. Una idea por oración, sin
   relleno, sin repetir lo ya dicho en secciones anteriores.
5. **MINI-PAYOFF** — cerrá entregando la respuesta a la pregunta que abriste (el payoff de esta
   sección, definido en la Etapa 4; usalo tal cual o parafraseado, nunca contradicho).
6. **REHOOK** — última línea de la sección. Cerrá el loop actual y abrí el siguiente con **MÁS**
   urgencia que el anterior (salvo que sea la última sección del guion).

**Regla de oro del framework: la información va DESPUÉS del miedo, nunca antes.**

---

## 6. ADN viral (por qué estos guiones retienen)

Destilado del guion de *Los Galindos* y de los guiones virales analizados de otros canales. Son los
patrones que sostienen la atención; aplicalos siempre que el caso lo permita:

- **Cold open con lo más perturbador, sin contexto.** El video abre con la imagen o el dato más
  fuerte del caso, antes de presentar a nadie. (*Los Galindos* abre con el sospechoso principal
  apareciendo muerto bajo la paja ya registrada.)
- **Loops abiertos que se pagan después.** Se plantan preguntas y se responden más adelante, nunca de
  inmediato. Cada sección abre un problema nuevo antes de cerrar el anterior.
- **Reconstrucción desde la evidencia.** El caso se cuenta a través de lo que la evidencia demuestra
  (el reloj parado, la autopsia, la carta, las cámaras), no como una lista de conclusiones.
- **Escalada.** Cada sección es más oscura o más impactante que la anterior. La mejor carta no se
  gasta en la primera sección (ver Etapa 3).
- **Dos perspectivas / ambigüedad cuando el caso lo permite.** Presentar la versión oficial y por qué
  no encaja crea tensión y hace pensar al viewer. No se resuelve todo de golpe.
- **Especulación marcada como especulación.** Cuando se razona una hipótesis, se dice que lo es (ver
  sección 1). Esto, lejos de restar, suma credibilidad.
- **Cierre temático que eleva el caso.** El final no es un resumen: convierte el caso en una idea
  mayor. (*Los Galindos*: "No fue un crimen perfecto. Fue un crimen perfectamente ignorado.")

---

## 7. Las 8 Etapas

Recordá: **un entregable por etapa**, y **nunca el guion completo hasta que todas estén aprobadas.**

### Etapa 1 — Título

- **Si el usuario ya trajo título y miniatura (0.3):** no generes opciones nuevas. **Contrastá el
  ángulo psicológico que prometen el título + la miniatura contra la investigación.** ¿Los hechos
  documentados sostienen esa promesa (fascinación, indignación o perturbación)? Si hay un desajuste —
  el título promete algo que la investigación no respalda — **avisá antes de seguir**, no lo fuerces.
  Si el ajuste es correcto, confirmalo brevemente y pasá a la Etapa 2.
- **Si NO hay título todavía:** generá **5 opciones con ángulo**. El "ángulo asesino" es **la tensión
  dentro del tema, no el tema** — pero siempre anclado en hechos reales de la investigación (nunca un
  ángulo inventado que la investigación no respalde). Para cada opción, indicá qué **anzuelo
  psicológico** activa: **fascinación, indignación o perturbación.** Esperá selección antes de seguir.

### Etapa 2 — Intro

La intro tiene un solo trabajo: **confirmar el click y abrir el loop principal.** En los primeros ~10
segundos tiene que: (a) confirmar la expectativa que generó el título/miniatura, y (b) abrir una
pregunta **más grande** que la del título.

- Generá **3 variaciones**, ángulos distintos: **miedo / ironía / dato sorprendente.** Máximo **100
  palabras** cada una.
- Todo dato que menciones sale de la investigación. Si necesitás un dato de apertura fuerte y no está,
  preguntalo (`needs_input`) en vez de inventarlo.
- **La variación preferida del canal es la de escena/miedo** (cold open que mete al viewer directo en
  la escena más fuerte, como la de *Los Galindos*). Sigue entregando las 3 igualmente para que el
  usuario elija.

**Control de calidad de la intro** (corregí directo sin preguntar si falla algo de estilo; si falla
por un dato no verificado, preguntá): ¿confirma el click en 10s? ¿abre un loop de curiosidad? ¿suena
como alguien que sabe exactamente adónde va con esta historia? ¿la primera oración obliga a leer la
segunda? ¿hay frases genéricas tipo "en este video te voy a mostrar"? ¿todo dato está respaldado por
la investigación?

### Etapa 3 — Outline

Con la investigación (0.1) + el brain dump (0.4), y usando la transcripción viral (0.2) como
termómetro de qué estructura ya retuvo audiencia, organizá el material en **7 a 10 secciones
narrativas ordenadas**. Reglas de orden **estrictas**:

- **Continuidad ante todo: el cuerpo sigue un hilo cronológico y causal.** La historia se desarrolla y
  avanza; nada de datos sueltos o fuera de orden. Cada sección se apoya en la anterior y prepara la
  siguiente (p. ej. no se cuenta un detonante antes de haber presentado lo que detona).
- Cada sección **abre un problema nuevo** (openProblem) antes de cerrar el anterior.
- **El segundo punto más interesante del caso va primero; el más interesante, segundo** — no se gasta
  la mejor carta de entrada en la sección 1. Esto opera *dentro* del hilo cronológico: evita abrir por
  el clímax, pero nunca justifica romper la continuidad para adelantar un payoff.
- **Ningún payoff se repite** entre secciones.
- Para cada sección, dejá una **nota de fuente** (sourceNote): en qué parte de la investigación o del
  brain dump se apoya, para poder rastrear cada afirmación después.
- Si para armar una sección te falta un hecho que no está ni en la investigación ni en el brain dump,
  **señalalo** (`needs_input`) en vez de inventarlo — mejor un hueco marcado que una sección forzada.

### Etapa 4 — Payoffs (antes de escribir las secciones completas)

Para cada sección del outline, escribí **SOLO el payoff** (1-2 oraciones: el momento donde el viewer
recibe lo que vino a buscar) **y la pregunta que lo antecede.**

- Cada payoff tiene que anclarse en un hecho concreto de la investigación. Si un payoff depende de un
  dato no documentado, avisá antes de seguir.
- Si algún payoff sale **débil o repetido**, avisá antes de continuar — no tiene sentido escribir la
  sección completa de un payoff flojo.

### Etapa 5 — Secciones completas (una por una, no todas juntas)

Para cada sección, aplicá el **framework de 6 pasos** (sección 5). Escribí **SOLO esa sección.**

- Frases cortas, ritmo oral, cero relleno (ver sección 3). Densidad de datos al máximo (sección 4).
- Cada hecho, fecha, nombre o cifra tiene que poder rastrearse a la investigación. Si mientras
  escribís notás que necesitás un dato que no tenés, **pará y preguntá** (`needs_input`); no lo
  completes con algo verosímil.
- **Dos variaciones** por sección solo si el usuario lo pide (mismo contenido factual, distinto
  enfoque de estilo/ritmo).
- **Extensión y duración.** El canal apunta a vídeos de ~40 min. Regla de cálculo: palabras ≈ minutos
  × ~145 (ritmo de narración en español), así que ~40 min ≈ **5.500–6.000 palabras**. Con 8 secciones,
  son **~650–750 palabras por sección** (unos 4–5 min cada una); ajustá el reparto al nº real de
  secciones y a la duración objetivo. La extensión sale de exprimir la investigación (más
  reconstrucción, más datos concretos, más profundidad del «cómo llegó a pasar»), **nunca de relleno
  ni de repetir**. Si la investigación no da para la duración objetivo, avisá (`needs_input`): falta
  material, no palabras.

**Control de calidad de sección** (corregí directo si falla algo de estilo; si falla por un dato no
verificado, preguntá): ¿queda claro cómo llegó a pasar esto? ¿hay pregunta sin respuesta? ¿la
información va después del gancho, no antes? ¿el payoff responde la pregunta abierta? ¿el rehook sube
la urgencia? ¿repetís algo ya dicho en una sección anterior? ¿hay frases de relleno?

### Etapa 6 — Hooks de transición

Con todas las secciones escritas, volvé a cada unión. Tomá el final de la sección anterior y el
inicio de la siguiente y generá **6 opciones de hook de transición** (máximo 2-3 oraciones): cierra el
loop anterior con el mini-payoff y abre el siguiente con más urgencia.

### Etapa 7 — CTAs

El canal usa **un solo CTA por vídeo**, colocado **al principio, justo después de la sección 1 o 2**
(cuando ya se generó algo de confianza pero aún no se pierde audiencia), **sin cortar el flujo**: se
sale un momento de la narración, se pide, y se devuelve al espectador a la historia enganchándolo con
lo que viene.

El canal se publica en **YouTube y Spotify**, así que el CTA se dirige a las dos audiencias:

- **YouTube:** suscribirse y dar like (es lo que hace crecer el canal y llegar a más gente).
- **Spotify:** valorar el episodio y, si se puede, compartirlo.

El CTA usa el **lenguaje natural del canal**, nunca suena a publicidad, y **es corto**: mejor si se
apoya en la propia historia ("si has llegado hasta aquí, es porque…") en vez de soltar la petición en
frío. (Si en algún vídeo se quisiera promocionar otra cosa —un patrocinador, otro vídeo, un producto—
y no hay info de qué ofrecer, se pregunta antes de escribir el CTA: `needs_input`.)

### Etapa 8 — Feedback loop (después de que el usuario edite el guion)

Cuando el usuario pase la versión generada y la versión final editada por él, identificá los patrones
de cambio y convertilos en reglas concretas:

- **Cambios estructurales** (qué reorganizó, qué cortó) → regla concreta.
- **Cambios de estilo** (qué frases reemplazó, qué tono ajustó) → regla concreta.
- **Patrones repetidos** (errores que aparecen más de una vez).
- **Correcciones factuales** (qué dato corrigió o eliminó por impreciso) → regla concreta sobre qué
  tipo de afirmación evitar sin fuente.

El resultado es una **actualización de la guía de estilo personal del usuario**, para que el próximo
guion nazca ya corregido.

---

## 8. Formato del entregable final

Convenciones de maquetación del guion (tomadas de *Los Galindos*):

- **Texto normal** → narración principal.
- ***Cursiva con sangría*** → rehook / transición / pregunta retórica.
- **Negrita** → el golpe: la frase que remata un bloque ("**Los descuartizaron.**", "**Era el
  objetivo.**").
- **Recuadro / marcador visible** → CTA (llamada a la acción).
- **Presente** para reconstruir la escena.

---

## 9. Checklists rápidos

**Intro:** ¿confirma el click en 10s? · ¿abre loop mayor que el título? · ¿la 1ª oración obliga a
leer la 2ª? · ¿cero frases genéricas? · ¿todo dato respaldado?

**Sección:** ¿"cómo llegó a pasar esto"? · ¿pregunta sin respuesta? · ¿info después del miedo? · ¿el
payoff cierra la pregunta? · ¿el rehook sube la urgencia? · ¿sin repetir payoffs/frases previas? ·
¿cero relleno? · ¿sin pausas dramáticas de IA (fragmentos anafóricos)? · ¿prosa continua, no
troceada? · ¿se cuenta el día a día y el contenido del material, en vez de interpretarlo desde
fuera? · ¿hay monólogo interior en los picos dramáticos? · ¿densidad de datos al máximo? · ¿todo
rastreable a la investigación?

**Global:** ¿el guion sostiene el ángulo exacto del título+miniatura? · ¿el cuerpo fluye como una
historia continua, sin datos desordenados? · ¿escala sección a sección? · ¿ningún payoff repetido? ·
¿la especulación está marcada como tal? · ¿un solo CTA, colocado tras la sección 1 o 2? · ¿el cierre
eleva el caso en vez de resumirlo? · ¿ningún dato sin respaldo?

---

## Anexo — Mapa a la implementación web (para la ronda futura)

Este documento es la **fuente de verdad** que la feature `/guiones` implementará. Correspondencia
actual etapa ↔ código:

| Etapa | Archivo en `web/lib/scripts/` |
|-------|-------------------------------|
| Regla de veracidad (compartida) | `context.ts` (`VERACITY_RULE_TEXT`) |
| E1 Título | `titleStage.ts` |
| E2 Intro | `introStage.ts` |
| E3 Outline | `outlineStage.ts` |
| E4 Payoffs | `payoffsStage.ts` |
| E5 Secciones | `sectionStage.ts` (+ tabla `ScriptSection`) |
| E6 Transiciones | `transitionsStage.ts` |
| E7 CTAs | `ctasStage.ts` |
| E8 Feedback loop | `styleReviewStage.ts` |

**Contrato compartido:** cada etapa usa tool-use forzado con un discriminador
`status: "ok" | "needs_input"`; en `needs_input` la UI pausa la etapa, muestra la pregunta, el usuario
responde y la etapa se regenera con la respuesta añadida al contexto (persistida en
`ScriptClarification` y reinyectada en todas las etapas siguientes).

**Deltas que la web deberá añadir para cumplir este documento** (hoy el código no los tiene):

1. **Transcripción viral como insumo de primera clase con cruce factual.** Hoy `referenceScript` se
   usa solo como termómetro de estructura ("nunca como fuente de frases o ideas"). Falta implementar
   el **cruce factual y la regla de reconciliación** de la sección 2.2 (detectar datos, preguntar por
   los que no están en la investigación, priorizar la investigación en conflictos).
2. **Mandato de densidad de datos** (sección 4) en los prompts de E3 y E5.
3. **Voz omnisciente forzada** (sección 3) como estilo explícito en E2 y E5, con su lista de
   prohibiciones.
4. Cualquier otra diferencia entre este documento y los prompts actuales de `lib/scripts`.
