# Генерация превью для видео

## Описание

Приложение автоматически генерирует превью (thumbnail) для видеофайлов при их загрузке. Превью извлекается на отметке 1 секунда от начала видео.

## Требования

- FFmpeg должен быть установлен и доступен в PATH

### Установка FFmpeg

**Windows (через Chocolatey):**
```bash
choco install ffmpeg
```

**Windows (через scoop):**
```bash
scoop install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

## Генерация превью для существующих видео

Если у вас уже есть видеофайлы в БД без превью, можно сгенерировать их:

```bash
cd apps/core_microservice
npm run thumbnails:generate
```

Скрипт будет:
1. Найти все видеофайлы без `thumbnailPath` в БД
2. Сгенерировать превью для каждого видео
3. Сохранить путь к превью в БД

## Поддерживаемые форматы видео

- MP4 (video/mp4)
- WebM (video/webm)
- MOV (video/quicktime)
- AVI (video/x-msvideo)
- MKV (video/x-matroska)

## Как работает

### При загрузке нового видео

1. Файл загружается через API POST `/assets/upload`
2. AssetsService проверяет, является ли файл видео
3. Если это видео, AssetsService запускает ffmpeg для генерации превью
4. Превью сохраняется с именем `{videofilename}_thumb.jpg`
5. Путь к превью сохраняется в БД поля `Asset.thumbnailPath`

### При отображении в профиле

1. PostsGrid проверяет наличие `thumbnailPath` у видео
2. Если превью есть - отображает изображение с иконкой видео
3. Если превью нет - показывает темный градиентный фон с иконкой видео

## Место хранения файлов

- Видео: `/apps/core_microservice/uploads/{filename}.{ext}`
- Превью: `/apps/core_microservice/uploads/{filename}_thumb.jpg`

Оба типа файлов доступны через API эндпоинт `/assets/{filename}`
