# document_validators.py
from abc import ABC, abstractmethod
import re
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
import pytesseract
from PIL import Image
import cv2
import numpy as np
import pdf2image
import os
from dataclasses import dataclass
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class BaseDocumentValidator(ABC):
    def __init__(self):
        self.confidence_score = 0
        self.extracted_text = ""
        self.validation_errors = []
        self.matches = {}

    def validate_text_presence(self, required_patterns: Dict[str, str], text: str = None) -> bool:
        """Enhanced pattern matching with better error handling and logging"""
        if text is not None:
            self.extracted_text = text
            
        text_to_check = self.extracted_text.upper()
        all_patterns_found = True
        
        for pattern_name, pattern in required_patterns.items():
            try:
                match = re.search(pattern, text_to_check, re.VERBOSE | re.IGNORECASE)
                if match:
                    self.matches[pattern_name] = match.group().strip()
                    logger.debug(f"Found {pattern_name}: {match.group()}")
                else:
                    logger.debug(f"Missing {pattern_name}")
                    self.validation_errors.append(f"Missing {pattern_name}")
                    all_patterns_found = False
            except Exception as e:
                logger.error(f"Error matching pattern {pattern_name}: {str(e)}")
                self.validation_errors.append(f"Error processing {pattern_name}")
                all_patterns_found = False
                
        return all_patterns_found

    def calculate_confidence(self, total_patterns: int) -> float:
        """Calculate confidence score based on found patterns"""
        found_patterns = len(self.matches)
        base_confidence = (found_patterns / total_patterns) * 0.95
        
        # Additional confidence boosters
        if 'isDigitallySigned' in self.matches:
            base_confidence += 0.05
            
        return min(base_confidence, 1.0)

    def _generate_response(self, doc_type: str) -> Dict[str, Any]:
        """Generate standardized response"""
        return {
            "isValid": len(self.validation_errors) == 0,
            "confidence": self.confidence_score,
            "documentType": doc_type,
            "details": {
                "errors": self.validation_errors,
                "extractedText": self.extracted_text,
                "matches": self.matches
            }
        }

class AadharValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text
        self.validation_errors = []
        
        required_patterns = {
            "Aadhar Number": r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
            "Government Text": r"(government of india|govt\.? of india|भारत सरकार)",
            "UIDAI Text": r"(unique identification authority|यूनीक आइडेंटिफिकेशन अथॉरिटी|uidai)",
            "DOB Format": r"(DOB|Date of Birth|जन्म तिथि|Year of Birth|Birth Year|DOB/Year of Birth)[\s:\-]*[\d/\-\.]+",
        }
        
        # Check patterns and calculate confidence
        matches_found = 0
        for pattern_name, pattern in required_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                matches_found += 1
                logger.debug(f"Found {pattern_name}")
            else:
                logger.debug(f"Missing {pattern_name}")
                self.validation_errors.append(f"Missing {pattern_name}")

        # Calculate confidence score
        confidence_score = matches_found / len(required_patterns)
        
        return {
            'isValid': matches_found >= 3,  # Valid if at least 3 patterns match
            'confidenceScore': confidence_score,
            'documentType': 'Aadhar Card',
            'errors': self.validation_errors if self.validation_errors else []
        }

class PANCardValidator(BaseDocumentValidator):
    def __init__(self):
        super().__init__()
        self.key_identifiers = {
            'pan_format': [
                r'[A-Z]{5}[0-9]{4}[A-Z]',  # Standard PAN format
                r'[A-Z]{3}\s*[A-Z]{2}\s*[0-9]{4}\s*[A-Z]',  # PAN with spaces
                r'\b[A-Z0-9]{10}\b',  # Generic 10 character alphanumeric
                r'[A-Z0-9]{3}[PFACBLJGpfacbljg][A-Z0-9]{5}[A-Z0-9]'  # More flexible PAN format
            ],
            'document_identifiers': [
                r'INCOME\s*TAX',
                r'PERMANENT\s*ACCOUNT',
                r'PAN',
                r'आयकर',
                r'GOVT\.?\s*OF\s*INDIA',
                r'भारत\s*सरकार',
                r'TAX\s*DEPARTMENT',
                r'DEPARTMENT',
                r'INDIA',
                r'I\s*T\s*D',  # Abbreviated form
                r'INCOME',
                r'TAX'
            ],
            'personal_info': [
                r'NAME[:\s]',
                r'नाम',
                r'FATHER',
                r'पिता',
                r'DATE.*BIRTH',
                r'DOB',
                r'जन्म',
                r'\d{2}[-/.]\d{2}[-/.]\d{4}',  # Date format
                r'SIGNATURE',
                r'SIGN',
                r'हस्ताक्षर'
            ]
        }

    def preprocess_text(self, text: str) -> str:
        """Preprocess extracted text for better matching"""
        if not text:
            return ""
            
        # Convert to uppercase
        text = text.upper()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Normalize spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common OCR errors
        text = text.replace('0', 'O').replace('1', 'I').replace('5', 'S')
        
        # Handle common substitutions
        substitutions = {
            'INCOMETAX': 'INCOME TAX',
            'PERMANENTACCOUNT': 'PERMANENT ACCOUNT',
            'GOVERNMENTOF': 'GOVERNMENT OF',
            'FATHERNAME': 'FATHER NAME',
            'DATEOFBIRTH': 'DATE OF BIRTH'
        }
        
        for wrong, right in substitutions.items():
            text = text.replace(wrong, right)
            
        return text.strip()

    def validate(self, text: str) -> Dict[str, Any]:
        """Enhanced validation with better error handling and confidence scoring"""
        try:
            # Preprocess the extracted text
            self.extracted_text = self.preprocess_text(text)
            
            if not self.extracted_text:
                return {
                    'documentType': 'PAN Card',
                    'isValid': False,
                    'confidenceScore': 0.0,
                    'error': 'No text content found in document'
                }
            
            self.matches = {}
            self.validation_errors = []
            
            logger.debug(f"Validating PAN Card text: {self.extracted_text}")
            
            # Initialize scoring with partial matches
            matches_found = {
                'pan_format': 0,
                'document_identifiers': 0,
                'personal_info': 0
            }

            # Check PAN format with fuzzy matching
            pan_candidates = re.findall(r'\b[A-Z0-9]{10}\b', self.extracted_text)
            for candidate in pan_candidates:
                for pattern in self.key_identifiers['pan_format']:
                    if re.match(pattern, candidate):
                        matches_found['pan_format'] = 1
                        self.matches['pan_number'] = candidate
                        logger.debug(f"Found PAN number: {candidate}")
                        break
                if matches_found['pan_format'] == 1:
                    break

            # Check document identifiers with partial matching
            for pattern in self.key_identifiers['document_identifiers']:
                if re.search(pattern, self.extracted_text):
                    matches_found['document_identifiers'] += 0.25  # Reduced weight per match
                    logger.debug(f"Found document identifier: {pattern}")

            # Check personal info with partial matching
            for pattern in self.key_identifiers['personal_info']:
                if re.search(pattern, self.extracted_text):
                    matches_found['personal_info'] += 0.2  # Reduced weight per match
                    logger.debug(f"Found personal info: {pattern}")

            # Cap scores at 1.0
            matches_found = {k: min(v, 1.0) for k, v in matches_found.items()}

            # Calculate weighted confidence score with adjusted weights
            weights = {'pan_format': 0.4, 'document_identifiers': 0.3, 'personal_info': 0.3}
            self.confidence_score = sum(matches_found[k] * weights[k] for k in matches_found)

            # Extract additional information
            additional_info = self._extract_additional_info()

            # More lenient validity check
            is_valid = (self.confidence_score >= 0.4)  # Lowered threshold

            result = {
                'documentType': 'PAN Card',
                'isValid': is_valid,
                'confidenceScore': self.confidence_score,
                'matchedIdentifiers': matches_found,
                'extractedData': {
                    **self.matches,
                    **additional_info
                },
                'validationDetails': {
                    'scores': matches_found,
                    'requiredMinimum': 0.4,
                    'hasPANFormat': matches_found['pan_format'] == 1,
                    'hasDocumentIdentifiers': matches_found['document_identifiers'] > 0,
                    'hasPersonalInfo': matches_found['personal_info'] > 0,
                    'extractedText': self.extracted_text  # Added for debugging
                }
            }

            logger.debug(f"Validation result: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in PAN card validation: {str(e)}")
            return {
                'documentType': 'PAN Card',
                'isValid': False,
                'confidenceScore': 0.0,
                'error': str(e)
            }

    def _extract_additional_info(self) -> Dict[str, str]:
        """Extract additional information with improved pattern matching"""
        info = {}
        
        # More flexible name extraction
        name_patterns = [
            r'NAME[:\s]+([A-Z\s]+(?:\s*[A-Z]+)*)',
            r'([A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)*)\s+(?:DOB|FATHER)',
        ]
        
        for pattern in name_patterns:
            name_match = re.search(pattern, self.extracted_text)
            if name_match:
                info['name'] = name_match.group(1).strip()
                break

        # More flexible father's name extraction
        father_patterns = [
            r"FATHER['S]*\s*NAME[:\s]+([A-Z\s]+(?:\s*[A-Z]+)*)",
            r"FATHER['S]*[:\s]+([A-Z\s]+(?:\s*[A-Z]+)*)",
        ]
        
        for pattern in father_patterns:
            father_match = re.search(pattern, self.extracted_text)
            if father_match:
                info['fatherName'] = father_match.group(1).strip()
                break

        # More flexible DOB extraction
        dob_patterns = [
            r'(?:DOB|DATE\s+OF\s+BIRTH)[:\s]+(\d{2}[/-]\d{2}[/-]\d{4})',
            r'(\d{2}[/-]\d{2}[/-]\d{4})',
        ]
        
        for pattern in dob_patterns:
            dob_match = re.search(pattern, self.extracted_text)
            if dob_match:
                info['dateOfBirth'] = dob_match.group(1)
                break

        return info

