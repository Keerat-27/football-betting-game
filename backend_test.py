#!/usr/bin/env python3
"""
KickPredict Backend API Testing Suite
Tests all endpoints for the World Cup prediction game
"""

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class KickPredictTester:
    def __init__(self, base_url="https://kickpredict-21.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        
        # Default headers
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=30)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            details = f"Status: {response.status_code} (expected {expected_status})"
            if not success:
                details += f" | Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_register(self, email: str, password: str, username: str):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": email, "password": password, "username": username}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_login(self, email: str, password: str):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_competitions(self):
        """Test get competitions"""
        return self.run_test("Get Competitions", "GET", "competitions", 200)

    def test_sync_matches(self):
        """Test sync matches (generates mock data)"""
        return self.run_test("Sync Matches", "POST", "matches/sync", 200)

    def test_get_matches(self):
        """Test get matches"""
        success, response = self.run_test("Get Matches", "GET", "matches", 200)
        if success and isinstance(response, list):
            return len(response) > 0, response
        return False, []

    def test_get_match_by_id(self, match_id: int):
        """Test get specific match"""
        return self.run_test(f"Get Match {match_id}", "GET", f"matches/{match_id}", 200)

    def test_create_prediction(self, match_id: int, home_score: int, away_score: int, is_joker: bool = False):
        """Test create prediction"""
        return self.run_test(
            f"Create Prediction for Match {match_id}",
            "POST",
            "predictions",
            200,
            data={
                "match_id": match_id,
                "home_score": home_score,
                "away_score": away_score,
                "is_joker": is_joker
            }
        )

    def test_get_predictions(self):
        """Test get user predictions"""
        return self.run_test("Get User Predictions", "GET", "predictions", 200)

    def test_get_match_predictions(self, match_id: int):
        """Test get predictions for a match"""
        return self.run_test(f"Get Match {match_id} Predictions", "GET", f"predictions/match/{match_id}", 200)

    def test_leaderboards(self):
        """Test global leaderboards"""
        return self.run_test("Get Global Leaderboards", "GET", "leaderboards", 200)

    def test_create_group(self, name: str, description: str = ""):
        """Test create group/league"""
        success, response = self.run_test(
            "Create Group",
            "POST",
            "groups",
            200,
            data={"name": name, "description": description}
        )
        
        if success and 'id' in response:
            return True, response
        return False, {}

    def test_join_group(self, code: str):
        """Test join group by code"""
        return self.run_test(
            "Join Group",
            "POST",
            "groups/join",
            200,
            data={"code": code}
        )

    def test_get_my_groups(self):
        """Test get user's groups"""
        return self.run_test("Get My Groups", "GET", "groups", 200)

    def test_get_group_by_id(self, group_id: str):
        """Test get group details"""
        return self.run_test(f"Get Group {group_id}", "GET", f"groups/{group_id}", 200)

    def test_get_profile(self):
        """Test get user profile"""
        return self.run_test("Get User Profile", "GET", "users/profile", 200)

    def test_get_standings(self):
        """Test get group standings"""
        return self.run_test("Get Standings", "GET", "standings", 200)

    def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting KickPredict Backend API Tests")
        print("=" * 50)
        
        # Test user registration flow
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_username = f"testuser_{timestamp}"
        
        # 1. Health check
        self.test_health_check()
        
        # 2. User registration
        if not self.test_register(test_email, test_password, test_username):
            print("❌ Registration failed, stopping tests")
            return False
        
        # 3. Get current user
        self.test_get_me()
        
        # 4. Test competitions
        self.test_competitions()
        
        # 5. Sync matches (generate mock data)
        self.test_sync_matches()
        
        # 6. Get matches
        matches_success, matches_data = self.test_get_matches()
        
        if matches_success and matches_data:
            # Test with first available match
            first_match = matches_data[0]
            match_id = first_match['id']
            
            # 7. Get specific match
            self.test_get_match_by_id(match_id)
            
            # 8. Create prediction
            self.test_create_prediction(match_id, 2, 1, False)
            
            # 9. Create joker prediction for another match if available
            if len(matches_data) > 1:
                second_match = matches_data[1]
                self.test_create_prediction(second_match['id'], 1, 0, True)
            
            # 10. Get user predictions
            self.test_get_predictions()
            
            # 11. Get match predictions
            self.test_get_match_predictions(match_id)
        
        # 12. Test leaderboards
        self.test_leaderboards()
        
        # 13. Test groups/leagues
        group_success, group_data = self.test_create_group("Test League", "Test league for API testing")
        if group_success:
            group_id = group_data.get('id')
            group_code = group_data.get('code')
            
            # Test get group details
            if group_id:
                self.test_get_group_by_id(group_id)
        
        # 14. Get my groups
        self.test_get_my_groups()
        
        # 15. Get user profile
        self.test_get_profile()
        
        # 16. Get standings
        self.test_get_standings()
        
        # Test login with existing user
        print("\n🔄 Testing login with existing credentials...")
        # Clear token to test login
        self.token = None
        self.test_login(test_email, test_password)
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / max(self.tests_run, 1)) * 100:.1f}%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = KickPredictTester()
    
    try:
        success = tester.run_full_test_suite()
        tester.print_summary()
        
        # Save detailed results
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': tester.tests_run,
                    'passed_tests': tester.tests_passed,
                    'failed_tests': tester.tests_run - tester.tests_passed,
                    'success_rate': (tester.tests_passed / max(tester.tests_run, 1)) * 100,
                    'timestamp': datetime.now().isoformat()
                },
                'detailed_results': tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test suite crashed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())