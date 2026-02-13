// apps/client_app/src/components/feed/CommentSection.tsx

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { getAssetUrl } from '@/lib/url-helper';
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

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/post/${postId}`);
      // Бэкенд возвращает { data: [...], meta: ... }
      setComments(res.data.data);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      await api.post('/comments', { postId, content: text });
      setText('');
      await fetchComments(); // Перезагружаем список
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t">
      {/* Список комментариев */}
      <div className="max-h-60 overflow-y-auto space-y-3 mb-3 pr-2 scrollbar-thin">
        {comments.length === 0 && <p className="text-xs text-gray-400 text-center">No comments yet</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm flex gap-2 items-start">
             <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-0.5">
                {comment.profile.avatarUrl && (
                  <img
                    src={getAssetUrl(comment.profile.avatarUrl) || ''}
                    className="w-full h-full object-cover"
                    alt={comment.profile.username}
                  />
                )}
             </div>
             <div>
                <span className="font-bold mr-2 text-gray-800">{comment.profile.username}</span>
                <span className="text-gray-700">{comment.content}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
             </div>
          </div>
        ))}
      </div>

      {/* Форма отправки */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-sm border bg-gray-50 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          disabled={!text.trim() || loading} 
          className="text-blue-500 text-sm font-bold disabled:opacity-50 hover:text-blue-600"
        >
          Post
        </button>
      </form>
    </div>
  );
};