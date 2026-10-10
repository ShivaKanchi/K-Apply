import unittest
from core.intelligence.answer_engine import AnswerEngine

class TestAnswerEngine(unittest.TestCase):

    def setUp(self):
        self.profile = {
            "personal": {
                "first_name": "Alex",
                "last_name": "Smith",
                "full_name": "Alex Smith",
                "email": "alex.smith@example.com",
                "phone": "+1-555-0199",
                "address": {
                    "city": "Austin",
                    "state": "TX",
                    "postal_code": "78701",
                    "country": "United States"
                }
            },
            "social": {
                "linkedin": "https://linkedin.com/in/alexsmith",
                "github": "https://github.com/alexsmith",
                "portfolio": "https://alexsmith.io"
            },
            "work_authorization": {
                "authorized_to_work": True,
                "requires_sponsorship": False
            },
            "skills": ["python", "react", "docker"]
        }
        self.engine = AnswerEngine(self.profile)

    def test_contact_questions(self):
        self.assertEqual(self.engine.answer_question("First Name"), "Alex")
        self.assertEqual(self.engine.answer_question("Last Name"), "Smith")
        self.assertEqual(self.engine.answer_question("Email Address"), "alex.smith@example.com")
        self.assertEqual(self.engine.answer_question("Mobile Phone Number"), "+1-555-0199")

    def test_social_links(self):
        self.assertEqual(self.engine.answer_question("LinkedIn Profile URL"), "https://linkedin.com/in/alexsmith")
        self.assertEqual(self.engine.answer_question("GitHub URL"), "https://github.com/alexsmith")
        self.assertEqual(self.engine.answer_question("Portfolio or Website"), "https://alexsmith.io")

    def test_work_authorization(self):
        self.assertEqual(self.engine.answer_question("Are you legally authorized to work in the US?"), "Yes")
        self.assertEqual(self.engine.answer_question("Will you now or in the future require sponsorship?"), "No")

    def test_address(self):
        self.assertEqual(self.engine.answer_question("Current City"), "Austin")
        self.assertEqual(self.engine.answer_question("State / Province"), "TX")
        self.assertEqual(self.engine.answer_question("Postal Code / Zip"), "78701")

if __name__ == "__main__":
    unittest.main()
