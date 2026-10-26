# OpenSource Navigator AI - Guaranteed Google Colab Runner
# Run each cell in order on Google Colab with T4 GPU enabled (Runtime -> Change runtime type -> T4 GPU)

# ========================================================
# CELL 1: Install Ollama, CUDA tools, and Cloudflared
# ========================================================
# !sudo apt update -qq && sudo apt install -y -qq pciutils
# !curl -fsSL https://ollama.com/install.sh | sh
# !wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
# !dpkg -i cloudflared-linux-amd64.deb

# ========================================================
# CELL 2: Start Ollama with Open Origins & Host Binding
# ========================================================
# !OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" nohup ollama serve > /content/ollama.log 2>&1 &
# !sleep 5
# !curl -s http://127.0.0.1:11434/

# ========================================================
# CELL 3: Download Model (deepseek-r1:8b)
# ========================================================
# !ollama pull deepseek-r1:8b

# ========================================================
# CELL 4: Start Tunnel with Host Header Rewrite (Fixes Error 1033)
# ========================================================
# !cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header="localhost:11434"
