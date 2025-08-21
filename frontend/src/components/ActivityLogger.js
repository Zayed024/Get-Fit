import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function ActivityLogger() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    activity_type: '',
    duration_minutes: '',
    calories_burned: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    { value: 'gym', label: '🏋️‍♂️ Gym Workout', description: 'Weight training, machines, etc.' },
    { value: 'run', label: '🏃‍♂️ Running', description: 'Jogging, sprinting, treadmill' },
    { value: 'walk', label: '🚶‍♂️ Walking', description: 'Casual walk, hiking, stairs' },
    { value: 'yoga', label: '🧘‍♂️ Yoga', description: 'Stretching, meditation, poses' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          activity_type: formData.activity_type,
          duration_minutes: parseInt(formData.duration_minutes),
          calories_burned: formData.calories_burned ? parseInt(formData.calories_burned) : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      toast.success('Activity logged successfully! 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getEstimatedCalories = (type, duration) => {
    const caloriesPerMinute = {
      gym: 8,
      run: 12,
      walk: 4,
      yoga: 3,
    };
    
    return caloriesPerMinute[type] * duration || 0;
  };

  const estimatedCalories = formData.activity_type && formData.duration_minutes 
    ? getEstimatedCalories(formData.activity_type, parseInt(formData.duration_minutes) || 0)
    : 0;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💪</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Log Your Activity</h1>
        <p className="text-gray-600 mt-1">Keep your streak alive!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Activity Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What did you do today?
          </label>
          <div className="space-y-3">
            {activityTypes.map((activity) => (
              <label
                key={activity.value}
                className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  formData.activity_type === activity.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="activity_type"
                  value={activity.value}
                  checked={formData.activity_type === activity.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{activity.label.split(' ')[0]}</div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {activity.label.substring(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {activity.description}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              required
              min="1"
              max="1440"
              className="input-field pl-10"
              placeholder="How long did you exercise?"
              value={formData.duration_minutes}
              onChange={handleChange}
            />
          </div>
          {estimatedCalories > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Estimated: ~{estimatedCalories} calories
            </p>
          )}
        </div>

        {/* Calories (Optional) */}
        <div>
          <label htmlFor="calories_burned" className="block text-sm font-medium text-gray-700 mb-2">
            Calories Burned (optional)
          </label>
          <div className="relative">
            <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="calories_burned"
              name="calories_burned"
              type="number"
              min="0"
              className="input-field pl-10"
              placeholder={estimatedCalories > 0 ? `Leave blank for ~${estimatedCalories}` : "Enter if you know"}
              value={formData.calories_burned}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            className="input-field resize-none"
            placeholder="How did it feel? Any achievements?"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.activity_type || !formData.duration_minutes}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Log Activity</span>
            </>
          )}
        </button>

        {/* Motivation */}
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 text-center">
          <p className="text-gray-700 font-medium">
            🔥 Every workout counts! You've got this!
          </p>
        </div>
      </form>
    </div>
  );
}

export default ActivityLogger;