class VoterIDValidator(BaseDocumentValidator):
    def __init__(self):
        super().__init__()
        self.key_identifiers = {
            'document_identifiers': [
                r'ELECTION\s*COMMISSION\s*OF\s*INDIA',
                r'ELECTOR\s*PHOTO\s*IDENTITY\s*CARD',
                r'EPIC\s*NO',
                r'VOTER\s*ID',
                r'मतदाता\s*पहचान\s*पत्र',
                r'भारत\s*निर्वाचन\s*आयोग',
                r'IDENTITY\s*CARD'
            ],
            'personal_info': [
                r'NAME\s*[:]\s*([A-Z\s]+)',
                r'FATHER[\'S]*\s*NAME\s*[:]\s*([A-Z\s]+)',
                r'SEX\s*[:]\s*([A-Z]+)',
                r'DATE\s*OF\s*BIRTH',
                r'AGE\s*[:]\s*(\d+)',
                r'ADDRESS'
            ],
            'epic_number': [
                r'[A-Z]{3}\d{7}',  # Standard EPIC format
                r'[A-Z]{2,3}\/\d{2}\/\d{3}\/\d{6}',  # Alternative format
                r'[A-Z]{2,3}\/\d{6,8}',  # Another variation
                r'\b[A-Z0-9]{10}\b',  # Generic 10 character format
                r'EPIC\s*NO[.:]\s*([A-Z0-9\/]{8,})'  # EPIC with prefix
            ]
        }

    def validate(self, text: str) -> Dict[str, Any]:
        """Enhanced validation with better pattern matching"""
        try:
            self.extracted_text = text.upper()
            self.matches = {}
            self.validation_errors = []
            
            logger.debug(f"Validating Voter ID text: {self.extracted_text}")
            
            # Initialize scoring
            matches_found = {
                'document_identifiers': 0,
                'personal_info': 0,
                'epic_number': 0
            }

            # Check document identifiers
            for pattern in self.key_identifiers['document_identifiers']:
                if re.search(pattern, self.extracted_text):
                    matches_found['document_identifiers'] += 0.25
                    logger.debug(f"Found document identifier: {pattern}")

            # Check personal information
            for pattern in self.key_identifiers['personal_info']:
                if re.search(pattern, self.extracted_text):
                    matches_found['personal_info'] += 0.2
                    logger.debug(f"Found personal info: {pattern}")

            # Check EPIC number with multiple formats
            for pattern in self.key_identifiers['epic_number']:
                match = re.search(pattern, self.extracted_text)
                if match:
                    epic_number = match.group(1) if 'EPIC' in pattern else match.group()
                    self.matches['epic_number'] = epic_number
                    matches_found['epic_number'] = 1
                    logger.debug(f"Found EPIC number: {epic_number}")
                    break

            # Cap scores at 1.0
            matches_found = {k: min(v, 1.0) for k, v in matches_found.items()}

            # Calculate weighted confidence score
            weights = {
                'document_identifiers': 0.4,
                'personal_info': 0.3,
                'epic_number': 0.3
            }
            self.confidence_score = sum(matches_found[k] * weights[k] for k in matches_found)

            # Extract additional information
            additional_info = self._extract_additional_info()

            # Determine validity with lower threshold
            is_valid = (self.confidence_score >= 0.4)  # Lowered threshold

            result = {
                'documentType': 'Voter ID',
                'isValid': is_valid,
                'confidenceScore': self.confidence_score,
                'matchedIdentifiers': matches_found,
                'extractedData': {
                    **self.matches,
                    **additional_info
                },
                'validationDetails': {
                    'scores': matches_found,
                    'requiredMinimum': 0.4,
                    'hasDocumentIdentifiers': matches_found['document_identifiers'] > 0,
                    'hasPersonalInfo': matches_found['personal_info'] > 0,
                    'hasEPICNumber': matches_found['epic_number'] > 0
                }
            }

            logger.debug(f"Validation result: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in Voter ID validation: {str(e)}")
            return {
                'documentType': 'Voter ID',
                'isValid': False,
                'confidenceScore': 0.0,
                'error': str(e)
            }

    def _extract_additional_info(self) -> Dict[str, str]:
        """Extract additional information from the Voter ID"""
        info = {}
        
        # Extract name
        name_match = re.search(r"ELECTOR['S]*\s*NAME\s*[:]\s*([A-Z\s]+)", self.extracted_text)
        if name_match:
            info['name'] = name_match.group(1).strip()

        # Extract father's name
        father_match = re.search(r"FATHER['S]*\s*NAME\s*[:]\s*([A-Z\s]+)", self.extracted_text)
        if father_match:
            info['fatherName'] = father_match.group(1).strip()

        # Extract sex/gender
        sex_match = re.search(r"SEX\s*[:]\s*([A-Z]+)", self.extracted_text)
        if sex_match:
            info['gender'] = sex_match.group(1).strip()

        # Extract DOB/Age
        dob_match = re.search(r"DATE\s*OF\s*BIRTH\s*[:]\s*(\d{2}[/-]\d{2}[/-]\d{4})", self.extracted_text)
        if dob_match:
            info['dateOfBirth'] = dob_match.group(1)
        else:
            age_match = re.search(r"AGE\s*[:]\s*(\d+)", self.extracted_text)
            if age_match:
                info['age'] = age_match.group(1)

        return info

