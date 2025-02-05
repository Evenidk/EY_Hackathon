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
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Electoral Photo ID": r"""
                (?:
                    ELECTORAL\s+PHOTO\s+ID|
                    ELECTION\s+COMMISSION|
                    VOTER\s+ID|
                    मतदाता\s+फोटो
                )
            """,
            "EPIC Number": r"""
                (?:
                    [A-Z]{3}\d{7}|
                    EPIC\s+NO[.:]\s*[A-Z]{3}\d{7}
                )
            """,
            "Election Commission": r"""
                (?:
                    ELECTION\s+COMMISSION\s+OF\s+INDIA|
                    भारत\s+निर्वाचन\s+आयोग
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        
        # Extract specific details
        epic_match = re.search(r'[A-Z]{3}\d{7}', self.extracted_text)
        if epic_match:
            self.matches['EPIC_Number'] = epic_match.group()
            
        return self._generate_response("Voter ID")

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
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Ration Card Number": r"""
                (?:
                    [A-Z]{2,3}[-/]\d{6,10}|
                    CARD\s*NO[.:]\s*[A-Z0-9/-]+
                )
            """,
            "Category": r"""
                (?:
                    APL|BPL|AAY|PHH|
                    PRIORITY\s+HOUSEHOLD|
                    ANTYODAYA
                )
            """,
            "Department": r"""
                (?:
                    DEPARTMENT\s+OF\s+FOOD|
                    FOOD\s+AND\s+CIVIL\s+SUPPLIES|
                    खाद्य\s+विभाग
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract family members count
        family_match = re.search(r'FAMILY\s+MEMBERS[:\s]+(\d+)', self.extracted_text)
        if family_match:
            self.matches['FamilyMembers'] = family_match.group(1)
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Ration Card")

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
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Title": r"""
                (?:
                    DISABILITY\s+CERTIFICATE|
                    DIVYANG\s+CERTIFICATE|
                    दिव्यांगता\s+प्रमाण\s+पत्र
                )
            """,
            "Disability Type": r"""
                (?:
                    LOCOMOTOR|VISUAL|HEARING|
                    MENTAL|MULTIPLE|
                    PHYSICAL\s+DISABILITY
                )
            """,
            "Medical Authority": r"""
                (?:
                    MEDICAL\s+BOARD|
                    MEDICAL\s+SUPERINTENDENT|
                    CIVIL\s+SURGEON
                )
            """
        }
        
        self.validate_text_presence(required_patterns)
        
        # Extract disability percentage
        percent_match = re.search(r'(\d{1,3})%?\s*(?:PERMANENT\s+)?DISABILITY', self.extracted_text)
        if percent_match:
            self.matches['DisabilityPercentage'] = f"{percent_match.group(1)}%"
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Disability Certificate")
        
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
    def validate(self, text: str) -> Dict[str, Any]:
        self.extracted_text = text.upper()
        self.validation_errors = []
        self.matches = {}
        
        required_patterns = {
            "Certificate Title": r"""
                (?:
                    BIRTH\s+CERTIFICATE|
                    CERTIFICATE\s+OF\s+BIRTH|
                    जन्म\s+प्रमाण\s+पत्र
                )
            """,
            "Date of Birth": r"""
                (?:
                    DATE\s+OF\s+BIRTH[\s:]+[\d/\-]+|
                    DOB[\s:]+[\d/\-]+|
                    जन्म\s+तिथि[\s:]+[\d/\-]+
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
        
        # Extract specific details
        dob_match = re.search(r'(?:DATE\s+OF\s+BIRTH|DOB)[\s:]+(\d{1,2}[-/]\d{1,2}[-/]\d{4})', self.extracted_text)
        if dob_match:
            self.matches['DateOfBirth'] = dob_match.group(1)
            
        place_match = re.search(r'PLACE\s+OF\s+BIRTH[\s:]+([A-Z\s,]+)', self.extracted_text)
        if place_match:
            self.matches['PlaceOfBirth'] = place_match.group(1).strip()
            
        self.confidence_score = self.calculate_confidence(len(required_patterns))
        return self._generate_response("Birth Certificate")

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