# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from werkzeug.utils import secure_filename
import pytesseract
import pdf2image
from pathlib import Path
import cv2
import numpy as np
import re
from typing import Dict, Any, List
from document_validators import DOCUMENT_VALIDATORS

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure upload folder and allowed extensions
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads folder if it doesn't exist
Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)

# Configure Tesseract path
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def enhance_image(image: np.ndarray) -> List[np.ndarray]:
    """Enhanced image preprocessing pipeline"""
    enhanced_images = []
    
    # Convert to grayscale if needed
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    # 1. Basic preprocessing with contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced_gray = clahe.apply(gray)
    enhanced_images.append(enhanced_gray)
    
    # 2. Multiple thresholding techniques
    # Adaptive Gaussian
    adaptive_gaussian = cv2.adaptiveThreshold(
        enhanced_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    enhanced_images.append(adaptive_gaussian)
    
    # Adaptive Mean
    adaptive_mean = cv2.adaptiveThreshold(
        enhanced_gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    enhanced_images.append(adaptive_mean)
    
    # Otsu's thresholding
    _, otsu = cv2.threshold(enhanced_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    enhanced_images.append(otsu)
    
    # 3. Noise reduction
    denoised = cv2.fastNlMeansDenoising(enhanced_gray)
    enhanced_images.append(denoised)
    
    # 4. Sharpening
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(enhanced_gray, -1, kernel)
    enhanced_images.append(sharpened)
    
    # 5. Dilation and erosion
    kernel = np.ones((2,2), np.uint8)
    dilated = cv2.dilate(enhanced_gray, kernel, iterations=1)
    enhanced_images.append(dilated)
    
    return enhanced_images

def extract_text_from_image(image: np.ndarray) -> str:
    """Extract text using multiple OCR approaches"""
    enhanced_images = enhance_image(image)
    extracted_texts = []
    
    # Expanded OCR configs
    configs = [
        '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',  # Restricted charset
        '--oem 3 --psm 3',  # Full page
        '--oem 3 --psm 4',  # Single column
        '--oem 3 --psm 1',  # Auto with OSD
        '--oem 3 --psm 11'  # Single text line
    ]
    
    for img in enhanced_images:
        for config in configs:
            try:
                # Try both with and without language specification
                text1 = pytesseract.image_to_string(img, lang='eng+hin', config=config)
                text2 = pytesseract.image_to_string(img, lang='eng', config=config)
                
                if text1.strip():
                    extracted_texts.append(text1)
                if text2.strip():
                    extracted_texts.append(text2)
            except Exception as e:
                logger.warning(f"OCR failed for config {config}: {str(e)}")
                continue
    
    # Combine and clean text
    combined_text = ' '.join(extracted_texts)
    # Enhanced text cleaning
    cleaned_text = re.sub(r'\s+', ' ', combined_text)  # normalize spaces
    cleaned_text = re.sub(r'[^\w\s]', ' ', cleaned_text)  # remove special characters
    cleaned_text = ' '.join(cleaned_text.split())  # remove extra spaces
    return cleaned_text.strip()

def process_pdf(file) -> str:
    """Enhanced PDF processing pipeline"""
    try:
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        file.save(temp_path)

        try:
            # Convert PDF to images with higher DPI and quality
            images = pdf2image.convert_from_path(
                temp_path,
                dpi=400,  # Increased DPI
                grayscale=False,
                thread_count=2,  # Parallel processing
                use_cropbox=True,
                strict=False
            )
            
            all_text = []
            
            for img in images:
                # Convert PIL Image to OpenCV format
                opencv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                
                # Enhanced resize logic
                height, width = opencv_img.shape[:2]
                target_height = 2000  # Increased target height
                if height < target_height:
                    scale = target_height/height
                    opencv_img = cv2.resize(
                        opencv_img, 
                        None, 
                        fx=scale, 
                        fy=scale, 
                        interpolation=cv2.INTER_CUBIC
                    )
                
                # Extract text with enhanced processing
                text = extract_text_from_image(opencv_img)
                if text:
                    all_text.append(text)
            
            final_text = ' '.join(all_text)
            logger.debug(f"Extracted text: {final_text}")
            return final_text
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}", exc_info=True)
        raise

@app.route('/verify', methods=['POST'])
def verify_document():
    try:
        if 'file' not in request.files:
            logger.error("No file provided in request")
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        doc_type = request.form.get('documentType')
        
        logger.info(f"Processing document type: {doc_type}")
        
        if not doc_type or not file or file.filename == '':
            logger.error("Missing required fields")
            return jsonify({"error": "Missing required fields"}), 400
        
        if not allowed_file(file.filename):
            logger.error(f"Invalid file type: {file.filename}")
            return jsonify({"error": "Only PDF files are allowed"}), 400
        
        if doc_type not in DOCUMENT_VALIDATORS:
            logger.error(f"Unsupported document type: {doc_type}")
            return jsonify({
                "error": f"Unsupported document type: {doc_type}",
                "isValid": False,
                "confidence": 0,
                "details": {"errors": ["Unsupported document type"]}
            }), 400
        
        # Extract text with enhanced processing
        logger.info(f"Extracting text from file: {file.filename}")
        extracted_text = process_pdf(file)
        
        if not extracted_text:
            logger.warning("No text extracted from document")
            return jsonify({
                "error": "No text could be extracted from document",
                "isValid": False,
                "confidence": 0,
                "details": {"errors": ["Text extraction failed"]}
            }), 400
        
        # Validate document
        logger.info("Validating document...")
        validator = DOCUMENT_VALIDATORS[doc_type]
        result = validator.validate(extracted_text)
        
        logger.info(f"Validation result: {result['isValid']}")
        return jsonify(result)
                
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return jsonify({
            "error": str(e),
            "isValid": False,
            "confidence": 0,
            "details": {"errors": [str(e)]}
        }), 500

if __name__ == '__main__':
    app.run(debug=True)