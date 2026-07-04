import subprocess
import os
import sys

# Đảm bảo in được tiếng Việt trên console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_cmd(cmd, check=True):
    result = subprocess.run(cmd, shell=True, text=True, capture_output=True, encoding='utf-8')
    if check and result.returncode != 0:
        print(f"Error executing command: {cmd}")
        print(result.stderr)
        sys.exit(1)
    return result.stdout.strip()

def main():
    print("Kiểm tra các file thay đổi từ Git...")
    status_output = run_cmd("git status --porcelain", check=True)
    slugs_to_process = set()
    
    for line in status_output.split('\n'):
        if not line:
            continue
        # Dạng của line: ' M data/articles/minhthonggiam.json' hoặc '?? data/articles/...'
        path = line[3:].strip()
        
        # Kiểm tra xem có nằm trong thư mục articles và là file JSON không
        if path.startswith("data/articles/") and path.endswith(".json"):
            filename = os.path.basename(path)
            slug = filename[:-5]
            slugs_to_process.add(slug)
            
    if not slugs_to_process:
        print("Không tìm thấy bài viết nào bị thay đổi. Hoàn tất!")
        return
        
    print(f"Tìm thấy {len(slugs_to_process)} bài viết cần cập nhật audio: {', '.join(slugs_to_process)}\n")
    
    for slug in slugs_to_process:
        audio_path = os.path.join("public", "audio", f"{slug}.mp3")
        if os.path.exists(audio_path):
            print(f"Xóa audio cũ: {audio_path}")
            os.remove(audio_path)
            
        print(f"-> Đang tạo lại audio cho: {slug}")
        # Chạy script sinh audio. Dùng run trực tiếp để in log realtime ra console
        res = subprocess.run(f"node scripts/generate-gcp-audio.js {slug}", shell=True)
        if res.returncode != 0:
            print(f"Lỗi khi tạo audio cho {slug}! Dừng quy trình.")
            sys.exit(1)
        print("-" * 40)
        
    print("\nCommit và Push lên GitHub...")
    subprocess.run("git add .", shell=True, check=True)
    
    # Lệnh commit có thể fail nếu không có gì để commit (dù hiếm vì ít nhất có mp3 mới)
    subprocess.run('git commit -m "chore: Update articles and regenerate audio"', shell=True)
    
    push_res = subprocess.run("git push", shell=True)
    if push_res.returncode != 0:
        print("Lỗi khi push code lên GitHub!")
        sys.exit(1)
    
    print("\n✅ Hoàn tất quy trình!")

if __name__ == "__main__":
    main()
