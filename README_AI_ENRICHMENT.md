# Configuración de Enriquecimiento con IA

Este proyecto incluye funcionalidad para enriquecer automáticamente los metadatos de rutas GPX usando inteligencia artificial. La IA busca información real en internet sobre las rutas y genera metadatos completos.

## Proveedores Soportados

### 1. OpenAI (Recomendado)

OpenAI ofrece modelos como GPT-4o-mini que son ideales para esta tarea.

**Configuración:**

1. Obtén tu API key en [OpenAI Platform](https://platform.openai.com/api-keys)
2. Agrega a tu `.env.local`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-tu-api-key-aqui
AI_MODEL=gpt-4o-mini
```

**Modelos disponibles:**
- `gpt-4o-mini` (recomendado, más económico)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### 2. Anthropic Claude

Claude de Anthropic también funciona muy bien para esta tarea.

**Configuración:**

1. Obtén tu API key en [Anthropic Console](https://console.anthropic.com/)
2. Agrega a tu `.env.local`:

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-tu-api-key-aqui
AI_MODEL=claude-3-haiku-20240307
```

**Modelos disponibles:**
- `claude-3-haiku-20240307` (recomendado, más económico)
- `claude-3-sonnet-20240229`
- `claude-3-opus-20240229`

### 3. Google Gemini (Recomendado para costos)

Google Gemini ofrece modelos muy económicos y eficientes, ideal para esta tarea.

**Configuración:**

1. Obtén tu API key en [Google AI Studio](https://makersuite.google.com/app/apikey) o [Google Cloud Console](https://console.cloud.google.com/)
2. Agrega a tu `.env.local`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=tu-api-key-de-gemini-aqui
AI_MODEL=gemini-pro
```

**Modelos disponibles:**
- `gemini-pro` (recomendado, modelo estándar más compatible)
- `gemini-1.5-flash` (requiere acceso a v1 API, más económico y rápido)
- `gemini-1.5-pro` (requiere acceso a v1 API, más potente)

**Nota:** Los modelos `gemini-1.5-*` pueden requerir acceso especial o estar disponibles solo en la versión v1 de la API. Si obtienes un error 404, usa `gemini-pro` que es el modelo más compatible.

**Ventajas de Gemini:**
- Muy económico (gratis hasta cierto límite)
- Respuestas rápidas
- Buen soporte para JSON estructurado
- API key fácil de obtener

### 4. Modo Fallback (Sin IA)

Si no configuras ninguna API key, el sistema usará datos simulados basados en palabras clave del título de la ruta. Esto es útil para desarrollo o si no quieres usar IA.

## Cómo Funciona

1. **Subes un archivo GPX** en `/admin/`
2. El sistema **parsea el GPX** y extrae datos básicos (distancia, elevación, coordenadas)
3. Si está configurada una API de IA:
   - Se envía el **título de la ruta** a la IA
   - La IA **busca información real** en internet sobre la ruta
   - Genera metadatos completos: dificultad, duración, ubicación, consejos, etc.
4. Si no hay API configurada o falla:
   - Se usan **datos simulados** como fallback
5. Los **metadatos enriquecidos** se cargan automáticamente en el formulario

## Estructura de Metadatos Generados

La IA genera un objeto JSON con:

- `type`: Tipo de ruta (trekking o ferrata)
- `summary`: Descripción breve
- `difficulty`: Dificultad (Fácil, Moderada, Difícil, Muy Difícil, Extrema)
- `duration`: Duración estimada
- `location`: Región y provincia
- `approach`: Información sobre cómo llegar
- `food`: Información sobre comida/restaurantes
- `orientation`: Información sobre señalización
- `bestSeason`: Mejores épocas para hacerla
- `safetyTips`: Consejos de seguridad
- `storytelling`: Texto narrativo en markdown
- `seo`: Metadatos SEO

## Costos Aproximados

### OpenAI GPT-4o-mini
- ~$0.15 por 1M tokens de entrada
- ~$0.60 por 1M tokens de salida
- Por ruta: ~$0.001-0.005 (muy económico)

### Anthropic Claude Haiku
- ~$0.25 por 1M tokens de entrada
- ~$1.25 por 1M tokens de salida
- Por ruta: ~$0.002-0.008

### Google Gemini Pro
- **Gratis** hasta cierto límite de uso
- Muy económico después del límite gratuito
- Por ruta: ~$0.001-0.003 (muy económico)
- **Recomendado** para uso frecuente por su excelente relación calidad/precio y compatibilidad

### Google Gemini 1.5 Flash (si está disponible)
- Requiere acceso a v1 API
- Más económico y rápido que gemini-pro
- Por ruta: ~$0.0005-0.002

## Troubleshooting

### Error: "AI_API_KEY no está configurada"
- Verifica que hayas agregado la variable de entorno en `.env.local`
- Reinicia el servidor de desarrollo después de agregar variables de entorno
- Asegúrate de que el nombre de la variable sea correcto:
  - `OPENAI_API_KEY` para OpenAI
  - `GEMINI_API_KEY` para Gemini
  - `AI_API_KEY` para Anthropic u otros proveedores

### Error: "Error en API de OpenAI/Anthropic/Gemini"
- Verifica que tu API key sea válida
- Verifica que tengas créditos disponibles en tu cuenta (si aplica)
- Para Gemini: verifica que hayas habilitado la API en Google Cloud Console
- Revisa los logs del servidor para más detalles del error

### La IA devuelve datos incorrectos
- El sistema usa fallback automáticamente si la IA falla
- Puedes editar manualmente los metadatos en el formulario después de cargarlos
- Considera ajustar el prompt en `lib/aiEnrichment.ts` si necesitas resultados más específicos

## Personalización

Puedes personalizar los prompts de la IA editando las funciones `callOpenAI`, `callAnthropic` o `callGemini` en `lib/aiEnrichment.ts`. Los prompts actuales están optimizados para buscar información sobre rutas de senderismo en España.

## Comparación de Proveedores

| Proveedor | Costo | Velocidad | Calidad | Recomendado para |
|-----------|-------|-----------|---------|------------------|
| **Gemini 1.5 Flash** | ⭐⭐⭐⭐⭐ Muy bajo | ⭐⭐⭐⭐⭐ Muy rápido | ⭐⭐⭐⭐ Buena | Uso frecuente, presupuesto limitado |
| **OpenAI GPT-4o-mini** | ⭐⭐⭐⭐ Bajo | ⭐⭐⭐⭐ Rápido | ⭐⭐⭐⭐⭐ Excelente | Balance calidad/precio |
| **Anthropic Claude** | ⭐⭐⭐ Medio | ⭐⭐⭐ Medio | ⭐⭐⭐⭐⭐ Excelente | Máxima calidad |

