import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Flame, Trophy, Plus, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function Dashboard() {
  const { user, loadUser } = useAuth();
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load recent activities
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const activities = await response.json();
        setRecentActivities(activities.slice(0, 3)); // Show only last 3 activities
      }
      
      // Refresh user data to get updated streak
      await loadUser();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      gym: '🏋️‍♂️',
      run: '🏃‍♂️',
      walk: '🚶‍♂️',
      yoga: '🧘‍♂️',
    };
    return icons[type] || '🏃‍♂️';
  };

  const getActivityColor = (type) => {
    const colors = {
      gym: 'bg-purple-100 text-purple-800',
      run: 'bg-blue-100 text-blue-800',
      walk: 'bg-green-100 text-green-800',
      yoga: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
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
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Keep up the great work</p>
      </div>

      {/* Streak Card */}
      <div className="card text-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Flame className="w-8 h-8 text-streak-fire" />
              <span className="text-4xl font-bold streak-number">
                {user?.current_streak || 0}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700">Current Streak</p>
          </div>
          
          <div className="w-px h-12 bg-gray-300"></div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-4xl font-bold text-yellow-600">
                {user?.longest_streak || 0}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700">Best Streak</p>
          </div>
        </div>
        
        {user?.current_streak > 0 && (
          <div className="mt-4 p-3 bg-white rounded-lg">
            <p className="text-sm text-gray-600">
              🔥 You're on fire! Keep going to beat your record!
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <Activity className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {user?.total_activities || 0}
          </div>
          <p className="text-sm text-gray-600">Total Activities</p>
        </div>
        
        <div className="card text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-2xl">⚡</div>
          <div className="text-2xl font-bold text-gray-900">
            {recentActivities.reduce((total, activity) => total + (activity.calories_burned || 0), 0)}
          </div>
          <p className="text-sm text-gray-600">Recent Calories</p>
        </div>
      </div>

      {/* Quick Log Button */}
      <Link to="/log" className="block">
        <div className="btn-primary w-full text-center flex items-center justify-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Log New Activity</span>
        </div>
      </Link>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <Link to="/streak" className="text-primary-600 text-sm hover:text-primary-700">
            View All
          </Link>
        </div>
        
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`activity-card card p-4 ${activity.activity_type}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {activity.activity_type}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {activity.duration_minutes} min
                        {activity.calories_burned && ` • ${activity.calories_burned} cal`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(activity.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏃‍♂️</div>
            <p className="text-gray-600 mb-4">No activities yet</p>
            <Link to="/log" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Log Your First Activity</span>
            </Link>
          </div>
        )}
      </div>

      {/* Motivational Message */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 text-center">
        <p className="text-gray-700 font-medium">
          💪 {user?.current_streak === 0 
            ? "Start your streak today!" 
            : `${user.current_streak} days strong! Keep it up!`}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;