import unittest
from unittest.mock import patch

from edge_tts_runner import corrected_date_to_string


class ClockCorrectionTests(unittest.TestCase):
    def test_uses_corrected_drm_clock_instead_of_system_clock(self):
        with patch("edge_tts_runner.DRM.get_unix_timestamp", return_value=0):
            self.assertEqual(
                corrected_date_to_string(),
                "Thu Jan 01 1970 00:00:00 GMT+0000 (Coordinated Universal Time)",
            )

    def test_follows_updated_clock_after_server_correction(self):
        with patch("edge_tts_runner.DRM.get_unix_timestamp", side_effect=[0, 25200]):
            self.assertIn("00:00:00 GMT+0000", corrected_date_to_string())
            self.assertIn("07:00:00 GMT+0000", corrected_date_to_string())


if __name__ == "__main__":
    unittest.main()
