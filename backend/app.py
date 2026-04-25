from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "ClickFusion API funcionando!"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)