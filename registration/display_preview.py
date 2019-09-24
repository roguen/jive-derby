from flask import Flask
import time
import picamera
#import logging
#import sys
#import os
#if sys.version_info[0] == 2:
#    from cStringIO import StringIO as bio
#else:
#    from io import BytesIO as bio

app = Flask(__name__)

@app.route("/start", methods=['POST'])
def start_preview():
    with picamera.PiCamera() as camera:
        camera.resolution = (640, 480)
        camera.start_preview()
        time.sleep(300)

@app.route("/stop", methods=['POST'])
def stop_preview():
    with picamera.PiCamera() as camera:
        camera.stop_preview()

if __name__ == "__main__":
    app.run(host='192.168.1.103', port='5001')
