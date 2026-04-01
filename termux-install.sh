#!/data/data/com.termux/files/usr/bin/bash
# WA Control — Termux first-time installation
# Run once before termux-start.sh:  bash termux-install.sh

set -e
cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[install]${NC} $*"; }
warn() { echo -e "${YELLOW}[install]${NC} $*"; }

info "Updating package list..."
pkg update -y

info "Installing core packages..."
pkg install -y nodejs postgresql git

info "Installing pnpm..."
npm install -g pnpm

# ── PostgreSQL setup ─────────────────────────────────────────────────────────
info "Setting up PostgreSQL..."
PGDATA="$PREFIX/var/lib/postgresql"

if [ ! -d "$PGDATA/base" ]; then
  info "Initialising PostgreSQL cluster..."
  initdb "$PGDATA"
fi

# Start PostgreSQL (safe to run if already running)
pg_ctl -D "$PGDATA" -l "$PGDATA/pg.log" start 2>/dev/null || true
sleep 2

# Create the database
createdb wacontrol 2>/dev/null && info "Created database 'wacontrol'" || warn "Database 'wacontrol' already exists — skipping"

export DATABASE_URL="postgresql://$(whoami)@localhost:5432/wacontrol"
info "DATABASE_URL = $DATABASE_URL"

# ── Persist DATABASE_URL in shell profile ────────────────────────────────────
PROFILE="$HOME/.bashrc"
if ! grep -q "wacontrol" "$PROFILE" 2>/dev/null; then
  echo "" >> "$PROFILE"
  echo "# WA Control" >> "$PROFILE"
  echo "export DATABASE_URL=\"postgresql://$(whoami)@localhost:5432/wacontrol\"" >> "$PROFILE"
  info "DATABASE_URL added to $PROFILE"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "To start WA Control run:"
echo ""
echo "    bash termux-start.sh"
echo ""
