'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/axios';
import { getAssetUrl } from '@/lib/url-helper';

interface CreatePostWidgetProps {
  onPostCreated: () => void;
  userAvatar?: string | null;
  userName?: string;
}

export const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({
  onPostCreated,
  userAvatar,
  userName = 'You',
}) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CONTENT_LENGTH = 2200;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CONTENT_LENGTH) {
      setContent(text);
      setCharCount(text.length);
    }
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      setError(null);
      return;
    }

    const isImage = selectedFile.type.match(/image\/(jpg|jpeg|png|gif|webp)/);
    const isVideo = selectedFile.type.match(/video\/(mp4|quicktime|x-msvideo|x-matroska)/);

    if (!isImage && !isVideo) {
      setError('Only image and video files are allowed (JPG, PNG, GIF, WebP, MP4, MOV, AVI, MKV)');
      return;
    }

    const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let fileIds: string[] = [];

      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const uploadResponse = await api.post('/assets/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          fileIds = [uploadResponse.data.id];
          console.log('File uploaded successfully:', uploadResponse.data.id);
        } catch (uploadError) {
          console.error('Failed to upload file', uploadError);
          let errorMsg = 'Failed to upload image. Please try again.';
          if (uploadError instanceof Error && 'response' in uploadError) {
            const err = uploadError as { response?: { data?: { message?: string } } };
            errorMsg = err.response?.data?.message || errorMsg;
          }
          setError(errorMsg);
          setIsLoading(false);
          return;
        }
      }

      const postData = {
        content: content.trim(),
        ...(fileIds.length > 0 && { fileIds }),
      };

      const response = await api.post('/posts', postData);
      console.log('Post created successfully:', response.data);

      setContent('');
      setFile(null);
      setPreview(null);
      setCharCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (textareaRef.current) textareaRef.current.focus();

      onPostCreated();
    } catch (err) {
      console.error('Failed to create post:', err);
      let errorMsg = 'Failed to create post. Please try again.';
      if (err instanceof Error && 'response' in err) {
        const error = err as { response?: { data?: { message?: string } } };
        errorMsg = error.response?.data?.message || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUrl = userAvatar ? getAssetUrl(userAvatar) : null;

  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="p-5 flex gap-4">
          <div className="shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName}
                width={48}
                height={48}
                unoptimized
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="What's on your mind?"
              className="w-full text-lg resize-none focus:outline-none bg-transparent"
              style={{ color: 'var(--text-primary)' }}
              rows={3}
              maxLength={MAX_CONTENT_LENGTH}
            />
            <div
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {charCount}/{MAX_CONTENT_LENGTH}
            </div>
          </div>
        </div>

        {preview && (
          <div className="px-5 pb-4">
            <div className="relative rounded-lg overflow-hidden bg-black/5">
              <Image
                src={preview}
                alt="Preview"
                width={600}
                height={400}
                unoptimized
                className="w-full h-auto max-h-96 object-cover"
              />
              <button
                type="button"
                onClick={() => handleFileSelect(null)}
                className="absolute top-2 right-2 p-2 rounded-full"
                style={{ background: 'rgba(0,0,0,0.7)' }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            className="mx-5 p-3 rounded-lg text-sm"
            style={{
              background: 'rgba(255, 59, 48, 0.1)',
              color: 'var(--error)',
              border: '1px solid rgba(255, 59, 48, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        <div
          className="px-5 py-4 flex items-center justify-between border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{
              color: 'var(--accent)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'transparent';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-sm font-medium">Photo/Video</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
            accept="image/*,video/*"
          />

          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="px-6 py-2 rounded-full font-semibold text-sm transition-opacity disabled:opacity-50 flex items-center gap-2"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
          >
            {isLoading && (
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                }}
              />
            )}
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};
