#!/usr/bin/env bash
# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Script Build Nhanh Production Cho Linux
# ======================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  HE THONG QUAN LY KHAO THI - BUILD PRODUCTION (LINUX)${NC}"
echo -e "${CYAN}======================================================================${NC}\n"

cd "${ROOT_DIR}/backend"
echo -e "${YELLOW}[+] 1/3 Sinh Prisma Client...${NC}"
npx prisma generate

echo -e "${YELLOW}[+] 2/3 Build Backend (NestJS)...${NC}"
npm run build

cd "${ROOT_DIR}/frontend"
echo -e "${YELLOW}[+] 3/3 Build Frontend (Next.js Standalone)...${NC}"
npm run build

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  [THANH CONG] BUILD TOAN BO THANH CONG!${NC}"
echo -e "${GREEN}======================================================================${NC}\n"
