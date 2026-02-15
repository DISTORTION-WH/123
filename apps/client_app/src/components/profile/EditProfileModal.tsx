'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { getAvatarUrl } from '@/lib/url-helper';
import { Profile } from '@/types';

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: () => void;
}

interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  isPublic?: boolean;
  avatarId?: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  onClose,
  onUpdate,
}) => {
  const [displayName, setDisplayName] = useState(
    profile.displayName || '',
  );
  const [bio, setBio] = useState(profile.bio || '');
  const [isPublic, setIsPublic] = useState(profile.isPublic ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    getAvatarUrl(profile.avatarUrl),
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        console.log('Uploading avatar file:', selectedFile.name, selectedFile.size);
        const avatarRes = await api.patch('/profiles/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('Avatar upload response:', avatarRes.data);
        console.log('Avatar URL from response:', avatarRes.data.avatarUrl);
      }

      const updateData: UpdateProfileDto = {
        displayName,
        bio,
        isPublic,
      };

      console.log('Updating profile data:', updateData);
      const profileRes = await api.patch('/profiles/me', updateData);
      console.log('Profile update response:', profileRes.data);
      console.log('Updated avatarUrl:', profileRes.data.avatarUrl);

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMsg =
        axiosError.response?.data?.message ||
        (axiosError.message ? axiosError.message : 'Failed to update profile. Please try again.');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="flex justify-between items-center p-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <h3
            className="font-bold text-base"
            style={{ color: 'var(--text-primary)' }}
          >
            Edit Profile
          </h3>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="text-sm font-bold transition-colors disabled:opacity-50"
            style={{ color: 'var(--accent)' }}
          >
            {isLoading ? 'Saving...' : 'Done'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
              style={{
                background: 'var(--bg-elevated)',
                border: '2px solid var(--border)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Avatar preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {profile.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Change Profile Photo
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-lg px-3 py-2.5 text-sm transition-colors"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="Your display name"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-lg px-3 py-2.5 h-24 resize-none text-sm transition-colors"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="Tell something about yourself..."
              maxLength={150}
            />
            <div
              className="text-right text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {bio.length}/150
            </div>
          </div>

          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Public Profile
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Anyone can see your posts
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{
                background: isPublic
                  ? 'var(--accent)'
                  : 'var(--bg-elevated)',
              }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                style={{
                  background: 'white',
                  transform: isPublic
                    ? 'translateX(22px)'
                    : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {error && (
            <div
              className="p-3 text-sm rounded-lg"
              style={{
                background: 'rgba(255, 59, 48, 0.1)',
                color: 'var(--error)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
            disabled={isLoading}
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
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};
