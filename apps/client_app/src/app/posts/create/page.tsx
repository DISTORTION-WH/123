'use client';

import { useRouter } from 'next/navigation';
import { CreatePostWidget } from '@/components/feed/CreatePostWidget';
import { useAuth } from '@/context/AuthContext';

export default function CreatePostPage() {
  const router = useRouter();
  const { profile, user } = useAuth();

  const handlePostCreated = () => {
    // Redirect to feed after post creation
    router.push('/feed');
  };

  return (
    <div className="px-4 pb-16" style={{ color: 'var(--text-primary)' }}>
      <main className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Post</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Share your moment with the community
          </p>
        </div>

        <CreatePostWidget
          onPostCreated={handlePostCreated}
          userAvatar={profile?.avatarUrl}
          userName={profile?.displayName || user?.email || 'User'}
        />

        <div className="mt-8 p-6 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4">Tips for great posts:</h2>
          <ul className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>✨ Use clear, well-lit photos or videos</li>
            <li>📝 Write engaging captions (up to 2200 characters)</li>
            <li>🎬 Support videos: MP4, MOV, AVI, MKV (up to 500MB)</li>
            <li>🖼️ Support images: JPG, PNG, GIF, WebP (up to 50MB)</li>
            <li>⏰ Post consistently to grow your audience</li>
            <li>💬 Engage with comments to build community</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
