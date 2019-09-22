from picamera import PiCamera
import time

def captureImage():
	camera = PiCamera() 
 
	camera.start_preview()
	camera.rotation = 180
	time.sleep(10)
	camera.capture('/home/pi/image%s.jpg' %time.time())
	camera.stop_preview()

if __name__ == '__main__':
    captureImage()