class DrivingLicenseValidator(BaseDocumentValidator):
    def __init__(self):
        super().__init__()
        self.location_indicators = [
            'MUMBAI', 'DELHI', 'BANGALORE', 'CHENNAI', 'KOLKATA',
            'PUNE', 'HYDERABAD', 'AHMEDABAD'
        ]
        self.key_indicators = {
            'license_indicators': [
                'DRIVE', 'LICENCE', 'LICENSE', 'MOTOR', 'VEHICLE', 
                'TRANSPORT', 'RTO', 'THROUGHOUT INDIA'
            ],
            'document_elements': [
                'SIGNATURE', 'THUMB', 'IMPRESSION', 'PHOTO', 'SEAL'
            ],
            'address_indicators': [
                'ADDRESS', 'RESIDENT', 'RESIDING', 'ADD'
            ]
        }

    def _preprocess_text(self, text: str) -> str:
        """Preprocess the extracted text"""
        # Convert to uppercase
        text = text.upper()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text

    def _fuzzy_match(self, text: str, patterns: List[str], threshold: float = 0.8) -> bool:
        """Use fuzzy matching to find similar text"""
        from difflib import SequenceMatcher
        
        words = text.split()
        for word in words:
            for pattern in patterns:
                similarity = SequenceMatcher(None, word, pattern).ratio()
                if similarity >= threshold:
                    return True
        return False

    def validate(self, text: str) -> Dict[str, Any]:
        """Validate driving license with fuzzy matching"""
        try:
            # Preprocess the text
            self.extracted_text = self._preprocess_text(text)
            self.matches = {}
            self.validation_errors = []
            
            # Check for key indicators
            indicators_found = {
                'license': False,
                'location': False,
                'document_elements': False
            }
            
            # Check license indicators
            indicators_found['license'] = self._fuzzy_match(
                self.extracted_text,
                self.key_indicators['license_indicators'],
                threshold=0.7
            )
            
            # Check location indicators
            indicators_found['location'] = self._fuzzy_match(
                self.extracted_text,
                self.location_indicators,
                threshold=0.8
            )
            
            # Check document elements
            indicators_found['document_elements'] = self._fuzzy_match(
                self.extracted_text,
                self.key_indicators['document_elements'],
                threshold=0.7
            )
            
            # Extract possible license numbers using pattern matching
            possible_license_numbers = self._extract_possible_license_numbers()
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence(indicators_found, bool(possible_license_numbers))
            
            # Determine validity
            is_valid = self._determine_validity(indicators_found, confidence_score)
            
            # Prepare extracted data
            extracted_data = {
                'possibleLicenseNumbers': possible_license_numbers,
                'detectedLocations': self._extract_locations(),
                'hasSignature': 'SIGNATURE' in self.extracted_text or 'THUMB IMPRESSION' in self.extracted_text,
                'detectedText': self.extracted_text[:200] + '...' if len(self.extracted_text) > 200 else self.extracted_text
            }
            
            return {
                'documentType': 'Driving License',
                'isValid': is_valid,
                'confidenceScore': confidence_score,
                'extractedData': extracted_data,
                'validationDetails': {
                    'indicatorsFound': indicators_found,
                    'textQuality': 'Poor' if confidence_score < 0.4 else 'Medium' if confidence_score < 0.7 else 'Good',
                    'hasLicenseIndicators': indicators_found['license'],
                    'hasLocationIndicators': indicators_found['location'],
                    'hasDocumentElements': indicators_found['document_elements']
                }
            }
            
        except Exception as e:
            logger.error(f"Error in driving license validation: {str(e)}")
            return {
                'documentType': 'Driving License',
                'isValid': False,
                'confidenceScore': 0.0,
                'error': str(e)
            }

    def _extract_possible_license_numbers(self) -> List[str]:
        """Extract possible license numbers using various patterns"""
        patterns = [
            r'[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}',  # Standard format
            r'[A-Z]{2}[-\s]?\d{2}[-\s]?\d{8}',             # Alternate format
            r'\b[A-Z0-9]{9,16}\b'                          # Generic number pattern
        ]
        
        numbers = []
        for pattern in patterns:
            matches = re.finditer(pattern, self.extracted_text)
            numbers.extend([match.group() for match in matches])
        
        return list(set(numbers))  # Remove duplicates

    def _extract_locations(self) -> List[str]:
        """Extract possible locations from text"""
        return [loc for loc in self.location_indicators 
                if loc in self.extracted_text]

    def _calculate_confidence(self, indicators: Dict[str, bool], has_license_number: bool) -> float:
        """Calculate confidence score"""
        weights = {
            'license': 0.4,
            'location': 0.3,
            'document_elements': 0.3
        }
        
        score = sum(weights[k] for k, v in indicators.items() if v)
        if has_license_number:
            score = min(1.0, score + 0.2)
            
        return score

    def _determine_validity(self, indicators: Dict[str, bool], confidence: float) -> bool:
        """Determine if document is valid"""
        # Document is considered valid if:
        # 1. It has license indicators
        # 2. It has either location or document elements
        # 3. Confidence score is above threshold
        return (indicators['license'] and 
                (indicators['location'] or indicators['document_elements']) and 
                confidence >= 0.4)

