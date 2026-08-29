#!/usr/bin/env bash
# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Script Dong Goi Native Desktop App (.AppImage & .deb) Cho Linux
# ======================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

export CSC_IDENTITY_AUTO_DISCOVERY=false

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  HE THONG QUAN LY KHAO THI - DONG GOI DESKTOP APP (.APPIMAGE / .DEB)${NC}"
echo -e "${CYAN}======================================================================${NC}\n"

cd "${ROOT_DIR}"
echo -e "${YELLOW}[+] 1/3 Bien dich Backend va Frontend...${NC}"
npm run package:release

echo -e "\n${YELLOW}[+] 2/3 Kiem tra dependencies cho Desktop...${NC}"
cd "${ROOT_DIR}/desktop"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}[+] 3/3 Dang dong goi thanh file .AppImage va .deb...${NC}"
echo -e "${CYAN}======================================================================${NC}"
npm run dist:linux

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  [THANH CONG] FILE DESKTOP APP DA DUOC TAO TAI:${NC}"
echo -e "  - release-desktop/ExamManagement-1.0.0.AppImage"
echo -e "  - release-desktop/ExamManagement-1.0.0.deb"
echo -e "${GREEN}======================================================================${NC}\n"
