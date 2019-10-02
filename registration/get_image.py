from picamera import PiCamera
import time

def captureImage():
	camera = PiCamera() 
 
	camera.start_preview()
	camera.rotation = 90
	time.sleep(1)
	camera.capture('static/images/test.jpg')
	camera.stop_preview()

if __name__ == '__main__':
    captureImage()
