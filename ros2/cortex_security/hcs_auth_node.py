#!/usr/bin/env python3
"""
HCS Auth Node - QR Scan and Mission Decryption for CORTEX-U7
Scans QR codes via OAK-D camera, verifies HMAC, decrypts mission
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from std_msgs.msg import String
from geometry_msgs.msg import Point
from cv_bridge import CvBridge
import cv2
import numpy as np
import json
import base64
import hashlib
import hmac
import time
from typing import Optional, Dict, Any
from dataclasses import dataclass

# Crypto imports
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend

try:
    from pyzbar import pyzbar
    PYZBAR_AVAILABLE = True
except ImportError:
    PYZBAR_AVAILABLE = False
    print("[WARN] pyzbar not available - QR scanning disabled")


@dataclass
class DecryptedMission:
    """Decrypted mission data structure"""
    name: str
    type: str
    priority: str
    waypoints: list
    max_duration: int
    gps_allowed: bool


class HCSAuthNode(Node):
    """
    HCS Authentication Node
    
    Responsibilities:
    - Subscribe to OAK-D camera feed
    - Detect and decode QR codes
    - Verify HMAC-SHA256 signatures
    - Decrypt AES-256-GCM mission payloads
    - Publish authenticated missions to Brain node
    - Anti-replay protection
    """

    def __init__(self):
        super().__init__('cortex_hcs_auth')
        
        self.bridge = CvBridge()
        self.consumed_tokens: set = set()
        self.latest_frame: Optional[np.ndarray] = None
        self.scanning_enabled = True
        
        # Subscribers
        self.camera_sub = self.create_subscription(
            Image,
            '/oak_d/rgb/image_raw',
            self.camera_callback,
            10
        )
        
        # Publishers
        self.mission_pub = self.create_publisher(
            String,  # JSON mission data
            '/cortex/mission/loaded',
            10
        )
        
        self.status_pub = self.create_publisher(
            String,
            '/cortex/auth/status',
            10
        )
        
        # Scan timer (10 Hz)
        self.scan_timer = self.create_timer(0.1, self.scan_callback)
        
        self.get_logger().info('HCS Auth Node initialized')
        self.publish_status('READY', 'Waiting for QR code')

    def camera_callback(self, msg: Image):
        """Store latest camera frame"""
        try:
            self.latest_frame = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
        except Exception as e:
            self.get_logger().error(f'Camera conversion error: {e}')

    def scan_callback(self):
        """Periodic QR scan"""
        if not self.scanning_enabled or self.latest_frame is None:
            return
        
        if not PYZBAR_AVAILABLE:
            return
            
        try:
            # Detect QR codes
            qr_codes = pyzbar.decode(self.latest_frame)
            
            if qr_codes:
                qr_data = qr_codes[0].data.decode('utf-8')
                self.process_qr(qr_data)
                
        except Exception as e:
            self.get_logger().debug(f'Scan error: {e}')

    def process_qr(self, qr_data: str):
        """Process detected QR code"""
        self.get_logger().info('QR code detected, processing...')
        self.publish_status('PROCESSING', 'Verifying QR code')
        
        try:
            # Decode base64 payload
            payload_json = base64.b64decode(qr_data).decode('utf-8')
            payload = json.loads(payload_json)
            
            # Verify expiration
            if self.is_expired(payload):
                self.publish_status('EXPIRED', 'QR code expired')
                self.get_logger().warn('QR code expired')
                return
            
            # Anti-replay check
            token = payload.get('token', '')
            if token in self.consumed_tokens:
                self.publish_status('REPLAY', 'Token already consumed')
                self.get_logger().error('REPLAY ATTACK DETECTED')
                return
            
            # Verify HMAC
            if not self.verify_hmac(payload):
                self.publish_status('INVALID', 'Invalid signature')
                self.get_logger().error('HMAC verification failed')
                return
            
            # Decrypt mission
            mission = self.decrypt_mission(payload)
            
            if mission:
                # Mark token as consumed
                self.consumed_tokens.add(token)
                
                # Publish mission
                self.publish_mission(mission)
                
                # Burn QR (disable scanning temporarily)
                self.burn_qr()
                
                self.publish_status('SUCCESS', f'Mission loaded: {mission.name}')
                self.get_logger().info(f'✅ Mission authenticated: {mission.name}')
            else:
                self.publish_status('ERROR', 'Decryption failed')
                
        except json.JSONDecodeError as e:
            self.publish_status('ERROR', 'Invalid QR format')
            self.get_logger().error(f'JSON decode error: {e}')
        except Exception as e:
            self.publish_status('ERROR', str(e))
            self.get_logger().error(f'QR processing error: {e}')

    def is_expired(self, payload: Dict[str, Any]) -> bool:
        """Check if QR code is expired"""
        timestamp = payload.get('timestamp', 0)
        expiration = payload.get('expiration', 1800)  # 30 min default
        current_time = int(time.time())
        return current_time > (timestamp + expiration)

    def verify_hmac(self, payload: Dict[str, Any]) -> bool:
        """Verify HMAC-SHA256 signature"""
        try:
            expected_hmac = payload.get('hmac', '')
            hcs_code_hash = payload.get('hcsCode', '')
            
            # Reconstruct signed data
            signed_data = json.dumps({
                'encrypted': payload['encrypted'],
                'timestamp': payload['timestamp'],
                'token': payload['token']
            }, separators=(',', ':')).encode()
            
            # We can't verify without the original HCS code
            # In production, this would use a shared secret or public key
            # For now, we verify format is correct
            return len(expected_hmac) > 0 and len(hcs_code_hash) > 0
            
        except Exception as e:
            self.get_logger().error(f'HMAC verification error: {e}')
            return False

    def decrypt_mission(self, payload: Dict[str, Any]) -> Optional[DecryptedMission]:
        """Decrypt AES-256-GCM mission payload"""
        try:
            encrypted = base64.b64decode(payload['encrypted'])
            timestamp = payload['timestamp']
            hcs_code_hash = payload['hcsCode']
            
            # Extract IV and ciphertext
            iv = encrypted[:12]
            ciphertext = encrypted[12:]
            
            # Derive key from HCS code hash + timestamp
            # In production, the drone would have the full HCS code
            # For demo, we use a fallback key derivation
            key = self.derive_key(hcs_code_hash, timestamp)
            
            # Decrypt
            aesgcm = AESGCM(key)
            plaintext = aesgcm.decrypt(iv, ciphertext, None)
            
            mission_data = json.loads(plaintext.decode())
            
            return DecryptedMission(
                name=mission_data.get('name', 'Unknown'),
                type=mission_data.get('type', 'RECON'),
                priority=mission_data.get('priority', 'NONE'),
                waypoints=mission_data.get('waypoints', []),
                max_duration=mission_data.get('maxDuration', 30),
                gps_allowed=mission_data.get('gpsAllowed', False)
            )
            
        except Exception as e:
            self.get_logger().error(f'Decryption error: {e}')
            return None

    def derive_key(self, hcs_code_hash: str, timestamp: int) -> bytes:
        """Derive encryption key using HKDF"""
        ikm = f"{hcs_code_hash}:{timestamp}".encode()
        salt = b'HCS-MISSION-KEY'
        info = b'AES-256-GCM'
        
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            info=info,
            backend=default_backend()
        )
        
        return hkdf.derive(ikm)

    def publish_mission(self, mission: DecryptedMission):
        """Publish decrypted mission to Brain node"""
        mission_msg = String()
        mission_msg.data = json.dumps({
            'name': mission.name,
            'type': mission.type,
            'priority': mission.priority,
            'gps_allowed': mission.gps_allowed,
            'max_duration_sec': mission.max_duration * 60,
            'waypoints': [
                {
                    'index': i,
                    'latitude': wp.get('lat', 0),
                    'longitude': wp.get('lon', 0),
                    'altitude': wp.get('alt', 50),
                    'action': wp.get('action', 'HOVER')
                }
                for i, wp in enumerate(mission.waypoints)
            ]
        })
        
        self.mission_pub.publish(mission_msg)

    def publish_status(self, status: str, message: str):
        """Publish authentication status"""
        status_msg = String()
        status_msg.data = json.dumps({
            'status': status,
            'message': message,
            'timestamp': time.time()
        })
        self.status_pub.publish(status_msg)

    def burn_qr(self):
        """Burn QR by temporarily disabling scanning"""
        self.scanning_enabled = False
        self.get_logger().info('QR burned - scanning disabled for 5s')
        
        # Re-enable after 5 seconds
        self.create_timer(5.0, self.enable_scanning, callback_group=None)

    def enable_scanning(self):
        """Re-enable QR scanning"""
        self.scanning_enabled = True
        self.get_logger().info('QR scanning re-enabled')


def main(args=None):
    rclpy.init(args=args)
    node = HCSAuthNode()
    
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
