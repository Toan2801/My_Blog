"""Run Edge TTS with consistent clock-skew correction for authentication and SSML."""

import importlib
import time

from edge_tts.drm import DRM
from edge_tts.util import main


def corrected_date_to_string():
    # edge-tts corrects DRM time after a 403 using the server's Date header.
    # Its speech.config and SSML timestamps must use that same corrected clock.
    return time.strftime(
        "%a %b %d %Y %H:%M:%S GMT+0000 (Coordinated Universal Time)",
        time.gmtime(DRM.get_unix_timestamp()),
    )


def run():
    communicate = importlib.import_module("edge_tts.communicate")
    communicate.date_to_string = corrected_date_to_string
    main()


if __name__ == "__main__":
    run()
