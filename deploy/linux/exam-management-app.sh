#!/usr/bin/env bash
# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   1-Click All-in-One Desktop App Launcher (Linux)
# ======================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${ROOT_DIR}"

if [ ! -f "${ROOT_DIR}/backend/dist/src/main.js" ] || [ ! -d "${ROOT_DIR}/frontend/.next" ]; then
    echo -e "${YELLOW}[+] Phat hien he thong chua duoc build. Dang tu dong cai dat va bien dich...${NC}"
    "${SCRIPT_DIR}/exam-management-install.sh"
fi

# Tu dong mo cua so App sau 3 giay trong background
(
    sleep 3
    if command -v google-chrome &> /dev/null; then
        google-chrome --app="http://localhost:3000" &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser --app="http://localhost:3000" &
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000" &
    fi
) &

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  DANG KHOI CHAY HE THONG EXAM MANAGEMENT SYSTEM${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo -e "  - Frontend Web/App: ${BLUE}http://localhost:3000${NC}"
echo -e "  - Backend API:      ${BLUE}http://localhost:3001${NC}"
echo -e "  (Nhan Ctrl + C de dung he thong)\n"

npm run start
