#!/usr/bin/env bash
# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Script Khoi Dong Bang Docker Compose Cho Linux
# ======================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}[LOI] Khong tim thay Docker tren he thong Linux!${NC}"
    echo -e "${YELLOW}Vui long cai dat Docker va Docker Compose plugin.${NC}"
    exit 1
fi

cd "${ROOT_DIR}"
echo -e "${CYAN}[+] Dang build va khoi dong cac container qua Docker Compose...${NC}"
docker compose up --build -d

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  [THANH CONG] CAC CONTAINER DANG CHAY NGAM TREN LINUX!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "  - Frontend Web:  ${BLUE}http://localhost:3000${NC}"
echo -e "  - Backend API:   ${BLUE}http://localhost:3001${NC}"
echo -e "  - PostgreSQL:    ${BLUE}localhost:5432${NC}"
echo -e "  - Xem logs:      ${YELLOW}docker compose logs -f${NC}"
echo -e "  - Dung he thong: ${YELLOW}docker compose down${NC} hoac ${YELLOW}./deploy/linux/exam-management-docker-down.sh${NC}"
echo -e "${GREEN}======================================================================${NC}\n"
