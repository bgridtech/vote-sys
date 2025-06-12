from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid
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

@app.route('/api/candidates', methods=['GET'])
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

@app.route('/api/vote', methods=['POST'])
def submit_vote():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        for post, name in data.items():
            # Increment the vote count for the candidate with matching name and post
            cursor.execute(
                "UPDATE candidates SET vote = vote + 1 WHERE name = %s AND post = %s",
                (name, post)
            )
            if cursor.rowcount == 0:
                print(f"No candidate found for post '{post}' with name '{name}'")

        conn.commit()
        return jsonify({"message": "Vote(s) recorded successfully"})

    except Error as e:
        print(f"Vote submission error: {e}")
        return jsonify({"error": "Vote submission failed"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            
@app.route('/api/total-voters', methods=['GET'])
def get_total_voters():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        # Sum votes where post is 'headboy'
        cursor.execute("SELECT SUM(vote) FROM candidates WHERE post = 'headboy'")
        result = cursor.fetchone()
        total_votes = result[0] if result[0] is not None else 0

        return jsonify({"total_voters": total_votes})

    except Error as e:
        print(f"Error fetching total voters: {e}")
        return jsonify({"error": "Failed to fetch total voters"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/api/add-candidate', methods=['POST'])
def add_candidate():
    data = request.get_json()

    # Validate input
    required_fields = ['name', 'class', 'post', 'image']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required candidate data"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        # Generate a unique candidate ID
        cand_id = str(uuid.uuid4())

        # Insert candidate into the table
        cursor.execute("""
            INSERT INTO candidates (cand_id, name, class, post, image, vote)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (cand_id, data['name'], data['class'], data['post'], data['image'], 0))

        conn.commit()
        return jsonify({"message": "Candidate added successfully", "cand_id": cand_id})

    except Error as e:
        print(f"Error inserting candidate: {e}")
        return jsonify({"error": "Failed to add candidate"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/delete-candidate', methods=['POST'])
def delete_candidate():
    data = request.get_json()

    required_fields = ['name', 'class', 'post']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        # Delete the candidate based on name, class, and post
        cursor.execute("""
            DELETE FROM candidates
            WHERE name = %s AND class = %s AND post = %s
        """, (data['name'], data['class'], data['post']))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "No matching candidate found"}), 404

        return jsonify({"message": "Candidate deleted successfully"})

    except Error as e:
        print(f"Error deleting candidate: {e}")
        return jsonify({"error": "Failed to delete candidate"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/api/delete-votes', methods=['POST'])
def delete_all_votes():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        # Set vote to 0 for all candidates
        cursor.execute("UPDATE candidates SET vote = 0")
        conn.commit()

        return jsonify({"message": "All votes have been reset to 0"})

    except Error as e:
        print(f"Error resetting votes: {e}")
        return jsonify({"error": "Failed to reset votes"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/api/all-details', methods=['GET'])
def get_all_candidates():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Fetch all records from candidates table
        cursor.execute("SELECT * FROM candidates")
        rows = cursor.fetchall()

        return jsonify(rows)

    except Error as e:
        print(f"Error fetching candidates: {e}")
        return jsonify({"error": "Failed to fetch candidates"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/api/result', methods=['GET'])
def get_election_results():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Get distinct posts
        cursor.execute("SELECT DISTINCT post FROM candidates")
        posts = cursor.fetchall()

        results = []

        for post_row in posts:
            post = post_row['post']

            # Get top-voted candidate(s) for the post
            cursor.execute("""
                SELECT name, image, vote 
                FROM candidates 
                WHERE post = %s AND vote = (
                    SELECT MAX(vote) FROM candidates WHERE post = %s
                )
            """, (post, post))

            top_candidates = cursor.fetchall()
            for candidate in top_candidates:
                candidate['post'] = post  # Add post to the result
                results.append(candidate)

        return jsonify(results)

    except Error as e:
        print(f"Error fetching results: {e}")
        return jsonify({"error": "Failed to fetch results"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
