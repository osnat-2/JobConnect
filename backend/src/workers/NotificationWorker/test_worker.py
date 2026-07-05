import unittest

from worker import NotificationWorker, PermanentWorkerError


class NotificationWorkerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.worker = NotificationWorker()

    def test_builds_interview_confirmation_message(self) -> None:
        payload = {
            "applicationId": "app-123",
            "candidateEmail": "candidate@example.com",
            "interviewerEmail": "interviewer@example.com",
            "scheduledAt": "2026-07-05T10:00:00Z",
        }

        notification = self.worker.build_notification("InterviewLockSuccess", payload)

        self.assertEqual(notification["subject"], "Interview confirmed")
        self.assertIn("candidate@example.com", notification["recipients"])
        self.assertIn("interviewer@example.com", notification["recipients"])
        self.assertIn("app-123", notification["body"])

    def test_requires_recipients_for_notification(self) -> None:
        with self.assertRaises(PermanentWorkerError):
            self.worker.build_notification("InterviewLockFailed", {"applicationId": "app-123"})


if __name__ == "__main__":
    unittest.main()
