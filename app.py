from flask import Flask, render_template, request, jsonify
import os
import time
import random
from werkzeug.utils import secure_filename
from google import genai

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret-key')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', "AIzaSyCRNMw-tMeKdI5-zOzcDoeSeiBZ3AxOOHA")
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

client = genai.Client(api_key=GEMINI_API_KEY)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def call_gemini(prompt, max_retries=3):
    """Call Gemini 2.5 Flash with retries for transient errors."""
    last_err = None
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    'temperature': 0.4,
                    'top_k': 32,
                    'top_p': 0.95,
                    'max_output_tokens': 8192,
                }
            )
            return getattr(response, 'text', None) or ''
        except Exception as e:
            last_err = e
            msg = str(e)
            if any(x in msg for x in ('503', 'UNAVAILABLE', 'overloaded', '429', 'rate')):
                delay = min(16, 2 ** attempt) + random.uniform(0, 0.5)
                time.sleep(delay)
                continue
            break
    raise Exception(str(last_err))


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'TestForge AI is running'})


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        content = ''

        if filename.endswith('.txt'):
            content = file.read().decode('utf-8', errors='ignore')
        else:
            # PDF/DOCX: return filename placeholder for now
            content = f'[Content from uploaded file: {filename}]'

        return jsonify({'message': 'File uploaded successfully', 'filename': filename, 'content': content})

    return jsonify({'error': 'Invalid file type. Allowed: txt, pdf, docx'}), 400


@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    requirements = (data.get('requirements') or '').strip()
    if not requirements:
        return jsonify({'error': 'Requirements are required'}), 400

    generate_manual = data.get('manual', True)
    generate_automation = data.get('automation', True)
    framework = data.get('framework', 'selenium')

    if not generate_manual and not generate_automation:
        return jsonify({'error': 'Select at least one output type'}), 400

    result = {}

    if generate_manual:
        manual_prompt = f"""Create detailed manual test cases for the following project requirements.

Output a Markdown table with exactly these columns:
| Test Case ID | Title | Preconditions | Test Steps | Expected Result | Priority |

Rules:
- Every test case MUST be a row in the table
- Test Steps should be numbered inline e.g. 1. Do X 2. Do Y
- Do NOT use any text outside the table (no headings, no paragraphs)
- Use TC-001, TC-002, TC-003 etc. for IDs
- Priority values: High / Medium / Low

Project requirements:
{requirements}"""

        try:
            result['manual'] = call_gemini(manual_prompt)
        except Exception as e:
            result['manual_error'] = str(e)

    if generate_automation:
        automation_prompt = f"""Create automation test scripts using {framework} for the following project.
Provide complete, working test scripts following best practices (e.g. Page Object Model where appropriate).

Project requirements:
{requirements}

Provide ONLY the code with inline comments. Format in well-structured Markdown with code blocks."""

        try:
            result['automation'] = call_gemini(automation_prompt)
        except Exception as e:
            result['automation_error'] = str(e)

    return jsonify(result)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port)
