#!/usr/bin/env bash

# Carpeta de destino principal
MUSIC_DIR="/c/Users/Flavio/Desktop/Music"

# Carpeta de destino secundaria (en D:)
DEST_DIR="/d"

# Carpeta de destino secundaria (en E:)
DEST_DIR_1="/e"

# Crear las carpetas si no existen
mkdir -p "$MUSIC_DIR"
mkdir -p "$DEST_DIR"
mkdir -p "$DEST_DIR_1"

# Descargar toda la lista de reproducción como MP3
/c/Python312/python.exe -m yt_dlp -x --audio-format mp3 \
  --yes-playlist \
  -o "$MUSIC_DIR/%(playlist_index)s - %(title)s.%(ext)s" "$1"

# Copiar todo el contenido a D: y E:
cp -r "$MUSIC_DIR/"* "$DEST_DIR/"
cp -r "$MUSIC_DIR/"* "$DEST_DIR_1/"
#!/usr/bin/env bash

# Carpeta de destino principal
MUSIC_DIR="/c/Users/Flavio/Desktop/Music"

# Carpeta de destino secundaria (en D:)
DEST_DIR="/d"

# Carpeta de destino secundaria (en E:)
DEST_DIR_1="/e"

# Crear las carpetas si no existen
mkdir -p "$MUSIC_DIR"
mkdir -p "$DEST_DIR"
mkdir -p "$DEST_DIR_1"

# Descargar toda la lista de reproducción como MP3
/c/Python312/python.exe -m yt_dlp -x --audio-format mp3 \
  --yes-playlist \
  -o "$MUSIC_DIR/%(playlist_index)s - %(title)s.%(ext)s" "$1"

# Copiar todo el contenido a D: y E:
cp -r "$MUSIC_DIR/"* "$DEST_DIR/"
cp -r "$MUSIC_DIR/"* "$DEST_DIR_1/"
