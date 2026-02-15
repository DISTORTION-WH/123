
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  profile: {
    username: string;
    avatarUrl: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get(`/comments/post/${postId}`);
      setComments(res.data.data);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/comments', { postId, content: text });
      const newComment: Comment = res.data;
      setComments((prev) => [...prev, newComment]);
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mt-3 pt-3 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-h-60 overflow-y-auto space-y-3 mb-3 pr-2 scrollbar-thin">
        {comments.length === 0 && (
          <p
            className="text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            No comments yet
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm flex gap-2 items-start">
            <Avatar
              src={comment.profile.avatarUrl}
              alt={comment.profile.username}
              size="sm"
              className="w-6 h-6 shrink-0 mt-0.5"
            />
            <div>
              <span
                className="font-bold mr-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {comment.profile.username}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {comment.content}
              </span>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="text-sm font-bold disabled:opacity-50 transition-opacity"
          style={{ color: 'var(--accent)' }}
        >
          Post
        </button>
      </form>
    </div>
  );
};
