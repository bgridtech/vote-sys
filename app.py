from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os

username = os.getenv('username_mysql_aws')
password = os.getenv('password_mysql_aws')
host = os.getenv('host_aws')

app = Flask(__name__)
CORS(app)

# Database connection settings
DB_CONFIG = {
    "user": username,
    "password": password,
    "host": host,
    "port": 3306,
    "database": "vote_ben"  
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"Database connection error: {e}")
        return None

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
