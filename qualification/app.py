from flask import Flask, render_template, flash, request, Response
from wtforms import IntegerField, Form, TextField, TextAreaField, DecimalField, validators, StringField, SubmitField, SelectField
#from flask_wtf.file import FileField, FileAllowed, FileRequired
from picamera import PiCamera
import time
import psycopg2
from PIL import Image
from importlib import import_module
import os
import camera_pi
#from wtforms_sqlalchemy.fields import QuerySelectField
from camera_pi import Camera

# App config.
DEBUG = True
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = '7d441f27d441f27567d441f2b6176a'

class ReusableForm(Form):

    thunderboards = [
        (-1, 'Please Select a Car Base'), 
        ('000b57xxxxx1', '01'), 
        ('000b57xxxxx2', '02'), 
        ('000b57xxxxx3', '03'), 
        ('000b57xxxxx4', '04'), 
        ('000b57xxxxx5', '05'), 
        ('000b57xxxxx6', '06'), 
        ('000b57xxxxx7', '07'),
        ('000b57xxxxx8', '08'),
        ('000b57xxxxx9', '09'),
        ('000b57xxxx10', '10'),]

    def validate_dropdown(form, field):
        if field.data == -1:
           raise ValidationError('Please select a vehicle base...')

    def validate_racer(self, field):
         print("ID to be compared: ", field.data)
         racers = lookupRacers()
#         print("Racers: ", racers)
         for x in range(0, len(racers)):
            print("Id = ", racers[x][0])
            if field.data == racers[x][0]:
               print("We have a match on: ", field.data)
               return racers[x]
#         raise ValidationError('No racer with this ID was found in the system...')
#         form.errors.append('No racer with this ID was found in the system...')

    racerid = IntegerField('Racer ID:', validators=[validators.required(), validate_racer])
    weight = DecimalField('Total Weight in oz:', validators=[validators.required()])
    base = SelectField('Car Base:', choices=thunderboards, validators=[validate_dropdown])
#    photo = FileField('Car Photo:', validators=[FileRequired()])
    weightfront = DecimalField('Front Axle Weight in oz:', validators=[validators.required()])
    weightrear = DecimalField('Rear Axle Weight in oz:', validators=[validators.required()])           

    @app.route("/", methods=['GET', 'POST'])
    def hello():
        form = ReusableForm(request.form)
    
        print(form.errors)
        if request.method == 'POST':
            racerid=request.form['racerid']
            weight=request.form['weight']
            base=request.form['base']
            weightfront=request.form['weightfront']
            weightrear=request.form['weightrear']
#        f = form.photo.data
#        filename = secure_filename(f.filename)
#        f.save(os.path.join(
#            app.instance_path, 'photos', filename
#        ))

            print("racerID: ", racerid, " weight: ", weight, " base: ", base, " front weight: ", weightfront, " rear weight: ", weightrear)

            image_location = 'static/images/car%s.jpg' %time.time()
            capture_image(image_location)
            id = connect(racerid, weight, weightfront, weightrear, base, image_location)
    
        if form.validate():
        # Save the comment here.
            flash('Your car has been qualified to race!' )
        else:
            print("Form errors: ", form.errors)
            flash('Error: All the form fields are required. ', form.errors)
    
        return render_template('index.html', form=form)

def capture_image(image_location):
    camera = PiCamera()

#    img = Image.open('static/images/helmet_overlay.png')
    camera.resolution = (1024, 768)
    camera.start_preview()
#    camera.annotate_text = "Hello world!"
    camera.rotation = 90
    time.sleep(10)
#    o = camera.add_overlay(img.tostring(), size=img.size)
#    o.alpha = 255
#    o.layer = 3    
    camera.capture(image_location)
    camera.stop_preview()
    camera.close()

def lookupRacers():
    """ Connect to the PostgreSQL database server """
    conn = None
    try:

        # connect to the PostgreSQL server
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(host="192.168.1.98",database="derby", user="derby", password="start123")

        # create a cursor
        cur = conn.cursor()

        # execute a statement
        cur.execute("SELECT * FROM jderby_reg_racers")
        racers = cur.fetchall()

#        print("Print each row and it's columns values")
#        for row in racers:
#            print("Id = ", row[0])

        # close the communication with the PostgreSQL
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print('Database connection closed.')

    return racers

def connect(racerid, weight, weightfront, weightrear, base, anglePic):
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
        query =  "INSERT INTO public.jderby_reg_cars (regid, weight, frontaxleweight, rearaxleweight, reactuuid, anglepicurl) VALUES (%s, %s, %s, %s, %s, %s) RETURNING carid;"
        data = (racerid, weight, weightfront, weightrear, base, anglePic)
        cur.execute(query, data)

        # display the PostgreSQL database server version
        car_id = cur.fetchone()[0]
        print(car_id)
        conn.commit()

        # close the communication with the PostgreSQL
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print('Database connection closed.')

    return car_id

#def index():
#    """Video streaming home page."""
#    return render_template('index.html')


#def gen(camera):
#    """Video streaming generator function."""
#    while True:
#        frame = camera.get_frame()
#        yield (b'--frame\r\n'
#               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


#@app.route('/video_feed')
#def video_feed():
#    """Video streaming route. Put this in the src attribute of an img tag."""
#    return Response(gen(Camera()),
#                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host='0.0.0.0')
