import ast
import os
import glob

def find_dict_assigned_to_key(node, key_name):
    found_keys = set()
    for child in ast.walk(node):
        if isinstance(child, ast.Dict):
            for k, v in zip(child.keys, child.values):
                if isinstance(k, ast.Constant) and k.value == key_name:
                    if isinstance(v, ast.Dict):
                        for inner_k in v.keys:
                            if isinstance(inner_k, ast.Constant):
                                found_keys.add(inner_k.value)
        elif isinstance(child, ast.Assign):
            for target in child.targets:
                if isinstance(target, ast.Subscript) and isinstance(target.slice, ast.Constant) and target.slice.value == key_name:
                    if isinstance(child.value, ast.Dict):
                        for k in child.value.keys:
                            if isinstance(k, ast.Constant):
                                found_keys.add(k.value)
    return found_keys

def get_dict_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    try:
        tree = ast.parse(content)
        uz_keys = find_dict_assigned_to_key(tree, 'uz')
        en_keys = find_dict_assigned_to_key(tree, 'en')
        return uz_keys, en_keys
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return set(), set()

def main():
    backend_dir = os.path.join(os.path.dirname(__file__), 'morphocheck_backend', 'services')
    py_files = glob.glob(os.path.join(backend_dir, '*.py'))
    
    total_missing = 0
    for file_path in py_files:
        uz, en = get_dict_keys(file_path)
        if uz:
            missing = uz - en
            if missing:
                total_missing += len(missing)
                print(f"File: {os.path.basename(file_path)}")
                print(f"UZ keys: {len(uz)}, EN keys: {len(en)}")
                print(f"Missing in EN: {missing}\n")
    if total_missing == 0:
        print("No missing dictionary keys in backend for EN!")
    else:
        print(f"Total missing keys in backend for EN: {total_missing}")

if __name__ == '__main__':
    main()
