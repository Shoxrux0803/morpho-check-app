import os
import re

def check_imports(src_dir):
    errors = []
    js_files = []
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.js', '.jsx')):
                js_files.append(os.path.join(root, file))
    
    for path in js_files:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Simple regex for relative imports
            matches = re.finditer(r'import\s+.*?\s+from\s+[\'\"](\..*?)[\'\"]', content)
            for match in matches:
                target = match.group(1)
                dir_path = os.path.dirname(path)
                full_target = os.path.normpath(os.path.join(dir_path, target))
                
                # Check for various forms: file, file.js, file.jsx, dir/index.js
                possible_paths = [
                    full_target,
                    full_target + '.js',
                    full_target + '.jsx',
                    os.path.join(full_target, 'index.js'),
                    os.path.join(full_target, 'index.jsx')
                ]
                
                if not any(os.path.exists(p) for p in possible_paths):
                    errors.append(f"{path}: Broken import '{target}'")
        except Exception as e:
            print(f"Error reading {path}: {e}")
            
    return errors

if __name__ == "__main__":
    src_dir = 'src'
    if os.path.exists(src_dir):
        results = check_imports(src_dir)
        if results:
            print("\n".join(results))
        else:
            print("OK")
    else:
        print("src directory not found")
