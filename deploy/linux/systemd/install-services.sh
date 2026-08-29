#!/usr/bin/env bash
# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Script Cai Dat Systemd Services (Chay tu dong khi bat Linux Server)
# ======================================================================

set -e

if [ "$EUID" -ne 0 ]; then
    echo "[LOI] Vui long chay script voi quyen root hoac sudo: sudo $0"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

echo "[+] Dang copy cac service file vao /etc/systemd/system/..."
cp "${SCRIPT_DIR}/exam-management-backend.service" /etc/systemd/system/
cp "${SCRIPT_DIR}/exam-management-frontend.service" /etc/systemd/system/

# Thay the duong dan /opt/exam-management thanh thu muc hien tai neu khac
sed -i "s|/opt/exam-management|${ROOT_DIR}|g" /etc/systemd/system/exam-management-backend.service
sed -i "s|/opt/exam-management|${ROOT_DIR}|g" /etc/systemd/system/exam-management-frontend.service

# Thay the User thanh user hien tai neu khong co user exam
CURRENT_USER="${SUDO_USER:-$USER}"
if ! id "exam" &>/dev/null; then
    echo "[+] Khong tim thay user 'exam', tu dong su dung user '${CURRENT_USER}'..."
    sed -i "s|User=exam|User=${CURRENT_USER}|g" /etc/systemd/system/exam-management-backend.service
    sed -i "s|Group=exam|Group=${CURRENT_USER}|g" /etc/systemd/system/exam-management-backend.service
    sed -i "s|User=exam|User=${CURRENT_USER}|g" /etc/systemd/system/exam-management-frontend.service
    sed -i "s|Group=exam|Group=${CURRENT_USER}|g" /etc/systemd/system/exam-management-frontend.service
fi

echo "[+] Reload systemd daemon..."
systemctl daemon-reload

echo "[+] Enable services khoi dong cung he thong..."
systemctl enable exam-management-backend.service
systemctl enable exam-management-frontend.service

echo "[+] Khoi dong services..."
systemctl restart exam-management-backend.service
systemctl restart exam-management-frontend.service

echo ""
echo "======================================================================"
echo "  [THANH CONG] SYSTEMD SERVICES DA DUOC KHOI DONG!"
echo "  - Kiem tra backend:  systemctl status exam-management-backend"
echo "  - Kiem tra frontend: systemctl status exam-management-frontend"
echo "  - Xem logs backend:  journalctl -u exam-management-backend -f"
echo "  - Xem logs frontend: journalctl -u exam-management-frontend -f"
echo "======================================================================"
