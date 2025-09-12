# Discord Components V2 Limitaciones

## Activación y mezcla prohibida

- Para usar V2 hay que marcar el mensaje con el flag `IS_COMPONENTS_V2` (`1 << 15`). En Pycord esto se activa solo si tu `View` contiene componentes V2; si no, puedes ajustarlo en `MessageFlags`.
- No puedes mezclar V2 con `content`, `embeds`, `stickers`, `poll` ni `files[n]`. Si incluyes cualquiera de esos campos al enviar/editar con V2, la petición falla (Pycord incluso lanza `TypeError`).
- Cuando editas un mensaje ya “opt-in” a V2, no puedes “volver” a la versión legacy; hay que seguir editándolo como V2 (o entrar a V2 en una edición poniendo `content/embeds/poll/stickers` a `null`).

## Límites duros (Discord + Pycord)

- Hasta 40 componentes totales por mensaje (cuentan los anidados). Pycord también limita a 40 items por `View`.
- Texto total en todos los `TextDisplay` de un mensaje: máx. 4000 caracteres.
- `MediaGallery`: hasta 10 items.
- Una sola View por mensaje (limitación global de Discord).

## Layout y jerarquía

- Componentes V2 soportados: `Container`, `Section`, `TextDisplay`, `Thumbnail`, `MediaGallery`, `File`, `Separator`. Se pueden usar `ActionRow`, `Button` y `Select` (legacy) dentro del layout V2.
- `Container` solo puede contener: `ActionRow`, `TextDisplay`, `Section`, `MediaGallery`, `Separator`, `File`.
- `Section` solo admite `TextDisplay` dentro y requiere un “accessory” (a la derecha), que debe ser un `Button` o un `Thumbnail`.
- `Thumbnail` hoy se usa como accessory en `Section` (imágenes; GIFs animados compatibles).
- `File` (V2) muestra un archivo descargable. Su `url` debe ser un `attachment://...` que referencie un `discord.ui.File` adjuntado en el envío.

## Filas y compatibilidad con legacy

- Si usas `ActionRow` + botones/selects (legacy): siguen las reglas clásicas → máx. 5 filas, cada fila tiene 5 “slots”; un select ocupa la fila completa. El parámetro `row` (0–4) solo aplica a estos componentes legacy.
- Los items V2 usan una grilla distinta: el `row` de `Item` admite 0–39 (40 filas virtuales), y Pycord gestiona el layout dentro de `Container/Section`.

## Interacciones, tiempo y persistencia

- Debes acknowledge la interacción en ≤ 3 s (responder o `defer()`), o falla.
- Persistencia (que los botones sigan vivos tras reiniciar el bot):
  - Pon `timeout=None` en la `View`.
  - Todos los items interactivos deben tener `custom_id` fijo.
  - Registra la view al iniciar: `bot.add_view(MyView())`.

## Otras restricciones

- Sin audio; sin “URL unfurl”; sin “text preview” automático.