class RationCardValidator(BaseDocumentValidator):
    def __init__(self):
        super().__init__()
        self.key_identifiers = {
            'document_identifiers': [
                r'RATION\s*CARD',
                r'राशन\s*कार्ड',
                r'PUBLIC\s*DISTRIBUTION\s*SYSTEM',
                r'FOOD\s*AND\s*CIVIL\s*SUPPLIES',
                r'खाद्य\s*एवं\s*नागरिक\s*आपूर्ति'
            ],
            'card_numbers': [
                r'(?:CARD|NO|NUMBER)[.:]\s*([A-Z0-9/-]+)',
                r'\b\d{11}\b',  # 11-digit format
                r'[A-Z]{2,3}[-/]\d{6,10}',
                r'C\.?R\.?O\.?\s*\([A-Z]\)',  # CRO format
                r'DISTRICT\s*(\d+)',  # District number format
            ],
            'categories': [
                r'\b(?:APL|BPL|AAY|PHH)\b',
                r'ABOVE\s*POVERTY\s*LINE',
                r'BELOW\s*POVERTY\s*LINE',
                r'ANTYODAYA',
                r'PRIORITY\s*HOUSEHOLD'
            ]
        }

    def validate(self, text: str) -> Dict[str, Any]:
        """Enhanced validation with better pattern matching"""
        try:
            self.extracted_text = text.upper()
            self.matches = {}
            self.validation_errors = []
            
            logger.debug(f"Validating Ration Card text: {self.extracted_text}")
            
            # Initialize scoring
            matches_found = {
                'document_identifiers': 0,
                'card_number': 0,
                'category': 0,
                'additional_info': 0
            }

            # Check document identifiers
            for pattern in self.key_identifiers['document_identifiers']:
                if re.search(pattern, self.extracted_text):
                    matches_found['document_identifiers'] += 0.25
                    logger.debug(f"Found document identifier: {pattern}")

            # Check card numbers
            for pattern in self.key_identifiers['card_numbers']:
                match = re.search(pattern, self.extracted_text)
                if match:
                    card_number = match.group(1) if '(' in pattern else match.group()
                    self.matches['card_number'] = card_number
                    matches_found['card_number'] = 1
                    logger.debug(f"Found card number: {card_number}")
                    break

            # Check categories
            for pattern in self.key_identifiers['categories']:
                match = re.search(pattern, self.extracted_text)
                if match:
                    self.matches['category'] = match.group()
                    matches_found['category'] = 1
                    logger.debug(f"Found category: {match.group()}")
                    break

            # Extract additional information
            additional_info = self._extract_additional_info()
            if additional_info:
                matches_found['additional_info'] = len(additional_info) * 0.2
                self.matches.update(additional_info)

            # Cap scores at 1.0
            matches_found = {k: min(v, 1.0) for k, v in matches_found.items()}

            # Calculate weighted confidence score
            weights = {
                'document_identifiers': 0.3,
                'card_number': 0.3,
                'category': 0.2,
                'additional_info': 0.2
            }
            self.confidence_score = sum(matches_found[k] * weights[k] for k in matches_found)

            # Determine validity with lower threshold
            is_valid = (self.confidence_score >= 0.3)  # Lowered threshold

            result = {
                'documentType': 'Ration Card',
                'isValid': is_valid,
                'confidenceScore': self.confidence_score,
                'matchedIdentifiers': matches_found,
                'extractedData': self.matches,
                'validationDetails': {
                    'scores': matches_found,
                    'requiredMinimum': 0.3,
                    'hasDocumentIdentifiers': matches_found['document_identifiers'] > 0,
                    'hasCardNumber': matches_found['card_number'] > 0,
                    'hasCategory': matches_found['category'] > 0,
                    'extractedText': self.extracted_text
                }
            }

            logger.debug(f"Validation result: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in Ration Card validation: {str(e)}")
            return {
                'documentType': 'Ration Card',
                'isValid': False,
                'confidenceScore': 0.0,
                'error': str(e)
            }

    def _extract_additional_info(self) -> Dict[str, str]:
        """Extract additional information from the Ration Card"""
        info = {}
        
        # Extract address
        address_match = re.search(r'ADDRESS\s*[:.]\s*([A-Z0-9\s,/-]+?)(?=\b(?:DISTRICT|PIN|DATE|UNITS)\b|$)', 
                                self.extracted_text)
        if address_match:
            info['address'] = address_match.group(1).strip()

        # Extract district
        district_match = re.search(r'DISTRICT\s*[:.]\s*([A-Z\s]+)', self.extracted_text)
        if district_match:
            info['district'] = district_match.group(1).strip()

        # Extract units/family members
        units_match = re.search(r'UNITS\s*(?:ALLOTED|ALLOCATED)\s*[:.]\s*(\d+)', self.extracted_text)
        if units_match:
            info['units_allocated'] = units_match.group(1)

        # Extract income
        income_match = re.search(r'INCOME\s*(?:OF\s*FAMILY)?\s*[:.]\s*(?:RS\.?\s*)?(\d+)', self.extracted_text)
        if income_match:
            info['family_income'] = income_match.group(1)

        # Extract issue date
        date_match = re.search(r'DATE\s*OF\s*ISSUE\s*[:.]\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', self.extracted_text)
        if date_match:
            info['issue_date'] = date_match.group(1)

        return info

class CasteCertificateValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        
        # Define required patterns with more variations
        required_patterns = {
            "Certificate Title": r"(CASTE CERTIFICATE|OBC CERTIFICATE|SC CERTIFICATE|ST CERTIFICATE|COMMUNITY CERTIFICATE)",
            "Category": r"(OBC|SC|ST|OTHER BACKWARD CLASS|SCHEDULED CASTE|SCHEDULED TRIBE)",
            "Authority": r"(DISTRICT MAGISTRATE|TEHSILDAR|SDM|REVENUE DEPARTMENT|GOVT OF|GOVERNMENT OF)",
            "Certificate Number": r"(CERTIFICATE NO|CERTIFICATE NUMBER|REF NO)[\s.:]*[\w\d/-]+",
            "Validity": r"(THIS CERTIFICATE IS VALID|VALID UPTO|VALIDITY)"
        }
        
        matches_found = 0
        self.matches = {}
        
        # Check each pattern
        for pattern_name, pattern in required_patterns.items():
            match = re.search(pattern, self.extracted_text, re.IGNORECASE)
            if match:
                matches_found += 1
                self.matches[pattern_name] = match.group()
                logger.debug(f"Found {pattern_name}: {match.group()}")
            else:
                logger.debug(f"Missing {pattern_name}")
                self.validation_errors.append(f"Missing {pattern_name}")
        
        # Calculate confidence score based on matches
        confidence_score = matches_found / len(required_patterns)
        
        # Document is valid if at least 3 key patterns are found
        is_valid = matches_found >= 3
        
        return {
            'isValid': is_valid,
            'confidenceScore': confidence_score,
            'documentType': 'Caste Certificate',
            'errors': self.validation_errors if not is_valid else []
        }

class IncomeCertificateValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Title": r"""
                (?:
                    INCOME\s+CERTIFICATE|
                    REVENUE\s+DEPARTMENT.*DELHI|
                    आय\s+प्रमाण\s+पत्र
                )
            """,
            "Income Amount": r"""
                (?:
                    INCOME.*RS\.?\s*[\d,]+|
                    RS\.?\s*[\d,]+.*(?:PER\s+ANNUM|YEARLY|ANNUAL)
                )
            """,
            "Authority": r"""
                (?:
                    TEHSILDAR|
                    DISTRICT\s+MAGISTRATE|
                    REVENUE\s+OFFICER
                )
            """,
            "Certificate Number": r"""
                (?:
                    CERTIFICATE\s+NO:?\s*\d+|
                    CERTIFICATE\s+NUMBER:?\s*\d+
                )
            """
        }
        
        # Check each pattern and count matches
        matches_found = 0
        for pattern_name, pattern in required_patterns.items():
            match = re.search(pattern, self.extracted_text, re.VERBOSE | re.IGNORECASE)
            if match:
                matches_found += 1
                self.matches[pattern_name] = match.group()
                logger.debug(f"Found {pattern_name}: {match.group()}")
            else:
                logger.debug(f"Missing {pattern_name}")
                self.validation_errors.append(f"Missing {pattern_name}")

        # Calculate base confidence score
        base_confidence = matches_found / len(required_patterns)
        
        # Extract additional details
        details = {
            'certificateNumber': self._extract_certificate_number(self.extracted_text),
            'incomeAmount': self._extract_income_amount(self.extracted_text),
            'authority': self._extract_authority(self.extracted_text),
            'issuanceDate': self._extract_date(self.extracted_text),
            'isDigitallySigned': self._check_digital_signature(self.extracted_text)
        }
        
        # Additional confidence boosters
        bonus_confidence = 0
        if details['isDigitallySigned']:
            bonus_confidence += 0.1
        if details['issuanceDate']:
            bonus_confidence += 0.1
        if details['incomeAmount']:
            bonus_confidence += 0.1
            
        # Final confidence score (capped at 1.0)
        final_confidence = min(1.0, base_confidence + bonus_confidence)
        
        return {
            'isValid': matches_found >= 3,  # Valid if at least 3 key patterns are found
            'confidenceScore': final_confidence,
            'documentType': "Income Certificate",
            'errors': self.validation_errors if matches_found < 3 else [],
            'extractedInfo': details
        }
        
        logger.debug(f"Validation result: {result}")
        return result

    def _extract_certificate_number(self, text: str) -> str:
        """Extract certificate number from text"""
        match = re.search(r'CERTIFICATE\s+NO:?\s*(\d+)', text)
        return match.group(1) if match else ""

    def _extract_income_amount(self, text: str) -> str:
        """Extract income amount from text"""
        match = re.search(r'RS\.?\s*([\d,]+)', text)
        if match:
            amount = match.group(1).replace(',', '')
            return f"Rs. {int(amount):,}"
        return ""

    def _extract_authority(self, text: str) -> str:
        """Extract issuing authority from text"""
        authority_patterns = [
            r'TEHSILDAR',
            r'DISTRICT\s+MAGISTRATE',
            r'REVENUE\s+OFFICER'
        ]
        for pattern in authority_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group()
        return ""

    def _extract_date(self, text: str) -> str:
        """Extract issuance date from text"""
        date_patterns = [
            r'DATE:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})',
            r'ISSUED\s+ON:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})',
            r'(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})'
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return ""

    def _check_digital_signature(self, text: str) -> bool:
        """Check if document is digitally signed"""
        digital_sig_patterns = [
            r'DIGITALLY\s+SIGNED',
            r'DIGITAL\s+SIGNATURE',
            r'E-SIGNED'
        ]
        return any(re.search(pattern, text) for pattern in digital_sig_patterns)
    
 

class DisabilityCertificateValidator(BaseDocumentValidator):
    def __init__(self):
        super().__init__()
        self.key_identifiers = {
            'certificate_identifiers': [
                r'DISABILITY\s*CERTIFICATE',
                r'DIVYANG\s*CERTIFICATE',
                r'दिव्यांगता\s*प्रमाण\s*पत्र',
                r'DEPARTMENT\s*OF\s*EMPOWERMENT\s*OF\s*PERSONS\s*WITH\s*DISABILITIES'
            ],
            'disability_types': [
                r'LOCOMOTOR\s*DISABILITY',
                r'VISUAL\s*IMPAIRMENT',
                r'HEARING\s*IMPAIRMENT',
                r'MENTAL\s*(?:DISABILITY|ILLNESS)',
                r'MULTIPLE\s*DISABILITIES',
                r'PHYSICAL\s*DISABILITY',
                r'PARAPARESIS',
                r'LUMBER\s*DISC'
            ],
            'authorities': [
                r'MEDICAL\s*(?:BOARD|AUTHORITY)',
                r'MEDICAL\s*SUPERINTENDENT',
                r'CIVIL\s*SURGEON',
                r'NOTIFIED\s*MEDICAL\s*AUTHORITY',
                r'ISSUING\s*MEDICAL\s*AUTHORITY'
            ],
            'certificate_numbers': [
                r'CERTIFICATE\s*NO\.?[:]?\s*([A-Z0-9/-]+)',
                r'\b[A-Z]{2}\d{16,}\b',  # Format like MH0420619680200284
                r'REG(?:ISTRATION)?\s*NO\.?[:]?\s*([A-Z0-9/-]+)'
            ]
        }

    def validate(self, text: str) -> Dict[str, Any]:
        try:
            self.extracted_text = text.upper()
            self.matches = {}
            self.validation_errors = []
            
            logger.debug(f"Validating Disability Certificate text: {self.extracted_text}")
            
            # Initialize scoring
            matches_found = {
                'certificate_identifiers': 0,
                'disability_type': 0,
                'authority': 0,
                'additional_info': 0
            }

            # Check certificate identifiers
            for pattern in self.key_identifiers['certificate_identifiers']:
                if re.search(pattern, self.extracted_text):
                    matches_found['certificate_identifiers'] += 0.25
                    logger.debug(f"Found certificate identifier: {pattern}")

            # Check disability types
            for pattern in self.key_identifiers['disability_types']:
                match = re.search(pattern, self.extracted_text)
                if match:
                    self.matches['disability_type'] = match.group()
                    matches_found['disability_type'] = 1
                    logger.debug(f"Found disability type: {match.group()}")
                    break

            # Check medical authorities
            for pattern in self.key_identifiers['authorities']:
                if re.search(pattern, self.extracted_text):
                    matches_found['authority'] = 1
                    logger.debug(f"Found medical authority: {pattern}")
                    break

            # Extract additional information
            additional_info = self._extract_additional_info()
            if additional_info:
                matches_found['additional_info'] = len(additional_info) * 0.2
                self.matches.update(additional_info)

            # Calculate weighted confidence score
            weights = {
                'certificate_identifiers': 0.3,
                'disability_type': 0.3,
                'authority': 0.2,
                'additional_info': 0.2
            }
            self.confidence_score = sum(matches_found[k] * weights[k] for k in matches_found)

            # Determine validity with adjusted threshold
            is_valid = (self.confidence_score >= 0.4)

            result = {
                'documentType': 'Disability Certificate',
                'isValid': is_valid,
                'confidenceScore': self.confidence_score,
                'matchedIdentifiers': matches_found,
                'extractedData': self.matches,
                'validationDetails': {
                    'scores': matches_found,
                    'requiredMinimum': 0.4,
                    'hasDocumentIdentifiers': matches_found['certificate_identifiers'] > 0,
                    'hasDisabilityType': matches_found['disability_type'] > 0,
                    'hasAuthority': matches_found['authority'] > 0
                }
            }

            logger.debug(f"Validation result: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in Disability Certificate validation: {str(e)}")
            return {
                'documentType': 'Disability Certificate',
                'isValid': False,
                'confidenceScore': 0.0,
                'error': str(e)
            }

    def _extract_additional_info(self) -> Dict[str, str]:
        """Extract additional information from the Disability Certificate"""
        info = {}
        
        # Extract certificate number
        for pattern in self.key_identifiers['certificate_numbers']:
            match = re.search(pattern, self.extracted_text)
            if match:
                info['certificate_number'] = match.group(1) if '(' in pattern else match.group()
                break

        # Extract disability percentage
        percent_match = re.search(r'(\d{1,3})\s*%.*?(?:PERMANENT\s*)?DISABILITY', self.extracted_text)
        if percent_match:
            info['disability_percentage'] = f"{percent_match.group(1)}%"

        # Extract personal details
        name_match = re.search(r'EXAMINED\s+(?:SHRI|SMT|KUM)\.?\s+([A-Z\s]+?)(?:,|\s+(?:SON|DAUGHTER|WIFE))', self.extracted_text)
        if name_match:
            info['name'] = name_match.group(1).strip()

        # Extract date of issue
        date_match = re.search(r'DATE\s*:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', self.extracted_text)
        if date_match:
            info['issue_date'] = date_match.group(1)

        # Extract address
        address_match = re.search(r'RESIDENT\s+OF\s+([A-Z0-9\s,/-]+?)(?=\s+(?:WHOSE|PHOTO|DATE|DISTRICT|STATE))', self.extracted_text)
        if address_match:
            info['address'] = address_match.group(1).strip()

        return info
        
class BPLCertificateValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Title": r"""
                (?:
                    BELOW\s+POVERTY\s+LINE|
                    BPL\s+CERTIFICATE|
                    गरीबी\s+रेखा\s+प्रमाण\s+पत्र
                )
            """,
            "BPL Number": r"""
                (?:
                    BPL\s+NO\.?\s*:?\s*\d+|
                    CARD\s+NO\.?\s*:?\s*\d+
                )
            """,
            "Authority": r"""
                (?:
                    MUNICIPAL\s+CORPORATION|
                    NAGAR\s+NIGAM|
                    PANCHAYAT|
                    TEHSILDAR
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract BPL number
        bpl_match = re.search(r'BPL\s+NO\.?\s*:?\s*(\d+)', self.extracted_text)
        if bpl_match:
            self.matches['BPLNumber'] = bpl_match.group(1)
            
        # Extract family size
        family_match = re.search(r'FAMILY\s+(?:SIZE|MEMBERS)[\s:]+(\d+)', self.extracted_text)
        if family_match:
            self.matches['FamilySize'] = family_match.group(1)
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("BPL Certificate")

class DomicileCertificateValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Title": r"""
                (?:
                    DOMICILE\s+CERTIFICATE|
                    RESIDENTIAL\s+CERTIFICATE|
                    अधिवास\s+प्रमाण\s+पत्र
                )
            """,
            "Residence Period": r"""
                (?:
                    RESIDING\s+SINCE[\s:]+\d{4}|
                    RESIDENT\s+(?:FOR|SINCE)[\s:]+\d+\s+YEARS?
                )
            """,
            "Authority": r"""
                (?:
                    COLLECTOR|
                    TEHSILDAR|
                    SDM|
                    REVENUE\s+OFFICER
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract state/UT
        state_match = re.search(r'(?:STATE|UT)\s+OF\s+([A-Z\s]+)', self.extracted_text)
        if state_match:
            self.matches['State'] = state_match.group(1).strip()
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Domicile Certificate")

class BirthCertificateValidator(BaseDocumentValidator):
    def __init__(self):
        super().__init__()
        self.key_identifiers = {
            'certificate_identifiers': [
                r'BIRTH\s*CERTIFICATE',
                r'CERTIFICATE\s*OF\s*BIRTH',
                r'जन्म\s*प्रमाण\s*पत्र',
                r'REGISTRATION\s*OF\s*BIRTH',
                r'BIRTH\s*AND\s*DEATH\s*ACT'
            ],
            'registration_numbers': [
                r'(?:REGISTRATION|REG|CERT(?:IFICATE)?)\s*(?:NO|NUMBER)[.:]\s*([A-Z0-9-]+)',
                r'\b\d{4}[-]\d{10,}\b',  # Format like 0122-0701150862
                r'[A-Z]+/\d+/\d+/\d+'
            ],
            'dates': [
                r'(?:DATE\s*OF\s*BIRTH|DOB|BIRTH\s*DATE)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'(?:जन्म\s*तिथि)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})'
            ],
            'authorities': [
                r'MUNICIPAL\s*CORPORATION',
                r'GOVERNMENT\s*OF',
                r'REGISTRAR',
                r'CORPORATION\s*OF',
                r'NAGAR\s*NIGAM'
            ]
        }

    def validate(self, text: str) -> Dict[str, Any]:
        try:
            self.extracted_text = text.upper()
            self.matches = {}
            self.validation_errors = []
            
            logger.debug(f"Validating Birth Certificate text: {self.extracted_text}")
            
            # Initialize scoring
            matches_found = {
                'certificate_identifiers': 0,
                'registration': 0,
                'date_of_birth': 0,
                'additional_info': 0
            }

            # Check certificate identifiers
            for pattern in self.key_identifiers['certificate_identifiers']:
                if re.search(pattern, self.extracted_text):
                    matches_found['certificate_identifiers'] += 0.25
                    logger.debug(f"Found certificate identifier: {pattern}")

            # Check registration numbers
            for pattern in self.key_identifiers['registration_numbers']:
                match = re.search(pattern, self.extracted_text)
                if match:
                    reg_number = match.group(1) if '(' in pattern else match.group()
                    self.matches['registration_number'] = reg_number
                    matches_found['registration'] = 1
                    logger.debug(f"Found registration number: {reg_number}")
                    break

            # Check dates
            for pattern in self.key_identifiers['dates']:
                match = re.search(pattern, self.extracted_text)
                if match:
                    self.matches['date_of_birth'] = match.group(1)
                    matches_found['date_of_birth'] = 1
                    logger.debug(f"Found date of birth: {match.group(1)}")
                    break

            # Extract additional information
            additional_info = self._extract_additional_info()
            if additional_info:
                matches_found['additional_info'] = len(additional_info) * 0.2
                self.matches.update(additional_info)

            # Calculate weighted confidence score
            weights = {
                'certificate_identifiers': 0.3,
                'registration': 0.3,
                'date_of_birth': 0.2,
                'additional_info': 0.2
            }
            self.confidence_score = sum(matches_found[k] * weights[k] for k in matches_found)

            # Determine validity with adjusted threshold
            is_valid = (self.confidence_score >= 0.4)

            result = {
                'documentType': 'Birth Certificate',
                'isValid': is_valid,
                'confidenceScore': self.confidence_score,
                'matchedIdentifiers': matches_found,
                'extractedData': self.matches,
                'validationDetails': {
                    'scores': matches_found,
                    'requiredMinimum': 0.4,
                    'hasDocumentIdentifiers': matches_found['certificate_identifiers'] > 0,
                    'hasRegistration': matches_found['registration'] > 0,
                    'hasDateOfBirth': matches_found['date_of_birth'] > 0
                }
            }

            logger.debug(f"Validation result: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in Birth Certificate validation: {str(e)}")
            return {
                'documentType': 'Birth Certificate',
                'isValid': False,
                'confidenceScore': 0.0,
                'error': str(e)
            }

    def _extract_additional_info(self) -> Dict[str, str]:
        """Extract additional information from the Birth Certificate"""
        info = {}
        
        # Extract name
        name_match = re.search(r'NAME\s*[:.]\s*([A-Z\s]+?)(?=\s+(?:GENDER|SEX|DATE|FATHER|MOTHER))', self.extracted_text)
        if name_match:
            info['name'] = name_match.group(1).strip()

        # Extract gender
        gender_match = re.search(r'(?:GENDER|SEX)\s*[:.]\s*([A-Z]+)', self.extracted_text)
        if gender_match:
            info['gender'] = gender_match.group(1).strip()

        # Extract place of birth
        place_match = re.search(r'PLACE\s*OF\s*BIRTH\s*[:.]\s*([A-Z0-9\s,/-]+?)(?=\s+(?:DATE|MOTHER|FATHER|ADDRESS))', self.extracted_text)
        if place_match:
            info['place_of_birth'] = place_match.group(1).strip()

        # Extract parents' names
        father_match = re.search(r"FATHER['S]*\s*NAME\s*[:.]\s*([A-Z\s]+?)(?=\s+(?:MOTHER|ADDRESS|DATE))", self.extracted_text)
        if father_match:
            info['father_name'] = father_match.group(1).strip()

        mother_match = re.search(r"MOTHER['S]*\s*NAME\s*[:.]\s*([A-Z\s]+?)(?=\s+(?:FATHER|ADDRESS|DATE))", self.extracted_text)
        if mother_match:
            info['mother_name'] = mother_match.group(1).strip()

        # Extract address
        address_match = re.search(r'(?:PRESENT\s*)?ADDRESS\s*[:.]\s*([A-Z0-9\s,/-]+?)(?=\s+(?:DATE|PERMANENT|NOTE|ENSURE))', self.extracted_text)
        if address_match:
            info['address'] = address_match.group(1).strip()

        return info

class MarriageCertificateValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Title": r"""
                (?:
                    MARRIAGE\s+CERTIFICATE|
                    CERTIFICATE\s+OF\s+MARRIAGE|
                    विवाह\s+प्रमाण\s+पत्र
                )
            """,
            "Marriage Date": r"""
                (?:
                    DATE\s+OF\s+MARRIAGE[\s:]+[\d/\-]+|
                    MARRIED\s+ON[\s:]+[\d/\-]+
                )
            """,
            "Registration": r"""
                (?:
                    REGISTRATION\s+NO[\s.:]+[\w/\-]+|
                    CERT(?:IFICATE)?\s+NO[\s.:]+[\w/\-]+
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract spouse names
        bride_match = re.search(r'BRIDE[\s:]+([A-Z\s]+)', self.extracted_text)
        groom_match = re.search(r'GROOM[\s:]+([A-Z\s]+)', self.extracted_text)
        
        if bride_match:
            self.matches['BrideName'] = bride_match.group(1).strip()
        if groom_match:
            self.matches['GroomName'] = groom_match.group(1).strip()
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Marriage Certificate")

class BankPassbookValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Bank Name": r"""
                (?:
                    [A-Z]+\s+BANK|
                    BANK\s+OF\s+[A-Z]+|
                    बैंक[\s:]+[A-Z\s]+
                )
            """,
            "Account Number": r"""
                (?:
                    A/?C\s+NO[\s.:]+\d+|
                    ACCOUNT\s+NO[\s.:]+\d+|
                    खाता\s+संख्या[\s:]+\d+
                )
            """,
            "IFSC": r"""
                (?:
                    IFSC[\s:]+[A-Z]{4}[0-9]{7}|
                    IFSC\s+CODE[\s:]+[A-Z]{4}[0-9]{7}
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract account holder name
        name_match = re.search(r'NAME[\s:]+([A-Z\s]+)', self.extracted_text)
        if name_match:
            self.matches['AccountHolder'] = name_match.group(1).strip()
            
        # Extract IFSC code
        ifsc_match = re.search(r'IFSC[\s:]+([A-Z]{4}[0-9]{7})', self.extracted_text)
        if ifsc_match:
            self.matches['IFSCCode'] = ifsc_match.group(1)
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Bank Passbook")

class EmploymentCertificateValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Title": r"""
                (?:
                    EMPLOYMENT\s+CERTIFICATE|
                    EXPERIENCE\s+CERTIFICATE|
                    SERVICE\s+CERTIFICATE|
                    नियुक्ति\s+प्रमाण\s+पत्र
                )
            """,
            "Employee ID": r"""
                (?:
                    EMPLOYEE\s+ID[\s.:]+[\w\d]+|
                    EMP[\s.]*ID[\s.:]+[\w\d]+|
                    STAFF\s+ID[\s.:]+[\w\d]+
                )
            """,
            "Designation": r"""
                (?:
                    DESIGNATION[\s.:]+[A-Z\s]+|
                    POST[\s.:]+[A-Z\s]+|
                    पद[\s.:]+[A-Z\s]+
                )
            """,
            "Organization": r"""
                (?:
                    ORGANIZATION[\s.:]+[A-Z\s]+|
                    COMPANY[\s.:]+[A-Z\s]+|
                    EMPLOYER[\s.:]+[A-Z\s]+
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract joining date
        join_match = re.search(r'(?:DATE\s+OF\s+JOINING|JOIN(?:ED)?\s+ON)[\s.:]+(\d{1,2}[-/]\d{1,2}[-/]\d{4})', self.extracted_text)
        if join_match:
            self.matches['JoiningDate'] = join_match.group(1)
            
        # Extract salary details if present
        salary_match = re.search(r'SALARY[\s.:]+(?:RS\.?\s*)([\d,]+)', self.extracted_text)
        if salary_match:
            self.matches['Salary'] = f"Rs. {salary_match.group(1)}"
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Employment Certificate")

class EducationalCertificateValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Type": r"""
                (?:
                    DEGREE\s+CERTIFICATE|
                    DIPLOMA\s+CERTIFICATE|
                    MARKSHEET|
                    PROVISIONAL\s+CERTIFICATE|
                    CONSOLIDATED\s+MARKSHEET
                )
            """,
            "Institution": r"""
                (?:
                    UNIVERSITY[\s.:]+[A-Z\s]+|
                    BOARD[\s.:]+[A-Z\s]+|
                    INSTITUTE[\s.:]+[A-Z\s]+|
                    COLLEGE[\s.:]+[A-Z\s]+
                )
            """,
            "Student Details": r"""
                (?:
                    ROLL\s+NO[\s.:]+[\w\d]+|
                    ENROLLMENT\s+NO[\s.:]+[\w\d]+|
                    REGISTRATION\s+NO[\s.:]+[\w\d]+
                )
            """,
            "Course": r"""
                (?:
                    COURSE[\s.:]+[A-Z\s]+|
                    PROGRAM(?:ME)?[\s.:]+[A-Z\s]+|
                    BRANCH[\s.:]+[A-Z\s]+
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract academic year
        year_match = re.search(r'(?:YEAR|SESSION)[\s.:]+(\d{4}[-\s]?\d{2,4})', self.extracted_text)
        if year_match:
            self.matches['AcademicYear'] = year_match.group(1)
            
        # Extract grade/percentage if present
        grade_match = re.search(r'(?:GRADE|CGPA|PERCENTAGE)[\s.:]+([A-Z0-9.]+%?)', self.extracted_text)
        if grade_match:
            self.matches['Grade'] = grade_match.group(1)
            
        # Extract result if present
        result_match = re.search(r'RESULT[\s.:]+([A-Z\s]+)', self.extracted_text)
        if result_match:
            self.matches['Result'] = result_match.group(1).strip()
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Educational Certificate")

class PropertyDocumentValidator(BaseDocumentValidator):
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Document Type": r"""
                (?:
                    SALE\s+DEED|
                    LEASE\s+DEED|
                    PROPERTY\s+CARD|
                    7/12\s+EXTRACT|
                    TITLE\s+DEED|
                    CONVEYANCE\s+DEED
                )
            """,
            "Property Details": r"""
                (?:
                    SURVEY\s+NO[\s.:]+[\w\d/\-]+|
                    PLOT\s+NO[\s.:]+[\w\d/\-]+|
                    FLAT\s+NO[\s.:]+[\w\d/\-]+|
                    PROPERTY\s+ID[\s.:]+[\w\d/\-]+
                )
            """,
            "Registration": r"""
                (?:
                    REGISTRATION\s+NO[\s.:]+[\w\d/\-]+|
                    DOCUMENT\s+NO[\s.:]+[\w\d/\-]+|
                    INDEX\s+(?:NO|NUMBER)[\s.:]+[\w\d/\-]+
                )
            """,
            "Location": r"""
                (?:
                    LOCATED\s+AT[\s.:]+[A-Z0-9\s,/\-]+|
                    ADDRESS[\s.:]+[A-Z0-9\s,/\-]+|
                    SITUATED\s+AT[\s.:]+[A-Z0-9\s,/\-]+
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract property area if present
        area_match = re.search(r'AREA[\s.:]+(\d+(?:\.\d+)?)\s*(SQ\.?\s*(?:FT|MTR|METER|YARD|M))', self.extracted_text)
        if area_match:
            self.matches['PropertyArea'] = f"{area_match.group(1)} {area_match.group(2)}"
            
        # Extract transaction value if present
        value_match = re.search(r'(?:CONSIDERATION|VALUE|AMOUNT)[\s.:]+(?:RS\.?\s*)([\d,]+)', self.extracted_text)
        if value_match:
            self.matches['TransactionValue'] = f"Rs. {value_match.group(1)}"
            
        # Extract date of execution
        date_match = re.search(r'(?:EXECUTION\s+DATE|DATE\s+OF\s+DEED)[\s.:]+(\d{1,2}[-/]\d{1,2}[-/]\d{4})', self.extracted_text)
        if date_match:
            self.matches['ExecutionDate'] = date_match.group(1)
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Property Document")

# Update the validator mapping in your main application:
DOCUMENT_VALIDATORS = {
    'Aadhar Card': AadharValidator(),
    'PAN Card': PANCardValidator(),
    'Caste Certificate': CasteCertificateValidator(),
    'Ration Card': RationCardValidator(),
    'Voter ID': VoterIDValidator(),
    'Driving License': DrivingLicenseValidator(),
    'Income Certificate': IncomeCertificateValidator(),
    'Disability Certificate': DisabilityCertificateValidator(),
    'BPL Certificate': BPLCertificateValidator(),
    'Domicile Certificate': DomicileCertificateValidator(),
    'Birth Certificate': BirthCertificateValidator(),
    'Marriage Certificate': MarriageCertificateValidator(),
    'Bank Passbook': BankPassbookValidator(),
    'Employment Certificate': EmploymentCertificateValidator(),
    'Educational Certificates': EducationalCertificateValidator(),
    'Property Documents': PropertyDocumentValidator()
}