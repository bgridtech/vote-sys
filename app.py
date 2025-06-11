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

@app.route('/api/voteing', methods=['GET'])
def get_candidates_for_voting():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)

        # Query for headboy
        cursor.execute("SELECT name, class, image FROM candidates WHERE post = 'headboy'")
        headboy_candidates = cursor.fetchall()

        # Query for headgirl
        cursor.execute("SELECT name, class, image FROM candidates WHERE post = 'headgirl'")
        headgirl_candidates = cursor.fetchall()

        response = {
            "headboy": headboy_candidates,
            "headgirl": headgirl_candidates
        }

        return jsonify(response)

    except Error as e:
        print(f"Query error: {e}")
        return jsonify({"error": "Query execution failed"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
