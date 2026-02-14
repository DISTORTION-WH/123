'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { ExploreBar } from '@/components/ExploreBar';
import Link from 'next/link';

interface SearchResult {
  username: string;
  displayName?: string;
}

export default function CreateChatPage() {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [chatName, setChatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatType, setChatType] = useState<'private' | 'group'>('private');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.get('/profiles/search', {
        params: { query },
      });
      setSearchResults(res.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const toggleUserSelection = (username: string) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleCreateChat = async () => {
    if (chatType === 'private' && selectedUsers.length !== 1) {
      alert('Select exactly one user for private chat');
      return;
    }

    if (chatType === 'group' && selectedUsers.length === 0) {
      alert('Select at least one user for group chat');
      return;
    }

    setLoading(true);
    try {
      let response;

      if (chatType === 'private') {
        response = await api.post('/chats', {
          type: 'private',
          targetUsername: selectedUsers[0],
        });
      } else {
        response = await api.post('/chats', {
          type: 'group',
          name: chatName || 'New Group',
          participantUsernames: selectedUsers,
        });
      }

      // Redirect to chat
      router.push(`/chat?chatId=${response.data.id}`);
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        alert(err.response?.data?.message || 'Failed to create chat');
      } else {
        alert('Failed to create chat');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
      <ExploreBar />
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="mb-8">
          <Link href="/chat" className="text-[var(--accent)] hover:underline flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Chat
          </Link>
        </div>

        <div
          className="rounded-lg p-8"
          style={{ background: 'var(--bg-card)' }}
        >
          <h1 className="text-3xl font-bold mb-8">Start a Conversation</h1>

          {/* Chat Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-4">Chat Type</label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setChatType('private');
                  setSelectedUsers([]);
                  setChatName('');
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-semibold ${
                  chatType === 'private'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                Private Chat
              </button>
              <button
                onClick={() => {
                  setChatType('group');
                  setSelectedUsers([]);
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-semibold ${
                  chatType === 'group'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                Group Chat
              </button>
            </div>
          </div>

          {/* Group Name Input */}
          {chatType === 'group' && (
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2">Group Name</label>
              <input
                type="text"
                placeholder="Enter group name..."
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          )}

          {/* Search Users */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">
              {chatType === 'private' ? 'Select User' : 'Add Users'}
            </label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />

            {/* Search Results */}
            {searchQuery && (
              <div className="mt-4 max-h-64 overflow-y-auto border border-[var(--border)] rounded-lg bg-[var(--bg-input)]">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.username}
                      onClick={() => toggleUserSelection(user.username)}
                      className={`w-full text-left px-4 py-3 border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)] ${
                        selectedUsers.includes(user.username)
                          ? 'bg-[var(--accent)]/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.username)}
                          readOnly
                          className="w-4 h-4 accent-[var(--accent)]"
                        />
                        <div>
                          <p className="font-semibold">{user.displayName || user.username}</p>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2">
                Selected ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((username) => (
                  <div
                    key={username}
                    className="px-3 py-1 bg-[var(--accent)] text-white rounded-full flex items-center gap-2"
                  >
                    {username}
                    <button
                      onClick={() => toggleUserSelection(username)}
                      className="hover:opacity-70"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreateChat}
            disabled={loading || selectedUsers.length === 0}
            className="w-full px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Creating...' : 'Create Chat'}
          </button>
        </div>
      </main>
    </div>
  );
}
