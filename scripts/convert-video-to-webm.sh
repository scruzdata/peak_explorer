#!/bin/bash

# Script para convertir video MP4 a WebM optimizado
# Uso: ./scripts/convert-video-to-webm.sh [archivo_entrada.mp4] [archivo_salida.webm]

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si FFmpeg está instalado
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ FFmpeg no está instalado.${NC}"
    echo ""
    echo "Instala FFmpeg con uno de estos comandos:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Windows: Descarga desde https://ffmpeg.org/download.html"
    exit 1
fi

# Archivos por defecto
INPUT_FILE="${1:-public/Animate_the_clouds_202511141732.mp4}"
OUTPUT_FILE="${2:-public/Animate_the_clouds_202511141732.webm}"

# Verificar que el archivo de entrada existe
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ El archivo de entrada no existe: $INPUT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}🎬 Convirtiendo video a WebM optimizado...${NC}"
echo ""
echo "Archivo de entrada: $INPUT_FILE"
echo "Archivo de salida: $OUTPUT_FILE"
echo ""

# Convertir a WebM con configuración optimizada para web
# -c:v libvpx-vp9: Usa VP9 codec (mejor compresión que VP8)
# -crf 30: Calidad (18-63, menor = mejor calidad pero más tamaño, 30 es buen balance)
# -b:v 0: Bitrate variable basado en CRF
# -c:a libopus: Codec de audio Opus (mejor que Vorbis)
# -b:a 128k: Bitrate de audio
# -vf scale=-2:720: Escala a 720p manteniendo aspect ratio (ajusta según necesites)
# -threads 4: Usa 4 threads para acelerar conversión
# -an: Sin audio (si el video original no tiene audio o no lo necesitas)

ffmpeg -i "$INPUT_FILE" \
  -c:v libvpx-vp9 \
  -crf 30 \
  -b:v 0 \
  -c:a libopus \
  -b:a 128k \
  -vf "scale=-2:720" \
  -threads 4 \
  -speed 4 \
  -tile-columns 2 \
  -frame-parallel 1 \
  -an \
  "$OUTPUT_FILE" \
  -y

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Conversión completada exitosamente!${NC}"
    echo ""
    
    # Mostrar información de los archivos
    INPUT_SIZE=$(du -h "$INPUT_FILE" | cut -f1)
    OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    
    echo "Tamaño original (MP4): $INPUT_SIZE"
    echo "Tamaño optimizado (WebM): $OUTPUT_SIZE"
    echo ""
    echo -e "${YELLOW}💡 Nota: Si quieres ajustar la calidad, modifica el parámetro -crf${NC}"
    echo "   - crf 18-23: Alta calidad (archivos más grandes)"
    echo "   - crf 24-30: Calidad media (recomendado para web)"
    echo "   - crf 31-40: Calidad baja (archivos más pequeños)"
    echo ""
    echo -e "${YELLOW}💡 Para cambiar la resolución, modifica: -vf \"scale=-2:720\"${NC}"
    echo "   - scale=-2:1080 para Full HD"
    echo "   - scale=-2:720 para HD (recomendado)"
    echo "   - scale=-2:480 para SD"
else
    echo ""
    echo -e "${RED}❌ Error durante la conversión${NC}"
    exit 1
fi
