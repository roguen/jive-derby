from flask import Flask, render_template, flash, request, Response
from wtforms import Form, TextField, TextAreaField, validators, StringField, SubmitField
from picamera import PiCamera
import time
import psycopg2
from PIL import Image
from importlib import import_module
import os
import camera_pi

from camera_pi import Camera

# App config.
DEBUG = True
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = '7d441f27d441f27567d441f2b6176a'

class ReusableForm(Form):
    name = TextField('Name:', validators=[validators.required()])
    company = TextField('Company:', validators=[validators.required(), validators.Length(min=6, max=35)])
    
    @app.route("/", methods=['GET', 'POST'])
    def hello():
        form = ReusableForm(request.form)
    
        print(form.errors)
        if request.method == 'POST':
            name=request.form['name']
            company=request.form['company']
            print(name, " ", company)

            image_location = 'static/images/image%s.jpg' %time.time()
            capture_image(image_location)
            id = connect(name, company, 'http://192.168.1.103:5000/'+image_location)
    
        if form.validate():
        # Save the comment here.
            flash('Thanks for registering ' + name + '.  Your Racer ID is : <strong>' +str(id)+ '</strong>.<br />Remember this ID for the race!' )
        else:
            flash('Error: All the form fields are required. ')
    
        return render_template('index.html', form=form)

def capture_image(image_location):
    camera = PiCamera()

#    img = Image.open('static/images/helmet_overlay.png')
    camera.resolution = (100, 100)
    camera.start_preview()
#    camera.annotate_text = "Hello world!"
    camera.rotation = 180
    time.sleep(10)
#    o = camera.add_overlay(img.tostring(), size=img.size)
#    o.alpha = 255
#    o.layer = 3    
    camera.capture(image_location)
    camera.stop_preview()
    camera.close()

def connect(racer_name, racer_company, racer_image_location):
    """ Connect to the PostgreSQL database server """
    conn = None
    try:

        # connect to the PostgreSQL server
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(host="192.168.1.98",database="derby", user="derby", password="start123")

        # create a cursor
        cur = conn.cursor()

        # execute a statement
        print('PostgreSQL database version:')
        query =  "INSERT INTO public.jderby_reg_racers (name, company, avatarurl) VALUES (%s, %s, %s) RETURNING id;"
        data = (racer_name, racer_company, racer_image_location)
        cur.execute(query, data)

        # display the PostgreSQL database server version
        racer_id = cur.fetchone()[0]
        print(racer_id)
        conn.commit()

        # close the communication with the PostgreSQL
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print('Database connection closed.')

    return racer_id

def index():
    """Video streaming home page."""
    return render_template('index.html')


def gen(camera):
    """Video streaming generator function."""
    while True:
        frame = camera.get_frame()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(gen(Camera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host='0.0.0.0')
