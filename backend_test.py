import requests
import sys
from datetime import datetime
import json

class GetFitAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200
        )
        return success

    def test_register_new_user(self):
        """Test user registration with new user"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"testuser_{timestamp}@getfit.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "age": 25,
            "gender": "male",
            "fitness_goals": "Build muscle and lose weight"
        }
        
        success, response = self.run_test(
            "Register New User",
            "POST",
            "/api/auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login_existing_user(self):
        """Test login with existing test user"""
        test_data = {
            "email": "test@getfit.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "Login Existing User",
            "POST",
            "/api/auth/login",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        test_data = {
            "email": "invalid@getfit.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Login Invalid Credentials",
            "POST",
            "/api/auth/login",
            401,
            data=test_data
        )
        return success

    def test_get_profile(self):
        """Test getting user profile"""
        if not self.token:
            print("❌ No token available for profile test")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "/api/profile",
            200
        )
        
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_log_activity(self):
        """Test logging an activity"""
        if not self.token:
            print("❌ No token available for activity logging")
            return False
            
        test_data = {
            "activity_type": "gym",
            "duration_minutes": 60,
            "calories_burned": 300,
            "notes": "Great workout session!"
        }
        
        success, response = self.run_test(
            "Log Activity",
            "POST",
            "/api/activities",
            200,
            data=test_data
        )
        return success

    def test_get_activities(self):
        """Test getting user activities"""
        if not self.token:
            print("❌ No token available for getting activities")
            return False
            
        success, response = self.run_test(
            "Get Activities",
            "GET",
            "/api/activities",
            200
        )
        return success

    def test_get_streak(self):
        """Test getting streak information"""
        if not self.token:
            print("❌ No token available for streak test")
            return False
            
        success, response = self.run_test(
            "Get Streak Info",
            "GET",
            "/api/streak",
            200
        )
        return success

    def test_add_friend(self):
        """Test adding a friend"""
        if not self.token:
            print("❌ No token available for friend test")
            return False
            
        # Try to add a non-existent user first (should fail)
        test_data = {
            "username": "nonexistent@getfit.com"
        }
        
        success, response = self.run_test(
            "Add Non-existent Friend",
            "POST",
            "/api/friends/add",
            404,
            data=test_data
        )
        return success

    def test_get_friends(self):
        """Test getting friends list"""
        if not self.token:
            print("❌ No token available for friends list test")
            return False
            
        success, response = self.run_test(
            "Get Friends List",
            "GET",
            "/api/friends",
            200
        )
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Unauthorized Profile Access",
            "GET",
            "/api/profile",
            403  # Should be 403 or 401
        )
        
        # Restore token
        self.token = original_token
        return success or response  # Accept either 401 or 403

def main():
    print("🚀 Starting GetFit API Tests")
    print("=" * 50)
    
    # Setup
    tester = GetFitAPITester("http://localhost:8001")
    
    # Run tests in sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Register New User", tester.test_register_new_user),
        ("Get Profile (New User)", tester.test_get_profile),
        ("Log Activity (New User)", tester.test_log_activity),
        ("Get Activities", tester.test_get_activities),
        ("Get Streak Info", tester.test_get_streak),
        ("Login Existing User", tester.test_login_existing_user),
        ("Get Profile (Existing User)", tester.test_get_profile),
        ("Login Invalid Credentials", tester.test_login_invalid_credentials),
        ("Add Non-existent Friend", tester.test_add_friend),
        ("Get Friends List", tester.test_get_friends),
        ("Unauthorized Access", tester.test_unauthorized_access),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())