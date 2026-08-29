#!/usr/bin/env bash
# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Script Cai Dat & Build Tu Dong Cho Linux (Ubuntu / Debian / CentOS)
# ======================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  HE THONG QUAN LY KHAO THI - AUTO INSTALLER CHO LINUX${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo ""

# 1. Kiem tra Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[LOI] Khong tim thay Node.js tren he thong!${NC}"
    echo -e "${YELLOW}Vui long cai dat Node.js 18+ hoac 20+ (vi du: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs)${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}[+] Da tim thay Node.js: ${NODE_VERSION}${NC}"

# 2. Kiem tra npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[LOI] Khong tim thay npm!${NC}"
    exit 1
fi

# 3. Tao file .env neu chua co
echo -e "\n${YELLOW}[+] Kiem tra file cau hinh moi truong (.env)...${NC}"
if [ ! -f "${ROOT_DIR}/.env" ]; then
    if [ -f "${ROOT_DIR}/.env.example" ]; then
        cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
        echo -e "${GREEN}[OK] Da tao file .env tu .env.example. Hay kiem tra DATABASE_URL khi can thiet.${NC}"
    fi
else
    echo -e "${GREEN}[OK] File .env da ton tai.${NC}"
fi

if [ ! -f "${ROOT_DIR}/frontend/.env.local" ]; then
    if [ -f "${ROOT_DIR}/frontend/.env.example" ]; then
        cp "${ROOT_DIR}/frontend/.env.example" "${ROOT_DIR}/frontend/.env.local"
        echo -e "${GREEN}[OK] Da tao frontend/.env.local${NC}"
    fi
fi

# 4. Cai dat dependencies Root
echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}[+] Dang cai dat dependencies cho Root...${NC}"
echo -e "${CYAN}======================================================================${NC}"
cd "${ROOT_DIR}"
npm install

# 5. Cai dat Backend & Prisma
echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}[+] Dang cai dat dependencies cho Backend (NestJS, Prisma)...${NC}"
echo -e "${CYAN}======================================================================${NC}"
cd "${ROOT_DIR}/backend"
npm install --legacy-peer-deps

echo -e "${YELLOW}[+] Dang sinh Prisma Client...${NC}"
npx prisma generate

# 6. Cai dat Frontend
echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}[+] Dang cai dat dependencies cho Frontend (Next.js)...${NC}"
echo -e "${CYAN}======================================================================${NC}"
cd "${ROOT_DIR}/frontend"
npm install --legacy-peer-deps

# 7. Build Production
echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}[+] Dang Build Production toan bo he thong...${NC}"
echo -e "${CYAN}======================================================================${NC}"
cd "${ROOT_DIR}"
npm run build

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  [THANH CONG] CAI DAT VA BUILD HE THONG HOAN TAT!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "  - Khoi chay he thong:   ${YELLOW}./deploy/linux/exam-management-start.sh${NC} hoac ${YELLOW}npm start${NC}"
echo -e "  - Backend API:          ${BLUE}http://localhost:3001${NC}"
echo -e "  - Frontend Web Portal:  ${BLUE}http://localhost:3000${NC}"
echo -e "  - Cai dat Systemd auto-start khi boot may: ${YELLOW}sudo ./deploy/linux/systemd/install-services.sh${NC}"
echo -e "${GREEN}======================================================================${NC}\n"
