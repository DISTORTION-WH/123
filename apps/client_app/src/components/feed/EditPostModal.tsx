'use client';

import React, { useState } from 'react';
import { Post } from '@/types';
import { api } from '@/lib/axios';
import { Modal } from '@/components/ui/Modal';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPost: Post) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
}) => {
  const [content, setContent] = useState(post.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    if (content.length > 2200) {
      setError('Content too long (max 2200 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.patch(`/posts/${post.id}`, {
        content: content.trim(),
      });

      onSave(res.data);
      onClose();
    } catch (err) {
      console.error('Failed to update post:', err);
      setError('Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Post">
      <div className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 rounded-lg resize-none focus:outline-none"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            minHeight: '120px',
          }}
        />

        <div className="flex justify-between items-center">
          <span
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {content.length}/2200
          </span>
          {error && (
            <span className="text-xs" style={{ color: 'var(--error)' }}>
              {error}
            </span>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
