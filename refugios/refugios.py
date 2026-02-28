import json
import re
from difflib import SequenceMatcher

# Función para cambiar la estructura de center a location.coordinates
def cambiar_estructura_location():
    """Cambia center: {lat, lon} a location: {coordinates: {lat, lng}}"""
    # Lee el archivo JSON
    with open('refugios.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Procesa cada objeto
    for obj in data:
        # Si tiene center, cambiarlo a location.coordinates
        if 'center' in obj:
            center = obj['center']
            if 'lat' in center and 'lon' in center:
                # Crear nueva estructura location.coordinates
                obj['location'] = {
                    'coordinates': {
                        'lat': center['lat'],
                        'lng': center['lon']
                    }
                }
                # Eliminar el campo center
                del obj['center']
    
    # Guarda el archivo JSON modificado
    with open('refugios.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"Estructura cambiada en {len(data)} objetos.")


# Ejecutar la función
cambiar_estructura_location()


# Función para normalizar nombres y comparar similitud
def normalizar_nombre(nombre):
    """Normaliza un nombre para comparación eliminando prefijos comunes y normalizando espacios"""
    if not nombre:
        return ""
    # Convertir a minúsculas
    nombre = nombre.lower()
    # Eliminar prefijos comunes
    prefijos = ["refugio de", "refugio de la", "refugio del", "refugio de los", 
                "refugi de", "refugi de la", "refugi del", "refugi dels"]
    for prefijo in prefijos:
        if nombre.startswith(prefijo):
            nombre = nombre[len(prefijo):].strip()
    # Normalizar espacios múltiples
    nombre = re.sub(r'\s+', ' ', nombre).strip()
    return nombre


def nombres_similares(nombre1, nombre2, umbral=0.7):
    """Compara dos nombres y devuelve True si son similares"""
    norm1 = normalizar_nombre(nombre1)
    norm2 = normalizar_nombre(nombre2)
    
    # Si uno contiene al otro, son similares
    if norm1 in norm2 or norm2 in norm1:
        return True
    
    # Calcular similitud usando SequenceMatcher
    similitud = SequenceMatcher(None, norm1, norm2).ratio()
    return similitud >= umbral


# Función para añadir capacity y elevation desde refugios_2.json
def añadir_campos_desde_refugios2():
    """Lee refugios_2.json y añade capacity y elevation a refugios.json si coinciden los nombres"""
    # Lee refugios_2.json
    with open('refugios_2.json', 'r', encoding='utf-8') as f:
        refugios2 = json.load(f)
    
    # Lee refugios.json
    with open('refugios.json', 'r', encoding='utf-8') as f:
        refugios = json.load(f)
    
    actualizados = 0
    
    # Para cada objeto en refugios_2.json
    for obj2 in refugios2:
        nombre2 = obj2.get('name', '')
        if not nombre2:
            continue
        
        # Buscar coincidencia en refugios.json
        for obj in refugios:
            nombre = obj.get('name', '')
            if not nombre:
                continue
            
            # Si los nombres son similares
            if nombres_similares(nombre, nombre2):
                # Verificar si tiene capacity en tags y elevation al nivel raíz
                añadido = False
                
                # Asegurar que existe el objeto tags
                if 'tags' not in obj:
                    obj['tags'] = {}
                
                # Añadir capacity dentro de tags si no existe
                if 'capacity' not in obj['tags'] and 'capacity' in obj2:
                    obj['tags']['capacity'] = str(obj2['capacity'])
                    añadido = True
                
                # Añadir elevation al nivel raíz si no existe
                if 'elevation' not in obj and 'elevation' in obj2:
                    obj['elevation'] = str(obj2['elevation'])  # Convertir a string para consistencia
                    añadido = True
                
                if añadido:
                    actualizados += 1
                    print(f"Actualizado: {nombre} <- {nombre2}")
                break
    
    # Guarda el archivo JSON modificado
    with open('refugios.json', 'w', encoding='utf-8') as f:
        json.dump(refugios, f, ensure_ascii=False, indent=4)
    
    print(f"\nActualizados {actualizados} objetos con campos capacity y elevation.")


# Función para eliminar capacity del nivel raíz
def eliminar_capacity_raiz():
    """Elimina el campo capacity del nivel raíz, dejando solo el que está en tags"""
    # Lee refugios.json
    with open('refugios.json', 'r', encoding='utf-8') as f:
        refugios = json.load(f)
    
    eliminados = 0
    
    # Para cada objeto
    for obj in refugios:
        # Si tiene capacity al nivel raíz (no dentro de tags)
        if 'capacity' in obj and 'tags' in obj and 'capacity' not in obj['tags']:
            # Solo eliminar si no está en tags
            del obj['capacity']
            eliminados += 1
        elif 'capacity' in obj and 'tags' not in obj:
            # Si no tiene tags pero tiene capacity al nivel raíz, eliminarlo
            del obj['capacity']
            eliminados += 1
        elif 'capacity' in obj and 'tags' in obj and 'capacity' in obj['tags']:
            # Si tiene capacity tanto en raíz como en tags, eliminar el de raíz
            del obj['capacity']
            eliminados += 1
    
    # Guarda el archivo JSON modificado
    with open('refugios.json', 'w', encoding='utf-8') as f:
        json.dump(refugios, f, ensure_ascii=False, indent=4)
    
    print(f"Eliminados {eliminados} campos capacity del nivel raíz.")


# Ejecutar las funciones
eliminar_capacity_raiz()
