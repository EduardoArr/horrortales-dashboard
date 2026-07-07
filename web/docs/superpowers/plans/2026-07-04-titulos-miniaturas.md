# Generador de títulos y miniaturas — Plan de implementación

Ver `web/docs/superpowers/specs/2026-07-04-titulos-miniaturas-design.md` para el contexto y las
decisiones. Este documento es la secuencia concreta de trabajo.

## 0. Arreglo previo: `Outlier.thumbnailUrl`

- `lib/discovery/youtubeClient.ts`: añadir `snippet.thumbnails` a `VideosListResponse`, extraer el
  mapeo de cada item de `videos.list` a una función `mapVideoItem()` (mirror de
  `mapChannelItem()`), con fallback `high → medium → default → null`.
- `lib/outliers.ts`: añadir `thumbnailUrl: string | null` a `Video` y `OutlierResult`.
- `lib/discovery/scoreChannels.ts`: añadir `thumbnailUrl: result.thumbnailUrl` a los bloques
  `create` y `update` del upsert. Las filas existentes se autocorrigen en el próximo refresco
  (`lastCheckedAt` ordena el refresco), no hace falta backfill manual.
- Actualizar `lib/discovery/__fixtures__/videos.json` y el helper `makeVideo` de
  `lib/outliers.test.ts` con el nuevo campo.
- Nuevo `lib/discovery/youtubeClient.test.ts` para la cadena de fallback del thumbnail.
- No requiere migración: el campo `Outlier.thumbnailUrl String?` ya existe desde el schema inicial.

## 1. Modelo de datos (Prisma)

```prisma
enum ThumbnailIdeaStatus {
  DRAFT
  FINAL
}

enum HostFeaturePreference {
  NONE
  HOST_1
  HOST_2
  BOTH
}

model HostPhoto {
  id               String   @id @default(cuid())
  hostLabel        String
  blobUrl          String
  blobPathname     String
  originalFilename String?
  contentType      String
  sizeBytes        Int
  notes            String?
  uploadedAt       DateTime @default(now())
  uploadedById     String?
  uploadedBy       User?    @relation("HostPhotoUploadedBy", fields: [uploadedById], references: [id])

  @@index([hostLabel])
}

model ThumbnailIdea {
  id                   String                @id @default(cuid())
  sourceOutlierId      String?
  sourceOutlier        Outlier?              @relation(fields: [sourceOutlierId], references: [id])
  freeformIdea         String?
  referenceOutliers    Outlier[]             @relation("ThumbnailIdeaReferences")
  requestedHostFeature HostFeaturePreference @default(NONE)

  angleCandidates      Json
  chosenAngle          String
  referenceAnalysis    Json?
  titleCandidates      Json
  chosenTitle          String
  thumbnailConcept     Json
  imagePrompt          String

  status               ThumbnailIdeaStatus   @default(DRAFT)
  notes                String?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  createdById          String?
  createdBy            User?                 @relation("ThumbnailIdeaCreatedBy", fields: [createdById], references: [id])

  @@index([status, createdAt])
  @@index([sourceOutlierId])
}

// en Outlier:
//   thumbnailIdeas    ThumbnailIdea[]
//   referencedInIdeas ThumbnailIdea[] @relation("ThumbnailIdeaReferences")
// en User:
//   hostPhotosUploaded    HostPhoto[]     @relation("HostPhotoUploadedBy")
//   thumbnailIdeasCreated ThumbnailIdea[] @relation("ThumbnailIdeaCreatedBy")
```

Ver el spec para el razonamiento de por qué `Json` para las secciones generadas y por qué
`referenceOutliers` es m:n implícita en vez de una tabla intermedia.

## 2. `lib/thumbnails/` — integración con Anthropic

```
lib/thumbnails/
  types.ts              # ThumbnailIdeaGenerationOutput y sub-interfaces
  config.ts              # ANTHROPIC_MODEL (default "claude-sonnet-5"), MAX_TOKENS
  promptBuilder.ts        # PURO — system prompt, messages[], schema de la tool forzada
  responseParser.ts       # PURO — valida tool_use.input, lanza error descriptivo si no calza
  anthropicClient.ts       # IMPURO — isMock()/loadFixture() (mirror de youtubeClient.ts), @anthropic-ai/sdk
  promptBuilder.test.ts
  responseParser.test.ts
  __fixtures__/generateThumbnailIdea.json
```

Contrato de tipos:

