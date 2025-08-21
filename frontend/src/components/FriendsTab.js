import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageCircle, Flame, Trophy, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function FriendsTab() {
  const [friends, setFriends] = useState([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (e) => {
    e.preventDefault();
    if (!newFriendEmail.trim()) return;

    setAddingFriend(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newFriendEmail }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.friend_name} added as friend! 🎉`);
        setNewFriendEmail('');
        setShowAddForm(false);
        loadFriends(); // Reload friends list
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add friend');
      }
    } catch (error) {
      toast.error('Failed to add friend');
    } finally {
      setAddingFriend(false);
    }
  };

  const sendEncouragement = (friendName) => {
    const messages = [
      `🔥 Keep crushing it, ${friendName}!`,
      `💪 You're doing amazing, ${friendName}!`,
      `⚡ Your dedication inspires me, ${friendName}!`,
      `🏆 Legend in the making, ${friendName}!`,
      `🌟 You've got this, ${friendName}!`,
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    toast.success(`Encouragement sent: "${randomMessage}"`);
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '💪';
    return '🌱';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <Users className="w-12 h-12 text-primary-600 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
        <p className="text-gray-600 mt-1">Share your fitness journey</p>
      </div>

      {/* Add Friend Section */}
      <div className="card">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Friend</span>
          </button>
        ) : (
          <form onSubmit={addFriend} className="space-y-4">
            <div>
              <label htmlFor="friendEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Friend's Email
              </label>
              <input
                id="friendEmail"
                type="email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                className="input-field"
                placeholder="Enter friend's email address"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={addingFriend}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                {addingFriend ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Add</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewFriendEmail('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Friends List */}
      <div className="space-y-4">
        {friends.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 px-2">
              Your Fitness Buddies ({friends.length})
            </h2>
            {friends.map((friend) => (
              <div key={friend.id} className="friend-card card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                      <p className="text-sm text-gray-600">Fitness Buddy</p>
                    </div>
                  </div>
                  <div className="text-2xl">
                    {getStreakEmoji(friend.current_streak)}
                  </div>
                </div>

                {/* Streak Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Flame className="w-4 h-4 text-streak-fire" />
                      <span className="text-xl font-bold text-streak-fire">
                        {friend.current_streak}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Current</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-xl font-bold text-yellow-600">
                        {friend.longest_streak}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Best</p>
                  </div>
                </div>

                {/* Encouragement Section */}
                <div className="space-y-2">
                  <button
                    onClick={() => sendEncouragement(friend.name)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Encouragement</span>
                  </button>
                  
                  {friend.current_streak > 0 && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        🔥 {friend.name} is on fire with a {friend.current_streak}-day streak!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="card text-center py-8">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No friends yet</h3>
            <p className="text-gray-600 mb-4">
              Add friends to share your fitness journey and stay motivated together!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Your First Friend</span>
            </button>
          </div>
        )}
      </div>

      {/* Social Features Info */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-semibold text-gray-900 mb-2">🤝 How Friends Work</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• See each other's streaks in real-time</li>
          <li>• Send encouragement messages</li>
          <li>• Compete friendly in streak challenges</li>
          <li>• Stay motivated together</li>
        </ul>
      </div>

      {/* Leaderboard Preview */}
      {friends.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Streak Leaderboard</span>
          </h3>
          <div className="space-y-2">
            {friends
              .sort((a, b) => b.current_streak - a.current_streak)
              .slice(0, 3)
              .map((friend, index) => (
                <div key={friend.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      'bg-orange-300 text-orange-900'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{friend.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flame className="w-4 h-4 text-streak-fire" />
                    <span className="font-bold text-streak-fire">{friend.current_streak}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsTab;