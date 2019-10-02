    1  sudo apt-get update
    2  sudo apt-get install git
    3  sudo apt-get install libudev-dev
    6  sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev blueman pi-bluetooth
    7  sudo apt-get install libjpeg-dev
    8  sudo apt-get install python-setuptools python-dev build-essential python-pip libgtk2.0-dev
    9  sudo reboot
   10  cd /tmp
   11  wget https://www.imagemagick.org/download/ImageMagick.tar.gz
   12  cd ImageMagick-*
   14  tar xvzf ImageMagick.tar.gz
   15  cd ImageMagick-*
   16  ./configure
   17  make
   18  sudo make install
   19  make check
   20  cd /tmp
   21  wget https://downloads.sourceforge.net/project/graphicsmagick/graphicsmagick/1.3.25/GraphicsMagick-1.3.25.tar.gz
   22  tar xvzf GraphicsMagick-1.3.25.tar.gz
   23  cd GraphicsMagick-*
   24  ./configure
   25  make
   26  sudo make install
   27  make check
   28  cd /tmp
   29  wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-arm.zip
   41  sudo apt-get install vim
   43  sudo vim /etc/host
   44  sudo vim /etc/hostname 
   46  python3 -m pip install pycurl --additional-packages "libcurl4-openssl-dev libssl-dev"
   47  python3 -m pip install libcurl4-openssl-dev libssl-dev
   48  python3 -m pip install libssl-dev
   52  sudo apt-get install build-essential
   54  sudo python3 -m pip install SQLAlchemy
   55  sudo python3 -m pip install pycurl
   56  sudo apt-get install libcurl4-openssl-dev
   57  sudo apt-get install libssl-dev
   58  sudo python3 -m pip install pycurl
   63  sudo vim /etc/hosts
   93  sudo vim /etc/hostname 
   95  sudo /etc/init.d/hostname.sh
  115  sudo raspi-config
  116  cd jive-derby/qualification/
  117  python3 app.py 