```ts
export interface AngleCandidate { angle: string; whyItWorks: string; recommended: boolean }
export interface ReferenceAnalysis {
  outlierId: string; mainPromise: string; emotion: string; dominantVisual: string;
  whatIsShown: string; whatIsHidden: string; repeatingPattern: string;
}
export interface TitleCandidate { title: string; triggerNote: string; ctrRank: number; isTopThree: boolean }
export interface ThumbnailConcept {
  mainVisualElement: string; facialExpression: string | null; colorContrastNote: string;
  withheldInfo: string; complementRuleNote: string; textOptions: string[]; // exactamente 5
}
export interface ThumbnailIdeaGenerationOutput {
  angleCandidates: AngleCandidate[];       // exactamente 5
  chosenAngle: string;
  referenceAnalysis: ReferenceAnalysis[] | null;
  titleCandidates: TitleCandidate[];       // exactamente 10
  chosenTitle: string;
  thumbnailConcept: ThumbnailConcept;
  imagePrompt: string;
}

export async function generateThumbnailIdea(input: BuildPromptInput): Promise<ThumbnailIdeaGenerationOutput>
```

Salida estructurada vía tool-use forzado (`tool_choice: {type:"tool", name:...}`) con
`strict: true`. Imágenes de referencia como bloque `{"type":"image","source":{"type":"url","url":...}}`.
Modelo por defecto `claude-sonnet-5`, configurable por env.

## 3. Fotos de los presentadores (Vercel Blob)

- `lib/hostPhotos/blobClient.ts`: único módulo que importa `@vercel/blob` (`put()`/`del()`).
- Subida por server action con `FormData`, sin `@vercel/blob/client` (fotos pequeñas, muy por
  debajo del límite de Server Actions).
- Prerrequisito: `vercel link` (el proyecto nunca se enlazó) + crear el store de Blob desde el
  dashboard de Vercel → `BLOB_READ_WRITE_TOKEN`.

## 4. UI y rutas

```
app/(dashboard)/titulos-miniaturas/
  page.tsx              # lista de ThumbnailIdea + botones "Nueva idea" / "Fotos"
  nuevo/
    page.tsx             # server: si ?outlierId=, prefill; si no, formulario libre
    NewIdeaForm.tsx        # client: idea, buscador de referencias (0-3), select HostFeaturePreference
    actions.ts             # createThumbnailIdea(input)
  [id]/
    page.tsx              # detalle generado
    ResultView.tsx          # client: edición, copiar prompt, recordatorio test 5 personas, toggle estado
    actions.ts              # updateThumbnailIdea, setThumbnailIdeaStatus
  fotos/
    page.tsx               # galería + subida
    UploadForm.tsx
    actions.ts              # uploadHostPhoto, deleteHostPhoto
```

Server actions siguen el patrón de `app/(dashboard)/outliers/actions.ts` (`"use server"`,
`await auth()` → throw si no hay sesión, `revalidatePath`, sin try/catch).

Entrada desde outliers: botón "Generar título y miniatura" en `OutlierTable.tsx` para filas
`SAVED`/`USED`, enlace a `/titulos-miniaturas/nuevo?outlierId=...`.

## 5. Variables de entorno nuevas

```
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL="claude-sonnet-5"
ANTHROPIC_MOCK="false"
BLOB_READ_WRITE_TOKEN=
```

## Secuencia

1. Este documento + el spec (hecho).
2. Arreglo de `Outlier.thumbnailUrl` + tests.
3. `npm install @anthropic-ai/sdk @vercel/blob`.
4. Conseguir `ANTHROPIC_API_KEY` + `vercel link` + Blob store → `BLOB_READ_WRITE_TOKEN`.
5. Prisma: modelos/enums + migración.
6. `lib/thumbnails/*` + fixtures + tests.
7. `lib/hostPhotos/blobClient.ts`.
8. `titulos-miniaturas/fotos/`.
9. `titulos-miniaturas/nuevo/`.
10. `titulos-miniaturas/[id]/`.
11. `titulos-miniaturas/page.tsx`.
12. Botón en `OutlierTable.tsx`.
13. `npx tsc --noEmit` + `npx vitest run`.

## Verificación

- Unitario: `promptBuilder.test.ts`, `responseParser.test.ts`, `youtubeClient.test.ts` (fallback
  de thumbnail).
- Integración manual una vez: llamada real a `generateThumbnailIdea` (`ANTHROPIC_MOCK=false`);
  subida/borrado real contra Vercel Blob.
- UI end-to-end: outlier `SAVED`/`USED` → generar → editar → marcar Final; subir/ver/borrar fotos.
