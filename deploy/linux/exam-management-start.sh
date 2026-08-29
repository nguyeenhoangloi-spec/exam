#!/usr/bin/env bash
# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Script Khoi Dong Production Mode Cho Linux
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
    echo -e "${YELLOW}[CANH BAO] Chua phat hien ban build. Dang tu dong build...${NC}"
    "${SCRIPT_DIR}/exam-management-build.sh"
fi

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  DANG KHOI DONG HE THONG QUAN LY KHAO THI (PRODUCTION)${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo -e "  - Frontend Web Portal: ${BLUE}http://localhost:3000${NC}"
echo -e "  - Backend API:         ${BLUE}http://localhost:3001${NC}"
echo -e "  (Nhan Ctrl + C de dung he thong)\n"

npm run start
