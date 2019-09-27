from flask import Flask, render_template, flash, request, Response
from wtforms import IntegerField, Form, TextField, TextAreaField, DecimalField, validators, StringField, SubmitField, SelectField
#from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms.validators import InputRequired, ValidationError
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
        ('00:0B:57:0B:4B:4F', '01'), 
        ('00:0B:57:0B:46:44', '02'), 
        ('00:0B:57:0C:70:65', '03'), 
        ('00:0B:57:xx:xx:xx', '04'), 
        ('00:0B:57:xx:xx:xx', '05'), 
        ('00:0B:57:xx:xx:xx', '06'), 
        ('00:0B:57:xx:xx:xx', '07'),
        ('00:0B:57:xx:xx:xx', '08'),
        ('00:0B:57:xx:xx:xx', '09'),
        ('00:0B:57:xx:xx:xx', '10'),]

    def validate_base(self, base):
        if base.data == -1:
           raise ValidationError('Please select a vehicle base...')

    def validate_racerid(self, racerid):
         print("ID to be compared: ", racerid.data)
         racers = lookupRacers(racerid.data)
         #print("Racers: ", racers)
         if racers == None:
            raise ValidationError('No racer with this ID was found in the system...')

    racerid = IntegerField("Racer ID:", validators=[InputRequired(message="Please provide a valid racer ID"), validate_racerid])
#    weight = DecimalField('Total Weight in oz:', validators=[validators.required()])
    base = SelectField('Car Base:', choices=thunderboards, validators=[validate_base])
#    photo = FileField('Car Photo:', validators=[FileRequired()])
    weightfront = DecimalField('Front Axle Weight in oz:', validators=[validators.required()])
    weightrear = DecimalField('Rear Axle Weight in oz:', validators=[validators.required()])           

    @app.route("/", methods=['GET', 'POST'])
    def hello():
        form = ReusableForm(request.form)

        racerResult = None    
        print(form.errors)
        if request.method == 'POST':
            racerid=request.form['racerid']
            racerResult = lookupRacers(racerid)
#            weight=request.form['weight']
            base=request.form['base']
            weightfront=request.form['weightfront']
            weightrear=request.form['weightrear']
            weight = float(weightfront) + float(weightrear)
#        f = form.photo.data
#        filename = secure_filename(f.filename)
#        f.save(os.path.join(
#            app.instance_path, 'photos', filename
#        ))

            print("racerID: ", racerid, " weight: ", weight, " base: ", base, " front weight: ", weightfront, " rear weight: ", weightrear)
            
            image_name = 'car%s.jpg' %time.time()
            image_location = 'static/images/'+image_name
            capture_image(image_location)
            hcp_image_location = saveToHCP(image_name, image_location)
 
            id = connect(racerid, weight, weightfront, weightrear, base, image_location, hcp_image_location)
         
        if form.validate():
            # Save the comment here.
            #flash('Your car has been qualified to race!' )
            if racerResult != None:
                flash('Your car has been qualified to race! <br /> Welcome ' + racerResult[0]["name"] + " to the Hitachi Vantara Data Test Track!")
        else:
            flash('Error: All the form fields are required.')
            for error in form.racerid.errors:
                 flash('Error: ' + error)
            for error in form.base.errors:
                 flash('Error: ' + error + " for the derby car base")
    
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

def lookupRacers(racerid):
    """ Connect to the PostgreSQL database server """
    conn = None
    racers = []
    try:

        # connect to the PostgreSQL server
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(host="dtt-derby-server",database="derby", user="derby", password="start123")

        # create a cursor
        cur = conn.cursor()

        # execute ai statement
        query = ("SELECT row_to_json(racer) as json FROM(SELECT * FROM jderby_reg_racers WHERE id="+ str(racerid)+") as racer")
        cur.execute(query)

        racers = cur.fetchone()

        # close the communication with the PostgreSQL
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print('Database connection closed.')

    return racers

def connect(racerid, weight, weightfront, weightrear, base, anglePic, hcp_image_location):
    """ Connect to the PostgreSQL database server """
    conn = None
    try:

        # connect to the PostgreSQL server
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(host="dtt-derby-server",database="derby", user="derby", password="start123")

        # create a cursor
        cur = conn.cursor()

        # execute a statement
        query =  "INSERT INTO public.jderby_reg_cars (regid, weight, frontaxleweight, rearaxleweight, reactuuid, anglepicurl, angle_image_hcp) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING carid;"
        data = (racerid, weight, weightfront, weightrear, base, anglePic, hcp_image_location)
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

def saveToHCP(image_name, image_location):
    curl_auth = '"Authorization: HCP ZGVyYnk=:a3b9c163f6c520407ff34cfdb83ca5c6"'
    curl_path = 'https://next2019.dtt-derby.hcp-demo.hcpdemo.com/rest/next2019-cars/'+image_name
    curl_host = '"'+curl_path+'"'
    print("Location on HCP: " + curl_host)
    os.system('curl -k -iT '+image_location+' -H '+curl_auth+' '+curl_host)
    return curl_path

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
