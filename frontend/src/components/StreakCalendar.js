import React, { useState, useEffect } from 'react';
import { Calendar, Flame, Trophy, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function StreakCalendar() {
  const [streakData, setStreakData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
    loadActivities();
  }, []);

  const loadStreakData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/streak`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const hasActivityOnDate = (date) => {
    return activities.some(activity => 
      isSameDay(new Date(activity.date), date)
    );
  };

  const getActivitiesForDate = (date) => {
    return activities.filter(activity => 
      isSameDay(new Date(activity.date), date)
    );
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const days = getDaysInMonth();
  const today = new Date();

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <Calendar className="w-12 h-12 text-primary-600 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-gray-900">Your Streak Calendar</h1>
        <p className="text-gray-600 mt-1">Track your fitness journey</p>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center bg-gradient-to-br from-orange-50 to-red-50">
          <Flame className="w-8 h-8 text-streak-fire mx-auto mb-2" />
          <div className="text-3xl font-bold streak-number">
            {streakData?.current_streak || 0}
          </div>
          <p className="text-sm text-gray-600">Current Streak</p>
        </div>
        
        <div className="card text-center bg-gradient-to-br from-yellow-50 to-orange-50">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-3xl font-bold text-yellow-600">
            {streakData?.longest_streak || 0}
          </div>
          <p className="text-sm text-gray-600">Best Streak</p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: days[0].getDay() }).map((_, index) => (
            <div key={index} className="h-10"></div>
          ))}
          
          {/* Calendar days */}
          {days.map(day => {
            const hasActivity = hasActivityOnDate(day);
            const isToday = isSameDay(day, today);
            const dayActivities = getActivitiesForDate(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`calendar-day h-10 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer ${
                  hasActivity 
                    ? 'has-activity' 
                    : isToday 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'hover:bg-gray-100'
                }`}
                title={dayActivities.length > 0 
                  ? `${dayActivities.length} activities: ${dayActivities.map(a => a.activity_type).join(', ')}`
                  : ''
                }
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500"></div>
            <span>Activity</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-primary-200"></div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Recent Activities List */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        
        {activities.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getActivityIcon(activity.activity_type)}</span>
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
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-gray-600 mb-4">No activities logged yet</p>
            <a href="/log" className="btn-primary inline-block">
              Start Your Journey
            </a>
          </div>
        )}
      </div>

      {/* Motivational Message */}
      <div className="card bg-gradient-to-r from-purple-50 to-pink-50 text-center">
        <p className="text-gray-700 font-medium">
          {streakData?.current_streak > 0 
            ? `🔥 ${streakData.current_streak} days strong! Keep the momentum going!`
            : "💪 Start your streak today! Every journey begins with a single step."
          }
        </p>
      </div>
    </div>
  );
}

export default StreakCalendar;