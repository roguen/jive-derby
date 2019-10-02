import psycopg2

def connect():
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
        data = ('test', 'data', 'ref')        
        cur.execute(query, data)
#        cur.execute('SELECT * FROM public.jderby_reg_racers')
 
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
 
 
if __name__ == '__main__':
    connect()
